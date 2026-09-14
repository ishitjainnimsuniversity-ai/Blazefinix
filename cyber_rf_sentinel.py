import os
import subprocess
import threading
import time
import datetime
import socket
import winsound
import serial
from flask import Flask, jsonify, request, render_template_string

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# ==========================================================
# 1. REAL-TIME DATA TELEMETRY & THREAT STATE
# ==========================================================
sentinel_state = {
    "system_armed": True,
    "siren_active": False,
    "siren_trigger_reason": "None. Normal Scan.",
    "esp8266_connected": False,
    "esp8266_heartbeat_count": 0,
    "live_measurements": {
        "networks_in_range": 0,
        "highest_signal_pct": 0,
        "active_channels": [],
        "networks": []
    },
    "threat_history": []
}

state_lock = threading.Lock()

def record_threat(reason):
    with state_lock:
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        entry = f"[{ts}] 🚨 {reason}"
        if entry not in sentinel_state["threat_history"]:
            sentinel_state["threat_history"].insert(0, entry)
            sentinel_state["threat_history"] = sentinel_state["threat_history"][:8]
            sentinel_state["siren_trigger_reason"] = reason

# ==========================================================
# 2. CONTINUOUS ESP8266 HARDWARE LED BLINKER (COM3)
# ==========================================================
def esp8266_continuous_blinker():
    """Streams continuous high-frequency UART pulse trains with dtr=False so the LED blinks rapidly without resetting."""
    ser = None
    while True:
        try:
            if ser is None or not ser.is_open:
                ser = serial.Serial('COM3', 115200, timeout=0.05)
                ser.dtr = False
                ser.rts = False
                with state_lock:
                    sentinel_state["esp8266_connected"] = True

            # Rapid alternating UART square wave bursts (0x55 = 'U' = 01010101 in binary)
            # Triggers high-frequency transitions on the TX line so the onboard LED flashes vigorously
            ser.write(b'U' * 128)
            time.sleep(0.04)

            with state_lock:
                sentinel_state["esp8266_heartbeat_count"] += 1

        except Exception:
            with state_lock:
                sentinel_state["esp8266_connected"] = False
            if ser is not None:
                try: ser.close()
                except Exception: pass
                ser = None
            time.sleep(0.5)

esp_thread = threading.Thread(target=esp8266_continuous_blinker, daemon=True)
esp_thread.start()


# ==========================================================
# 3. AUTOMATIC SIREN ENGINE (WINSOUND)
# ==========================================================
def automated_siren_worker():
    """Automatically screams whenever a malicious or unencrypted/WEP network is detected."""
    while True:
        play_now = False
        with state_lock:
            play_now = sentinel_state["system_armed"] and sentinel_state["siren_active"]

        if play_now:
            try:
                # Oscillating emergency alarm frequencies
                for freq in [1600, 1200, 1800, 900]:
                    with state_lock:
                        if not sentinel_state["siren_active"]: break
                    winsound.Beep(freq, 120)
            except Exception:
                time.sleep(0.3)
        else:
            time.sleep(0.2)

siren_thread = threading.Thread(target=automated_siren_worker, daemon=True)
siren_thread.start()

# ==========================================================
# 4. LIVE RF AIRWAVE MEASUREMENT & AUTOMATIC THREAT ENGINE
# ==========================================================
SUSPICIOUS_NAMES = ["pwned", "deauther", "pineapple", "evil", "free_wifi", "fake"]

