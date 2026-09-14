import os

source_html = r"c:\Users\ishit jain\Documents\antigravity\quirky-bell\nims_recon_system.html"
desktop_html = r"c:\Users\ishit jain\Desktop\nims_recon_system.html"

with open(source_html, "r", encoding="utf-8") as f:
    content = f.read()

hud_html = """
<!-- ==========================================
     CYBER SENTRY CONTROLLER & DUAL SIREN HUD
     ========================================== -->
<div id="cyberSentryHud" style="
    position: fixed;
    bottom: 25px;
    right: 25px;
    z-index: 9999;
    width: 390px;
    background: rgba(11, 17, 32, 0.95);
    border: 2px solid #1e293b;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.75);
    font-family: 'Consolas', 'Segoe UI', monospace;
    color: #f8fafc;
    overflow: hidden;
    backdrop-filter: blur(8px);
">
    <!-- Top Bar -->
    <div style="background:#0f172a; padding: 10px 14px; border-bottom: 1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#38bdf8; font-weight:bold; font-size:13px; letter-spacing:1px;">🛡️ NIMS CYBER SENTRY HUD</span>
        <span id="mapHudBadge" style="background:#16a34a; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold;">ARMED</span>
    </div>

    <!-- Live Sentry Camera Window -->
    <div style="padding: 12px;">
        <div style="border:2px solid #334155; border-radius:6px; overflow:hidden; background:#000; position:relative;" id="mapHudVideoBox">
            <img src="http://localhost:5000/video_feed" style="width:100%; height:auto; display:block;" alt="Live Optical Sentry Stream" onerror="this.src='https://via.placeholder.com/640x480/000000/00ff00?text=SENTRY+SERVER+OFFLINE'">
        </div>

        <!-- Two-Tier Emergency Siren Controls -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:10px;">
            <button onclick="triggerMapSiren('wifi')" style="background:#ea580c; color:#fff; border:none; padding:8px 4px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; font-family:monospace;">🔊 SIREN: WI-FI</button>
            <button onclick="triggerMapSiren('high')" style="background:#dc2626; color:#fff; border:none; padding:8px 4px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; font-family:monospace;">🚨 SIREN: HIGH ALERT</button>
        </div>
        <button onclick="disarmMapAlarms()" style="width:100%; background:#16a34a; color:#fff; border:none; padding:7px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; margin-top:6px; font-family:monospace;">🛑 SILENCE ALARMS</button>

        <!-- Threat Telemetry Panel -->
        <div style="margin-top:10px; font-size:11px; color:#94a3b8; background:#030712; padding:8px 10px; border-radius:4px; line-height:1.6;">
            <div>📡 <b>Wi-Fi Airwaves:</b> <span id="mapWifiStatus" style="color:#22c55e;">WIDS Active (Scanning)</span></div>
            <div>👀 <b>Optical Sentry:</b> <span id="mapMotionStatus" style="color:#22c55e;">Armed (Clear)</span></div>
            <div>🛰️ <b>Active Radar:</b> <span style="color:#38bdf8;">100 Mapped Wireless Nodes</span></div>
        </div>
    </div>
</div>

<script>
    let mapSynthCtx = null;
    let mapSynthOsc = null;

    function playMapAudioSiren(isHigh) {
        if (!mapSynthCtx) mapSynthCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!mapSynthOsc) {
            mapSynthOsc = mapSynthCtx.createOscillator();
            mapSynthOsc.type = "sawtooth";
            mapSynthOsc.connect(mapSynthCtx.destination);
            mapSynthOsc.start();
            let f1 = isHigh ? 1500 : 1800;
            let f2 = isHigh ? 700 : 1200;
            let tog = true;
            setInterval(() => {
                if (mapSynthOsc) {
                    mapSynthOsc.frequency.setValueAtTime(tog ? f1 : f2, mapSynthCtx.currentTime);
                    tog = !tog;
                }
            }, isHigh ? 220 : 120);
        }
    }

    function stopMapAudioSiren() {
        if (mapSynthOsc) {
            try { mapSynthOsc.stop(); } catch(e){}
            mapSynthOsc.disconnect();
            mapSynthOsc = null;
        }
    }

    function triggerMapSiren(mode) {
        fetch('http://localhost:5000/api/test_siren/' + mode, {method: 'POST'}).catch(e => console.log(e));
        playMapAudioSiren(mode === 'high');
    }

    function disarmMapAlarms() {
        fetch('http://localhost:5000/api/disarm', {method: 'POST'}).catch(e => console.log(e));
        stopMapAudioSiren();
    }

    // Real-time synchronization with Python Backend
    setInterval(() => {
        fetch('http://localhost:5000/api/status')
            .then(r => r.json())
            .then(d => {
                const badge = document.getElementById('mapHudBadge');
                const box = document.getElementById('mapHudVideoBox');
                const wifiStatus = document.getElementById('mapWifiStatus');
                const motionStatus = document.getElementById('mapMotionStatus');

                if (d.siren_active) {
                    badge.style.background = '#dc2626';
                    badge.innerText = '🚨 ALARM ACTIVE';
                    box.style.borderColor = '#ef4444';
                    box.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
                } else {
                    badge.style.background = '#16a34a';
                    badge.innerText = 'ARMED';
                    box.style.borderColor = '#334155';
                    box.style.boxShadow = 'none';
                    stopMapAudioSiren();
                }

                wifiStatus.innerText = d.wifi_threat_detected ? '⚠️ ROGUE DETECTED' : 'WIDS Normal';
                wifiStatus.style.color = d.wifi_threat_detected ? '#ef4444' : '#22c55e';

                motionStatus.innerText = d.motion_detected ? '⚠️ INTRUSION DETECTED' : 'Clear';
                motionStatus.style.color = d.motion_detected ? '#ef4444' : '#22c55e';
            })
            .catch(err => {});
    }, 1000);
</script>
"""

# Check if already injected, if so replace, otherwise append before </body> or </html>
if "cyberSentryHud" in content:
    # Remove existing HUD to update cleanly
    idx = content.find("<!-- ==========================================\n     CYBER SENTRY CONTROLLER")
    if idx != -1:
        content = content[:idx] + "</html>"

# Insert HUD before </html>
insert_idx = content.rfind("</html>")
if insert_idx != -1:
    updated_content = content[:insert_idx] + hud_html + "\n</html>"
else:
    updated_content = content + hud_html

with open(source_html, "w", encoding="utf-8") as f:
    f.write(updated_content)

with open(desktop_html, "w", encoding="utf-8") as f:
    f.write(updated_content)

print("[+] Successfully updated nims_recon_system.html with full Sentry HUD and Siren controls!")
print(f"    --> Saved to: {desktop_html}")
