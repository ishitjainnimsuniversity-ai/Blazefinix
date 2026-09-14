import cv2
import numpy as np
from flask import Flask, Response, render_template_string, jsonify, request
import datetime
import subprocess
import threading
import time
import socket
import winsound

app = Flask(__name__)

# ==========================================================
# GLOBAL SECURITY SENTRY STATE
# ==========================================================
sentry_state = {
    "system_armed": True,
    "siren_sounding": False,
    "motion_detected": False,
    "wifi_threat_detected": False,
    "active_threat_message": "All Systems Normal. Perimeter Secure.",
    "recent_threats": []
}

state_lock = threading.Lock()

# Suspicious signatures for Rogue APs & WiFi attacks
SUSPICIOUS_SSID_SIGNATURES = [
    "pwned", "deauther", "pineapple", "evil", "free_wifi", 
    "fake", "hack", "rogue", "guest_free", "att_free"
]

def add_threat_log(threat_text):
    with state_lock:
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] ⚠️ {threat_text}"
        if entry not in sentry_state["recent_threats"]:
            sentry_state["recent_threats"].insert(0, entry)
            sentry_state["recent_threats"] = sentry_state["recent_threats"][:8]
            sentry_state["active_threat_message"] = threat_text

# ==========================================================
# 1. HARDWARE SIREN ENGINE (WINSOUND)
# ==========================================================
def sound_siren_loop():
    """Plays an authentic dual-tone emergency police/air-raid siren."""
    while True:
        play_siren = False
        with state_lock:
            play_siren = sentry_state["system_armed"] and sentry_state["siren_sounding"]

        if play_siren:
            try:
                # Oscillating high-low emergency frequencies
                for freq in [1500, 1300, 1000, 800, 1200, 1600]:
                    with state_lock:
                        if not (sentry_state["system_armed"] and sentry_state["siren_sounding"]):
                            break
                    winsound.Beep(freq, 120)
            except Exception:
                time.sleep(0.5)
        else:
            time.sleep(0.3)

# Launch siren background thread
siren_thread = threading.Thread(target=sound_siren_loop, daemon=True)
siren_thread.start()

