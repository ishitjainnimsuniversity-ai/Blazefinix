import os

source_file = r"c:\Users\ishit jain\Documents\antigravity\quirky-bell\nims_recon_system.html"
desktop_file = r"c:\Users\ishit jain\Desktop\nims_recon_system.html"

with open(source_file, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Clean up any previous HUD overlays
for marker in ["<div id=\"cyberSentryOverlay\"", "<div id=\"cyberSentryHud\"", "<!-- =========================================="]:
    if marker in html:
        idx = html.find(marker)
        # Find where it ends
        end_marker = "</div>\n\n<script>"
        end_idx = html.find("</script>", idx)
        if end_idx != -1:
            html = html[:idx] + html[end_idx + 9:]

# 2. Pure RF Measurement, Threat & ESP8266 Blinker HUD (NO OPENCV)
rf_data_hud = """
<!-- =========================================================
     PURE RF MEASUREMENT, AUTOMATIC SIREN & ESP8266 PULSER HUD
     ========================================================= -->
<div id="rfSentinelPanel" style="
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 99999 !important;
    width: 420px !important;
    background: rgba(11, 17, 32, 0.96) !important;
    border: 2px solid #38bdf8 !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85) !important;
    font-family: 'Consolas', 'Segoe UI', monospace !important;
    color: #f8fafc !important;
    overflow: hidden !important;
    backdrop-filter: blur(10px) !important;
">
    <!-- Header -->
    <div style="background: #0f172a; padding: 12px 16px; border-bottom: 2px solid #1e293b; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <span style="color: #38bdf8; font-weight: bold; font-size: 14px; letter-spacing: 1px;">📡 NIMS RF CYBER SENTINEL</span><br>
            <span style="font-size: 10px; color: #94a3b8;">Real-Time Data Measurements & Hardware Telemetry</span>
        </div>
        <span id="rfBadge" style="background: #16a34a; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">SHIELD ACTIVE</span>
    </div>

    <div style="padding: 14px;">
        <!-- ESP8266 Hardware Status -->
        <div style="background: #030712; border: 1px solid #1e293b; border-radius: 6px; padding: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <b style="color: #38bdf8; font-size: 12px;">⚡ ESP8266 (COM3)</b><br>
                <span style="font-size: 10px; color: #94a3b8;">Continuous Heartbeat Pulse</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <span id="espDot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #00d2ff; box-shadow: 0 0 10px #00d2ff; animation: pulseLed 0.3s infinite alternate;"></span>
                <span id="espStatus" style="font-size: 11px; font-weight: bold; color: #00d2ff;">BLINKING</span>
            </div>
        </div>

        <style>
            @keyframes pulseLed {
                from { opacity: 1; transform: scale(1.1); }
                to { opacity: 0.2; transform: scale(0.9); }
            }
        </style>

        <!-- Live RF Signal Measurements -->
        <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 11px; line-height: 1.8;">
            <div style="color: #38bdf8; font-weight: bold; border-bottom: 1px solid #1e293b; padding-bottom: 4px; margin-bottom: 6px;">
                📊 LIVE AIRWAVE MEASUREMENTS (2.4 / 5 GHz)
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>📡 Networks in Live Range:</span>
                <b id="liveNetCount" style="color: #f8fafc;">Scanning...</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>📶 Peak Signal Strength:</span>
                <b id="livePeakSig" style="color: #22c55e;">--</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>🎯 Active Channels:</span>
                <b id="liveChannels" style="color: #f8fafc;">--</b>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px dashed #1e293b; padding-top: 4px; margin-top: 4px;">
                <span>🚨 Vulnerable (WEP / Open):</span>
                <b id="vulnCount" style="color: #ef4444;">Auto-Tracking</b>
            </div>
        </div>

        <!-- Automatic Siren Status & Controls -->
        <div style="background: #111827; border: 1px solid #1e293b; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #94a3b8; font-weight: bold;">🔊 AUTOMATIC THREAT SIREN:</span>
                <span id="sirenIndicator" style="font-size: 11px; font-weight: bold; color: #22c55e;">ARMED (STANDBY)</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button onclick="testSiren()" style="background: #dc2626; color: white; border: none; padding: 9px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer; font-family: monospace;">🔊 TEST SIREN</button>
                <button onclick="silenceSiren()" style="background: #16a34a; color: white; border: none; padding: 9px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer; font-family: monospace;">🛑 SILENCE / DISARM</button>
            </div>
        </div>

        <!-- Incident & Threat Stream -->
        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; font-weight: bold;">🚨 LIVE THREAT DETECTION FEED:</div>
        <div id="rfIncidentLogs" style="background: #030712; border: 1px solid #1f2937; padding: 8px; border-radius: 4px; max-height: 85px; overflow-y: auto; font-size: 10px; color: #ef4444; line-height: 1.5;">
            <div style="color: #22c55e;">[*] RF Sentinel armed. Continuous monitoring active.</div>
        </div>
    </div>
</div>

<script>
    let rfAudioCtx = null;
    let rfOsc = null;

    function playWebSirenAudio() {
        if (!rfAudioCtx) rfAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!rfOsc) {
            rfOsc = rfAudioCtx.createOscillator();
            rfOsc.type = "sawtooth";
            rfOsc.connect(rfAudioCtx.destination);
            rfOsc.start();
            let toggle = true;
            setInterval(() => {
                if (rfOsc) {
                    rfOsc.frequency.setValueAtTime(toggle ? 1600 : 900, rfAudioCtx.currentTime);
                    toggle = !toggle;
                }
            }, 150);
        }
    }

    function stopWebSirenAudio() {
        if (rfOsc) {
            try { rfOsc.stop(); } catch(e){}
            rfOsc.disconnect();
            rfOsc = null;
        }
    }

    function testSiren() {
        fetch('http://localhost:5000/api/test_siren', {method: 'POST'}).catch(e => {});
        playWebSirenAudio();
    }

    function silenceSiren() {
        fetch('http://localhost:5000/api/silence', {method: 'POST'}).catch(e => {});
        stopWebSirenAudio();
    }

    // Telemetry Sync with Python Backend
    setInterval(() => {
        fetch('http://localhost:5000/api/status')
            .then(res => res.json())
            .then(data => {
                const badge = document.getElementById('rfBadge');
                const sirenInd = document.getElementById('sirenIndicator');
                const netCount = document.getElementById('liveNetCount');
                const peakSig = document.getElementById('livePeakSig');
                const channels = document.getElementById('liveChannels');
                const logs = document.getElementById('rfIncidentLogs');

                if (data.siren_active) {
                    badge.style.background = '#dc2626';
                    badge.innerText = '🚨 SIREN SHOUTING';
                    sirenInd.innerText = 'SHOUTING (ALARM)';
                    sirenInd.style.color = '#ef4444';
                    playWebSirenAudio();
                } else {
                    badge.style.background = '#16a34a';
                    badge.innerText = 'SHIELD ACTIVE';
                    sirenInd.innerText = 'ARMED (STANDBY)';
                    sirenInd.style.color = '#22c55e';
                    stopWebSirenAudio();
                }

                if (data.live_measurements) {
                    netCount.innerText = data.live_measurements.networks_in_range + ' Networks';
                    peakSig.innerText = data.live_measurements.highest_signal_pct + '%';
                    channels.innerText = data.live_measurements.active_channels.join(', ') || 'Ch 1';
                }

                if (data.threat_history && data.threat_history.length > 0) {
                    logs.innerHTML = data.threat_history.map(t => `<div style="margin-bottom: 2px;">${t}</div>`).join('');
                }
            })
            .catch(err => {});
    }, 1000);
</script>
"""

# Insert inside <body>
body_tag = "<body>"
idx = html.find(body_tag) + len(body_tag)
updated_html = html[:idx] + "\n" + rf_data_hud + "\n" + html[idx:]

with open(source_file, "w", encoding="utf-8") as f:
    f.write(updated_html)

with open(desktop_file, "w", encoding="utf-8") as f:
    f.write(updated_html)

print("[+] Successfully updated nims_recon_system.html with Pure RF Data Measurements and ESP8266 Continuous Pulse!")
print(f"    --> Saved to: {desktop_file}")
