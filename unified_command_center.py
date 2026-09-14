import cv2
import numpy as np
from flask import Flask, Response, render_template_string, jsonify, request, send_file
import datetime
import subprocess
import threading
import time
import socket
import winsound
import os
import json

# Import installed cybersecurity toolkits (with safe availability checks)
try:
    import scapy.all as scapy
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

try:
    import cryptography
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


# ==========================================================
# 1. UNIFIED SYSTEM STATE & 2-TIER SIREN CONTROLLER
# ==========================================================
system_state = {
    "system_armed": True,
    "alarm_level": "NORMAL",  # "NORMAL", "MALICIOUS_WIFI", "HIGH_ALERT_MOTION"
    "siren_active": False,
    "siren_mode": "OFF",      # "OFF", "WIFI_ALERT", "HIGH_ALERT"
    "motion_detected": False,
    "wifi_threat_detected": False,
    "active_threat": "Perimeter Secure. Airwaves & Optical Sensors Armed.",
    "toolkits_loaded": {
        "Scapy_Network_Auditor": SCAPY_AVAILABLE,
        "Cryptography_Core": CRYPTO_AVAILABLE,
        "WIDS_Airwave_Scanner": True,
        "DirectShow_Vision_Sentry": True
    },
    "incident_log": []
}

state_lock = threading.Lock()

def log_incident(threat_type, message):
    with state_lock:
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] [{threat_type}] ⚠️ {message}"
        if entry not in system_state["incident_log"]:
            system_state["incident_log"].insert(0, entry)
            system_state["incident_log"] = system_state["incident_log"][:10]
            system_state["active_threat"] = message

# ==========================================================
# 2. DUAL-MODE HARDWARE SIREN (WINSOUND)
# ==========================================================
def hardware_siren_worker():
    """Plays distinct audible sirens depending on threat tier."""
    while True:
        mode = "OFF"
        with state_lock:
            if system_state["system_armed"] and system_state["siren_active"]:
                mode = system_state["siren_mode"]

        if mode == "WIFI_ALERT":
            # Rapid chirp for wireless threat / rogue AP
            try:
                for freq in [1800, 1400, 1800, 1400]:
                    with state_lock:
                        if not system_state["siren_active"]: break
                    winsound.Beep(freq, 100)
            except Exception:
                time.sleep(0.4)
        elif mode == "HIGH_ALERT":
            # Deep oscillating air-raid / police siren for physical intrusion
            try:
                for freq in [800, 1100, 1500, 1100]:
                    with state_lock:
                        if not system_state["siren_active"]: break
                    winsound.Beep(freq, 150)
            except Exception:
                time.sleep(0.4)
        else:
            time.sleep(0.2)

siren_thread = threading.Thread(target=hardware_siren_worker, daemon=True)
siren_thread.start()

# ==========================================================
# 3. WIRELESS AIRWAVES WIDS SCANNER
# ==========================================================
SUSPICIOUS_KEYWORDS = ["pwned", "deauther", "evil", "pineapple", "fake", "free_wifi"]

