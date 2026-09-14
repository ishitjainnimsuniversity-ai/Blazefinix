import os

source_file = r"c:\Users\ishit jain\Documents\antigravity\quirky-bell\nims_recon_system.html"
desktop_file = r"c:\Users\ishit jain\Desktop\nims_recon_system.html"

with open(source_file, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Clean up any previous injection after </html>
if "<!-- ==========================================" in html:
    idx = html.find("<!-- ==========================================")
    html = html[:idx].rstrip() + "\n</html>"

# 2. Build the prominent, high-tech Sentry & WIDS HUD component
sentry_hud = """
<!-- =========================================================
     PROMINENT CYBER SENTRY, WIDS & DUAL SIREN COMMAND PANEL
     ========================================================= -->
<div id="cyberSentryOverlay" style="
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 99999 !important;
    width: 440px !important;
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
            <span style="color: #38bdf8; font-weight: bold; font-size: 14px; letter-spacing: 1px;">🛡️ NIMS CYBER SENTRY</span><br>
            <span style="font-size: 10px; color: #94a3b8;">Computer Vision Intrusion & WIDS Shield</span>
        </div>
        <span id="sentryBadge" style="background: #16a34a; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">ARMED & PATROLLING</span>
    </div>

    <!-- Live Sentry Camera Window (Motion & Intruder Detection) -->
    <div style="padding: 14px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; font-weight: bold;">
            <span style="color: #38bdf8;">📹 Optical Sentry (CAM-01)</span>
            <span id="targetStatus" style="color: #22c55e;">STATUS: CLEAR</span>
        </div>
        <div id="videoContainer" style="border: 2px solid #334155; border-radius: 8px; overflow: hidden; background: #000; position: relative;">
            <img id="liveFeedImg" src="http://localhost:5000/video_feed" style="width: 100%; height: auto; display: block;" alt="Live Sentry Feed" onerror="this.src='https://via.placeholder.com/640x480/000000/00ff00?text=SENTRY+SERVER+OFFLINE'">
        </div>

        <!-- Two-Tier Emergency Siren Controls -->
        <div style="margin-top: 12px;">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 5px; font-weight: bold;">🔊 DUAL EMERGENCY SIRENS:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button onclick="sentrySiren('wifi')" style="background: #ea580c; color: white; border: none; padding: 9px 4px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer; font-family: monospace;">🔊 SIREN: MALICIOUS WI-FI</button>
                <button onclick="sentrySiren('high')" style="background: #dc2626; color: white; border: none; padding: 9px 4px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer; font-family: monospace;">🚨 SIREN: HIGH ALERT</button>
            </div>
            <button onclick="silenceSentry()" style="width: 100%; background: #16a34a; color: white; border: none; padding: 8px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; margin-top: 8px; font-family: monospace;">🛑 SILENCE / DISARM ALARMS</button>
        </div>

        <!-- Live Sensor Telemetry -->
        <div style="margin-top: 12px; font-size: 11px; background: #030712; padding: 10px 12px; border-radius: 6px; border: 1px solid #1f2937; line-height: 1.7;">
            <div>📡 <b>WIDS Airwaves:</b> <span id="widsIndicator" style="color: #22c55e;">Scanning 2.4/5GHz (Clear)</span></div>
            <div>👀 <b>Optical Motion:</b> <span id="motionIndicator" style="color: #22c55e;">No Intrusion Detected</span></div>
            <div>🛰️ <b>Radar Intel:</b> <span style="color: #38bdf8;">100 Mapped Campus Nodes (🔴 15 Open | 🟢 85 WPA2/3)</span></div>
        </div>

        <!-- Real-Time Incident Feed -->
        <div style="margin-top: 10px;">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: bold;">🚨 INCIDENT LOGS:</div>
            <div id="hudIncidentLogs" style="background: #030712; border: 1px solid #1f2937; padding: 8px; border-radius: 4px; max-height: 80px; overflow-y: auto; font-size: 10px; color: #ef4444; line-height: 1.5;">
                <div style="color: #22c55e;">[*] Sentry shield active. Monitoring all sectors.</div>
            </div>
        </div>
    </div>
</div>

<script>
    let webAudioCtx = null;
    let webOsc = null;

    function playWebSirenAudio(isHighAlert) {
        if (!webAudioCtx) webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!webOsc) {
            webOsc = webAudioCtx.createOscillator();
            webOsc.type = "sawtooth";
            webOsc.connect(webAudioCtx.destination);
            webOsc.start();
            let fA = isHighAlert ? 1500 : 1800;
            let fB = isHighAlert ? 700 : 1200;
            let toggle = true;
            setInterval(() => {
                if (webOsc) {
                    webOsc.frequency.setValueAtTime(toggle ? fA : fB, webAudioCtx.currentTime);
                    toggle = !toggle;
                }
            }, isHighAlert ? 220 : 120);
        }
    }

    function stopWebSirenAudio() {
        if (webOsc) {
            try { webOsc.stop(); } catch(e){}
            webOsc.disconnect();
            webOsc = null;
        }
    }

    function sentrySiren(mode) {
        fetch('http://localhost:5000/api/test_siren/' + mode, {method: 'POST'}).catch(e => console.log(e));
        playWebSirenAudio(mode === 'high');
    }

    function silenceSentry() {
        fetch('http://localhost:5000/api/disarm', {method: 'POST'}).catch(e => console.log(e));
        stopWebSirenAudio();
    }

    // Telemetry Sync with Python Backend
    setInterval(() => {
        fetch('http://localhost:5000/api/status')
            .then(res => res.json())
            .then(state => {
                const badge = document.getElementById('sentryBadge');
                const box = document.getElementById('videoContainer');
                const targetStat = document.getElementById('targetStatus');
                const widsStat = document.getElementById('widsIndicator');
                const motionStat = document.getElementById('motionIndicator');
                const logDiv = document.getElementById('hudIncidentLogs');

                if (state.siren_active) {
                    if (state.siren_mode === "HIGH_ALERT") {
                        badge.style.background = "#dc2626";
                        badge.innerText = "🚨 HIGH ALERT (INTRUDER)";
                        box.style.border = "2px solid #ef4444";
                        box.style.boxShadow = "0 0 25px rgba(239, 68, 68, 0.9)";
                        targetStat.innerText = "⚠️ INTRUSION DETECTED";
                        targetStat.style.color = "#ef4444";
                    } else {
                        badge.style.background = "#ea580c";
                        badge.innerText = "⚠️ MALICIOUS WI-FI";
                        box.style.border = "2px solid #ea580c";
                        box.style.boxShadow = "0 0 20px rgba(234, 88, 12, 0.8)";
                    }
                } else {
                    badge.style.background = "#16a34a";
                    badge.innerText = "ARMED & PATROLLING";
                    box.style.border = "2px solid #334155";
                    box.style.boxShadow = "none";
                    targetStat.innerText = "STATUS: CLEAR";
                    targetStat.style.color = "#22c55e";
                    stopWebSirenAudio();
                }

                widsStat.innerText = state.wifi_threat_detected ? "⚠️ ROGUE AP DETECTED" : "Scanning 2.4/5GHz (Clear)";
                widsStat.style.color = state.wifi_threat_detected ? "#ef4444" : "#22c55e";

                motionStat.innerText = state.motion_detected ? "⚠️ TARGET IN MOTION" : "No Intrusion Detected";
                motionStat.style.color = state.motion_detected ? "#ef4444" : "#22c55e";

                if (state.incident_log && state.incident_log.length > 0) {
                    logDiv.innerHTML = state.incident_log.map(i => `<div style="margin-bottom: 3px;">${i}</div>`).join('');
                }
            })
            .catch(err => {});
    }, 1000);
</script>
"""

# 3. Inject directly inside <body> right after the map div
body_tag = "<body>"
map_div = '<div class="folium-map"'

if map_div in html:
    # Insert right after opening <body>
    idx = html.find(body_tag) + len(body_tag)
    updated_html = html[:idx] + "\n" + sentry_hud + "\n" + html[idx:]
else:
    updated_html = html.replace("</body>", sentry_hud + "\n</body>")

with open(source_file, "w", encoding="utf-8") as f:
    f.write(updated_html)

with open(desktop_file, "w", encoding="utf-8") as f:
    f.write(updated_html)

print("[+] Clean injection complete: HUD placed directly inside <body>!")
print(f"    --> Workspace: {source_file}")
print(f"    --> Desktop:   {desktop_file}")