# ==========================================================
# 2. WIRELESS INTRUSION DETECTION SYSTEM (WIDS)
# ==========================================
def wifi_threat_scanner():
    """Continuously audits 2.4/5GHz airwaves for Rogue APs & Evil Twins."""
    while True:
        try:
            cmd = ["netsh", "wlan", "show", "networks", "mode=bssid"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            output = result.stdout.lower()

            threat_found = False
            threat_reason = ""

            # Check 1: Suspicious Rogue AP signatures
            for sig in SUSPICIOUS_SSID_SIGNATURES:
                if sig in output:
                    threat_found = True
                    threat_reason = f"Rogue Access Point Detected matching signature '{sig.upper()}'!"
                    break

            # Check 2: Evil Twin / Unencrypted Rogue Detection
            # Flag if an open unencrypted network appears without authentication
            if "authentication : open" in output or "authentication : none" in output:
                threat_found = True
                threat_reason = "Unencrypted Rogue Hotspot Detected in Perimeter!"

            with state_lock:
                if threat_found and sentry_state["system_armed"]:
                    sentry_state["wifi_threat_detected"] = True
                    sentry_state["siren_sounding"] = True
                    add_threat_log(threat_reason)
                else:
                    sentry_state["wifi_threat_detected"] = False

        except Exception as e:
            pass

        time.sleep(7)  # Scan interval

# Launch Wi-Fi WIDS scanner thread
wids_thread = threading.Thread(target=wifi_threat_scanner, daemon=True)
wids_thread.start()

# ==========================================================
# 3. COMPUTER VISION INTRUDER & MOTION DETECTION
# ==========================================================
class CameraSentry:
    def __init__(self, src=0):
        self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(src)
            
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        self.prev_gray = None
        self.frame = None
        self.lock = threading.Lock()
        self.running = True
        
        self.thread = threading.Thread(target=self._process, daemon=True)
        self.thread.start()

    def _process(self):
        while self.running:
            if not self.cap.isOpened():
                time.sleep(0.1)
                continue

            success, frame = self.cap.read()
            if not success or frame is None:
                time.sleep(0.04)
                continue

            frame = cv2.resize(frame, (640, 480))
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)

            motion_detected = False

            if self.prev_gray is not None:
                # Frame differencing for real-time motion detection
                delta = cv2.absdiff(self.prev_gray, gray)
                thresh = cv2.threshold(delta, 35, 255, cv2.THRESH_BINARY)[1]
                thresh = cv2.dilate(thresh, None, iterations=2)
                contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for c in contours:
                    if cv2.contourArea(c) > 2500:  # Sensitivity threshold
                        motion_detected = True
                        (x, y, w, h) = cv2.boundingRect(c)
                        # Draw high-visibility red intrusion target box
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                        cv2.putText(frame, "TARGET DETECTED", (x, y - 8), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            self.prev_gray = gray

            with state_lock:
                sentry_state["motion_detected"] = motion_detected
                if motion_detected and sentry_state["system_armed"]:
                    sentry_state["siren_sounding"] = True
                    add_threat_log("Physical Motion Intrusion Detected in Camera Sector!")

            # Overlay Sentry HUD
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            is_sounding = sentry_state["siren_sounding"]

            # HUD Top Bar
            status_color = (0, 0, 255) if is_sounding else (0, 255, 0)
            status_text = "ALARM ACTIVE - SIREN SHOUTING" if is_sounding else "ARMED & PATROLLING"

            cv2.putText(frame, f"SENTRY: {status_text}", (15, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, status_color, 2)
            cv2.putText(frame, f"TIME: {timestamp}", (15, 460), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            with self.lock:
                self.frame = frame.copy()

            time.sleep(0.03)

    def get_frame(self):
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
        return None

camera_sentry = CameraSentry(0)

# ==========================================================
# 4. WEB DASHBOARD & API CONTROLS
# ==========================================================
def generate_frames():
    while True:
        frame = camera_sentry.get_frame()
        if frame is None:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "INITIALIZING CAMERA SENSORS...", (120, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        time.sleep(0.03)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def api_status():
    with state_lock:
        return jsonify(sentry_state)

@app.route('/api/toggle_alarm', methods=['POST'])
def api_toggle_alarm():
    with state_lock:
        sentry_state["siren_sounding"] = not sentry_state["siren_sounding"]
        return jsonify({"siren_sounding": sentry_state["siren_sounding"]})

@app.route('/api/disarm', methods=['POST'])
def api_disarm():
    with state_lock:
        sentry_state["siren_sounding"] = False
        sentry_state["motion_detected"] = False
        sentry_state["wifi_threat_detected"] = False
        sentry_state["active_threat_message"] = "System Disarmed. Alarm Silenced."
        return jsonify({"success": True})

@app.route('/')
def index():
    html_page = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>NIMS CYBER SENTRY & SIREN DEFENSE SYSTEM</title>
        <style>
            body {
                background: #090d16;
                color: #e2e8f0;
                font-family: 'Consolas', 'Segoe UI', monospace;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            h1 {
                color: #38bdf8;
                margin: 0;
                font-size: 24px;
                letter-spacing: 2px;
            }
            .grid {
                display: grid;
                grid-template-columns: 660px 380px;
                gap: 20px;
            }
            .card {
                background: #131d2e;
                border: 1px solid #1e293b;
                border-radius: 10px;
                padding: 16px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            }
            .video-box {
                border: 3px solid #334155;
                border-radius: 8px;
                overflow: hidden;
                background: #000;
                position: relative;
            }
            .video-box.alarm {
                border-color: #ef4444;
                box-shadow: 0 0 25px rgba(239, 68, 68, 0.7);
                animation: pulse 0.8s infinite alternate;
            }
            @keyframes pulse {
                from { border-color: #ef4444; }
                to { border-color: #fbbf24; }
            }
            img {
                width: 100%;
                display: block;
            }
            .btn {
                background: #0284c7;
                color: #fff;
                border: none;
                padding: 12px 18px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                font-family: monospace;
                font-size: 13px;
                margin-right: 8px;
                margin-top: 10px;
                transition: 0.2s;
            }
            .btn-danger { background: #dc2626; }
            .btn-success { background: #16a34a; }
            .btn:hover { opacity: 0.9; }
            .threat-box {
                background: #090d16;
                border: 1px solid #334155;
                padding: 12px;
                border-radius: 6px;
                height: 240px;
                overflow-y: auto;
                font-size: 12px;
                line-height: 1.6;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .badge-green { background: #16a34a; color: white; }
            .badge-red { background: #dc2626; color: white; animation: pulse 0.5s infinite alternate; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🛡️ NIMS CYBER SENTRY & SIREN DEFENSE</h1>
            <p style="color:#94a3b8; font-size:13px; margin:5px 0;">Automated Computer Vision Intruder Detection & Real-Time WIDS Rogue Wi-Fi Shield</p>
        </div>

        <div class="grid">
            <!-- Left: Video Camera Feed -->
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <b>📹 Sentry Sector Feed (CAM-01)</b>
                    <span id="alarmBadge" class="status-badge badge-green">SYSTEM ARMED</span>
                </div>
                <div id="videoContainer" class="video-box">
                    <img src="/video_feed" alt="Video Stream">
                </div>
                <div style="margin-top:12px;">
                    <button class="btn btn-danger" onclick="triggerSiren()">🔊 TEST / TRIGGER SIREN</button>
                    <button class="btn btn-success" onclick="silenceSiren()">🛑 SILENCE / DISARM ALARM</button>
                </div>
            </div>

            <!-- Right: Threat Intelligence & Logs -->
            <div class="card">
                <h3 style="margin-top:0; color:#38bdf8; font-size:16px;">🛰️ Live Threat Telemetry</h3>
                <div style="margin-bottom:12px; font-size:13px;">
                    <div>📡 <b>Wi-Fi WIDS Sensor:</b> <span id="wifiStatus" style="color:#22c55e;">Scanning Airwaves</span></div>
                    <div>👀 <b>Motion Sensor:</b> <span id="motionStatus" style="color:#22c55e;">No Intrusion</span></div>
                </div>

                <b style="font-size:12px;">🚨 Real-Time Incident Feed:</b>
                <div id="threatLogs" class="threat-box" style="margin-top:6px;">
                    <div>[*] System initialized. Sentry shield active.</div>
                </div>

                <div style="margin-top:14px; font-size:11px; color:#64748b; line-height:1.5;">
                    <b>Defense Rule:</b> If unauthorized rogue Wi-Fi signals (Evil Twin, open deauther frames) or physical motion intruders are detected, the system immediately sounds the hardware speaker siren.
                </div>
            </div>
        </div>

        <script>
            // Audio synthesizer backup for browser
            let audioCtx = null;
            let osc = null;

            function playWebSiren() {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (!osc) {
                    osc = audioCtx.createOscillator();
                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                    osc.connect(audioCtx.destination);
                    osc.start();
                    // Modulate frequency
                    let up = true;
                    setInterval(() => {
                        if (osc) {
                            osc.frequency.setValueAtTime(up ? 1400 : 700, audioCtx.currentTime);
                            up = !up;
                        }
                    }, 250);
                }
            }

            function stopWebSiren() {
                if (osc) {
                    try { osc.stop(); } catch(e){}
                    osc.disconnect();
                    osc = null;
                }
            }

            function triggerSiren() {
                fetch('/api/toggle_alarm', {method: 'POST'});
                playWebSiren();
            }

            function silenceSiren() {
                fetch('/api/disarm', {method: 'POST'});
                stopWebSiren();
            }

            // Real-time telemetry poll
            setInterval(() => {
                fetch('/api/status')
                    .then(r => r.json())
                    .then(data => {
                        const badge = document.getElementById('alarmBadge');
                        const box = document.getElementById('videoContainer');
                        const wifiStatus = document.getElementById('wifiStatus');
                        const motionStatus = document.getElementById('motionStatus');
                        const logs = document.getElementById('threatLogs');

                        if (data.siren_sounding) {
                            badge.className = 'status-badge badge-red';
                            badge.innerText = '🚨 ALARM ACTIVE - SIREN ON';
                            box.className = 'video-box alarm';
                        } else {
                            badge.className = 'status-badge badge-green';
                            badge.innerText = 'SYSTEM ARMED';
                            box.className = 'video-box';
                            stopWebSiren();
                        }

                        wifiStatus.innerText = data.wifi_threat_detected ? '⚠️ THREAT DETECTED' : 'Scanning (Normal)';
                        wifiStatus.style.color = data.wifi_threat_detected ? '#ef4444' : '#22c55e';

                        motionStatus.innerText = data.motion_detected ? '⚠️ MOTION DETECTED' : 'Clear';
                        motionStatus.style.color = data.motion_detected ? '#ef4444' : '#22c55e';

                        if (data.recent_threats.length > 0) {
                            logs.innerHTML = data.recent_threats.map(t => `<div style="color:#ef4444; margin-bottom:4px;">${t}</div>`).join('');
                        }
                    });
            }, 1000);
        </script>
    </body>
    </html>
    """
    return render_template_string(html_page)

if __name__ == '__main__':
    print("=" * 65)
    print("[*] NIMS CYBER SENTRY & SIREN DEFENSE SYSTEM ONLINE")
    print("  [+] Computer Vision Motion & Intruder Detector: ACTIVE")
    print("  [+] WIDS Wireless Airwaves Threat Scanner:     ACTIVE")
    print("  [+] Hardware Emergency Audio Siren:           ONLINE")
    print("  [+] Dashboard URL: http://localhost:5000")
    print("=" * 65)
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