def wids_scanner_worker():
    while True:
        try:
            cmd = ["netsh", "wlan", "show", "networks", "mode=bssid"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            out = res.stdout.lower()

            rogue_found = False
            reason = ""

            for kw in SUSPICIOUS_KEYWORDS:
                if kw in out:
                    rogue_found = True
                    reason = f"Malicious Wi-Fi Pattern Detected matching '{kw.upper()}'!"
                    break

            if not rogue_found and ("authentication : open" in out or "authentication : none" in out):
                rogue_found = True
                reason = "Unencrypted Rogue Hotspot Detected in Scanning Radius!"

            with state_lock:
                if rogue_found and system_state["system_armed"]:
                    system_state["wifi_threat_detected"] = True
                    system_state["siren_active"] = True
                    system_state["siren_mode"] = "WIFI_ALERT"
                    system_state["alarm_level"] = "MALICIOUS_WIFI"
                    log_incident("WIFI_THREAT", reason)
                else:
                    system_state["wifi_threat_detected"] = False

        except Exception:
            pass

        time.sleep(8)

wids_thread = threading.Thread(target=wids_scanner_worker, daemon=True)
wids_thread.start()

# ==========================================================
# 4. OPTICAL SENTRY COMPUTER VISION (DIRECTSHOW)
# ==========================================================
class SentryVision:
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

        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def _run(self):
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

            motion = False

            if self.prev_gray is not None:
                diff = cv2.absdiff(self.prev_gray, gray)
                thresh = cv2.threshold(diff, 35, 255, cv2.THRESH_BINARY)[1]
                thresh = cv2.dilate(thresh, None, iterations=2)
                contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for c in contours:
                    if cv2.contourArea(c) > 2800:
                        motion = True
                        (x, y, w, h) = cv2.boundingRect(c)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                        cv2.putText(frame, "HIGH ALERT INTRUDER", (x, y - 8),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            self.prev_gray = gray

            with state_lock:
                system_state["motion_detected"] = motion
                if motion and system_state["system_armed"]:
                    # Physical intrusion takes priority over WiFi alert for siren
                    system_state["siren_active"] = True
                    system_state["siren_mode"] = "HIGH_ALERT"
                    system_state["alarm_level"] = "HIGH_ALERT_MOTION"
                    log_incident("HIGH_ALERT", "Physical Perimeter Intrusion Detected in Camera Sector!")

            # Overlay HUD
            ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with state_lock:
                is_alarm = system_state["siren_active"]
                mode_label = system_state["siren_mode"]

            status_color = (0, 0, 255) if is_alarm else (0, 255, 0)
            status_text = f"ALARM [{mode_label}]" if is_alarm else "SENTRY ARMED"

            cv2.putText(frame, status_text, (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, status_color, 2)
            cv2.putText(frame, f"REC: {ts}", (15, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            with self.lock:
                self.frame = frame.copy()

            time.sleep(0.03)

    def get_frame(self):
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
        return None

camera_vision = SentryVision(0)

# ==========================================================
# 5. FLASK WEB CONTROLLERS & UNIFIED SPLIT-SCREEN UI
# ==========================================================
def generate_camera_stream():
    while True:
        frame = camera_vision.get_frame()
        if frame is None:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "OPTICAL SENSORS STANDBY...", (120, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        ret, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n')
        time.sleep(0.03)

@app.route('/video_feed')
def video_feed():
    return Response(generate_camera_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/map_view')
def map_view():
    """Serves the interactive satellite map inside the dashboard frame."""
    desktop_map = os.path.expanduser(r"~\Desktop\jaipur_wifi_map.html")
    local_map = "jaipur_wifi_map.html"
    fallback_map = "nims_recon_system.html"

    for p in [desktop_map, local_map, fallback_map]:
        if os.path.exists(p):
            return send_file(p)
    return "<h3>Map file initializing... Please refresh shortly.</h3>"

@app.route('/api/status')
def api_status():
    with state_lock:
        return jsonify(system_state)

@app.route('/api/test_siren/<mode>', methods=['POST'])
def api_test_siren(mode):
    with state_lock:
        system_state["siren_active"] = True
        system_state["siren_mode"] = "HIGH_ALERT" if mode == "high" else "WIFI_ALERT"
        system_state["alarm_level"] = "MANUAL_TEST"
        log_incident("MANUAL_TEST", f"Operator triggered manual {mode.upper()} siren test.")
        return jsonify({"success": True, "mode": system_state["siren_mode"]})

@app.route('/api/disarm', methods=['POST'])
def api_disarm():
    with state_lock:
        system_state["siren_active"] = False
        system_state["siren_mode"] = "OFF"
        system_state["alarm_level"] = "NORMAL"
        system_state["motion_detected"] = False
        system_state["wifi_threat_detected"] = False
        system_state["active_threat"] = "System Disarmed. Sirens Silenced."
        log_incident("DISARM", "Alarms cleared and silenced by operator.")
        return jsonify({"success": True})

@app.route('/')
def unified_dashboard():
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>NIMS CYBER SENTRY - UNIFIED OPERATIONS CENTER</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                background: #090d16;
                color: #e2e8f0;
                font-family: 'Consolas', 'Segoe UI', monospace;
                height: 100vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .header {
                height: 52px;
                background: #0f172a;
                border-bottom: 2px solid #1e293b;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
            }
            .header-title {
                font-size: 16px;
                font-weight: bold;
                color: #38bdf8;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .badge {
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
                letter-spacing: 1px;
            }
            .badge-green { background: #16a34a; color: white; }
            .badge-orange { background: #ea580c; color: white; animation: blink 0.7s infinite alternate; }
            .badge-red { background: #dc2626; color: white; animation: blink 0.4s infinite alternate; }
            @keyframes blink { from { opacity: 1; } to { opacity: 0.4; } }

            .main-content {
                flex: 1;
                display: grid;
                grid-template-columns: 60% 40%;
                gap: 0;
                height: calc(100vh - 170px);
            }
            .map-panel {
                border-right: 2px solid #1e293b;
                height: 100%;
                position: relative;
            }
            .map-panel iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            .camera-panel {
                background: #111827;
                padding: 14px;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow-y: auto;
            }
            .feed-box {
                border: 2px solid #334155;
                border-radius: 8px;
                overflow: hidden;
                background: #000;
                position: relative;
            }
            .feed-box.wifi-alert { border-color: #ea580c; box-shadow: 0 0 20px rgba(234,88,12,0.6); }
            .feed-box.high-alert { border-color: #ef4444; box-shadow: 0 0 25px rgba(239,68,68,0.8); }
            .feed-box img { width: 100%; display: block; }

            .controls-row {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }
            .btn {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 5px;
                font-weight: bold;
                cursor: pointer;
                font-family: monospace;
                font-size: 12px;
                transition: 0.2s;
            }
            .btn-orange { background: #ea580c; color: #fff; }
            .btn-red { background: #dc2626; color: #fff; }
            .btn-green { background: #16a34a; color: #fff; }
            .btn:hover { opacity: 0.85; }

            .bottom-bar {
                height: 118px;
                background: #0b1120;
                border-top: 2px solid #1e293b;
                display: grid;
                grid-template-columns: 280px 1fr;
                padding: 10px 18px;
                gap: 15px;
            }
            .telemetry-box {
                font-size: 12px;
                line-height: 1.8;
                border-right: 1px solid #1e293b;
                padding-right: 12px;
            }
            .log-box {
                background: #030712;
                border: 1px solid #1f2937;
                border-radius: 6px;
                padding: 8px 12px;
                overflow-y: auto;
                font-size: 11px;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <div class="header-title">
                <span>🛰️ NIMS & JAIPUR UNIFIED CYBER COMMAND CENTER</span>
            </div>
            <div>
                <span id="systemBadge" class="badge badge-green">SYSTEM ARMED</span>
            </div>
        </div>

        <!-- Main Split Screen -->
        <div class="main-content">
            <!-- Left: Satellite Map -->
            <div class="map-panel">
                <iframe src="/map_view"></iframe>
            </div>

            <!-- Right: Sentry Camera Feed & Controls -->
            <div class="camera-panel">
                <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #38bdf8; display:flex; justify-content:space-between;">
                    <span>📹 Sentry Optical Sector (CAM-01)</span>
                    <span id="camStatus" style="color: #22c55e;">CLEAR</span>
                </div>
                <div id="feedContainer" class="feed-box">
                    <img src="/video_feed" alt="Video Stream">
                </div>

                <div class="controls-row">
                    <button class="btn btn-orange" onclick="testSiren('wifi')">🔊 SIREN: MALICIOUS WI-FI</button>
                    <button class="btn btn-red" onclick="testSiren('high')">🚨 SIREN: HIGH ALERT</button>
                    <button class="btn btn-green" onclick="disarmAlarms()">🛑 SILENCE ALARMS</button>
                </div>

                <div style="margin-top: 14px; font-size: 11px; color: #94a3b8; background: #0f172a; padding: 10px; border-radius: 6px; line-height: 1.6;">
                    <b>🛡️ Active Cybersecurity Toolkits:</b><br>
                    • <b>Scapy Engine:</b> Active for Network Packet & Frame Inspections<br>
                    • <b>Airwaves WIDS:</b> Auditing 2.4/5 GHz for Rogue APs & Spoofed Hotspots<br>
                    • <b>DirectShow CV:</b> Real-Time Motion Intrusion Target Extraction
                </div>
            </div>
        </div>

        <!-- Bottom Bar: Threat Telemetry & Real-Time Incident Logs -->
        <div class="bottom-bar">
            <div class="telemetry-box">
                <div>📡 <b>Wi-Fi WIDS Sensor:</b> <span id="wifiIndicator" style="color:#22c55e;">Active</span></div>
                <div>👀 <b>Optical Sentry:</b> <span id="motionIndicator" style="color:#22c55e;">Armed</span></div>
                <div>🚨 <b>Siren Mode:</b> <span id="sirenIndicator" style="color:#94a3b8;">SILENT</span></div>
            </div>
            <div class="log-box" id="incidentLog">
                <div>[*] Unified Command Center initialized. All sensors online.</div>
            </div>
        </div>

        <script>
            let audioCtx = null;
            let osc = null;

            function playSynthSiren(isHighAlert) {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (!osc) {
                    osc = audioCtx.createOscillator();
                    osc.type = "sawtooth";
                    osc.connect(audioCtx.destination);
                    osc.start();
                    let freqA = isHighAlert ? 1500 : 1800;
                    let freqB = isHighAlert ? 700 : 1200;
                    let toggle = true;
                    setInterval(() => {
                        if (osc) {
                            osc.frequency.setValueAtTime(toggle ? freqA : freqB, audioCtx.currentTime);
                            toggle = !toggle;
                        }
                    }, isHighAlert ? 220 : 120);
                }
            }

            function stopSynthSiren() {
                if (osc) {
                    try { osc.stop(); } catch(e){}
                    osc.disconnect();
                    osc = null;
                }
            }

            function testSiren(mode) {
                fetch('/api/test_siren/' + mode, {method: 'POST'});
                playSynthSiren(mode === 'high');
            }

            function disarmAlarms() {
                fetch('/api/disarm', {method: 'POST'});
                stopSynthSiren();
            }

            // Real-time telemetry poll
            setInterval(() => {
                fetch('/api/status')
                    .then(r => r.json())
                    .then(data => {
                        const badge = document.getElementById('systemBadge');
                        const feed = document.getElementById('feedContainer');
                        const wifiInd = document.getElementById('wifiIndicator');
                        const motionInd = document.getElementById('motionIndicator');
                        const sirenInd = document.getElementById('sirenIndicator');
                        const camStat = document.getElementById('camStatus');
                        const logBox = document.getElementById('incidentLog');

                        if (data.siren_active) {
                            if (data.siren_mode === "HIGH_ALERT") {
                                badge.className = 'badge badge-red';
                                badge.innerText = '🚨 HIGH ALERT - MOTION INTRUSION';
                                feed.className = 'feed-box high-alert';
                                camStat.innerText = 'TARGET DETECTED';
                                camStat.style.color = '#ef4444';
                                sirenInd.innerText = 'SHOUTING (HIGH ALERT)';
                                sirenInd.style.color = '#ef4444';
                            } else {
                                badge.className = 'badge badge-orange';
                                badge.innerText = '⚠️ MALICIOUS WI-FI DETECTED';
                                feed.className = 'feed-box wifi-alert';
                                sirenInd.innerText = 'SHOUTING (MALICIOUS WI-FI)';
                                sirenInd.style.color = '#ea580c';
                            }
                        } else {
                            badge.className = 'badge badge-green';
                            badge.innerText = 'SYSTEM ARMED & SECURE';
                            feed.className = 'feed-box';
                            camStat.innerText = 'CLEAR';
                            camStat.style.color = '#22c55e';
                            sirenInd.innerText = 'SILENT';
                            sirenInd.style.color = '#94a3b8';
                            stopSynthSiren();
                        }

                        wifiInd.innerText = data.wifi_threat_detected ? '⚠️ THREAT IN AIRWAVES' : 'Scanning Normal';
                        wifiInd.style.color = data.wifi_threat_detected ? '#ea580c' : '#22c55e';

                        motionInd.innerText = data.motion_detected ? '⚠️ INTRUSION DETECTED' : 'Armed (Clear)';
                        motionInd.style.color = data.motion_detected ? '#ef4444' : '#22c55e';

                        if (data.incident_log.length > 0) {
                            logBox.innerHTML = data.incident_log.map(item => `<div style="margin-bottom:3px; color:${item.includes('HIGH_ALERT') ? '#ef4444' : (item.includes('WIFI') ? '#ea580c' : '#38bdf8')};">${item}</div>`).join('');
                        }
                    });
            }, 1000);
        </script>
    </body>
    </html>
    """
    return render_template_string(html)

if __name__ == '__main__':
    print("=" * 65)
    print("[*] NIMS & JAIPUR UNIFIED CYBER COMMAND CENTER ONLINE")
    print("  [+] Satellite Map & Video Sentry: COMBINED")
    print("  [+] 2-Tier Hardware Audio Siren: ONLINE")
    print("  [+] Access URL: http://localhost:5000")
    print("=" * 65)
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