def rf_scanner_worker():
    while True:
        try:
            cmd = ["netsh", "wlan", "show", "networks", "mode=bssid"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
            lines = res.stdout.splitlines()

            networks = []
            curr_net = {}
            threat_found = False
            threat_text = ""

            for line in lines:
                l = line.strip()
                if l.startswith("SSID ") and ":" in l:
                    if curr_net and "ssid" in curr_net:
                        networks.append(curr_net)
                    curr_net = {"ssid": l.split(":", 1)[1].strip() or "<Hidden SSID>"}
                elif l.startswith("Authentication") and ":" in l:
                    curr_net["auth"] = l.split(":", 1)[1].strip()
                elif l.startswith("Encryption") and ":" in l:
                    curr_net["encryption"] = l.split(":", 1)[1].strip()
                elif l.startswith("BSSID ") and ":" in l:
                    curr_net["bssid"] = l.split(":", 1)[1].strip()
                elif l.startswith("Signal") and ":" in l:
                    curr_net["signal"] = l.split(":", 1)[1].strip()
                elif l.startswith("Channel") and ":" in l:
                    curr_net["channel"] = l.split(":", 1)[1].strip()

            if curr_net and "ssid" in curr_net:
                networks.append(curr_net)

            # Analyze for threats and auto-trigger siren
            max_sig = 0
            channels_seen = set()

            for n in networks:
                ssid_lower = n.get("ssid", "").lower()
                auth = n.get("auth", "")
                enc = n.get("encryption", "")
                sig_str = n.get("signal", "0%").replace("%", "").strip()
                try:
                    sig_val = int(sig_str)
                    if sig_val > max_sig: max_sig = sig_val
                except ValueError:
                    pass

                ch = n.get("channel")
                if ch: channels_seen.add(ch)

                # Automatic Siren Trigger Condition 1: WEP or Open Network
                if "wep" in auth.lower() or "open" in auth.lower() or "wep" in enc.lower():
                    threat_found = True
                    threat_text = f"MALICIOUS/VULNERABLE WI-FI: '{n.get('ssid')}' uses broken {auth or enc}!"

                # Automatic Siren Trigger Condition 2: Known Hacker Rogue AP signature
                for s in SUSPICIOUS_NAMES:
                    if s in ssid_lower:
                        threat_found = True
                        threat_text = f"ROGUE ACCESS POINT DETECTED matching '{s.upper()}' ({n.get('ssid')})!"
                        break

            with state_lock:
                sentinel_state["live_measurements"]["networks_in_range"] = len(networks)
                sentinel_state["live_measurements"]["highest_signal_pct"] = max_sig
                sentinel_state["live_measurements"]["active_channels"] = sorted(list(channels_seen))
                sentinel_state["live_measurements"]["networks"] = networks

                if threat_found and sentinel_state["system_armed"]:
                    sentinel_state["siren_active"] = True
                    record_threat(threat_text)

        except Exception:
            pass

        time.sleep(6)  # Scan cycle

scanner_thread = threading.Thread(target=rf_scanner_worker, daemon=True)
scanner_thread.start()

# ==========================================================
# 5. REST APIS & DIRECT COMMAND DASHBOARD
# ==========================================================
@app.route('/api/status')
def api_status():
    with state_lock:
        return jsonify(sentinel_state)

@app.route('/api/test_siren', methods=['POST'])
def api_test_siren():
    with state_lock:
        sentinel_state["siren_active"] = True
        record_threat("Operator Triggered Manual Alarm Test.")
        return jsonify({"success": True})

@app.route('/api/silence', methods=['POST'])
def api_silence():
    with state_lock:
        sentinel_state["siren_active"] = False
        sentinel_state["siren_trigger_reason"] = "Silenced by Operator."
        return jsonify({"success": True})

@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>NIMS Cyber RF Sentinel</title>
        <style>
            body { background: #090d16; color: #f8fafc; font-family: monospace; padding: 20px; }
            .card { background: #111827; border: 1px solid #1e293b; padding: 20px; border-radius: 8px; max-width: 600px; }
            button { padding: 10px 15px; font-family: monospace; font-weight: bold; cursor: pointer; border: none; border-radius: 4px; margin-right: 8px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2 style="color:#38bdf8;">🛰️ CYBER RF SENTINEL ONLINE</h2>
            <p>ESP8266 Status: Continuous Pulsing Active on COM3</p>
            <p>Automatic Siren: Armed for WEP / Rogue Wi-Fi</p>
            <button style="background:#dc2626; color:#fff;" onclick="fetch('/api/test_siren',{method:'POST'})">TEST SIREN</button>
            <button style="background:#16a34a; color:#fff;" onclick="fetch('/api/silence',{method:'POST'})">SILENCE</button>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("=" * 65)
    print("[*] NIMS CYBER RF SENTINEL ONLINE (OPENCV REMOVED)")
    print("  [+] ESP8266 Continuous Pulse (COM3): ACTIVE")
    print("  [+] Automated Threat Siren:         ARMED")
    print("  [+] RF Airwave Measurement Scanner: ACTIVE")
    print("  [+] Dashboard Port: 5000")
    print("=" * 65)
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
