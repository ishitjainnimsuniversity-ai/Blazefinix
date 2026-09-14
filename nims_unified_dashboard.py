import base64
import json
import folium
from folium.plugins import Fullscreen, MeasureControl
import requests
import socket
import os

# ==========================================
# 1. LOCAL NETWORK IP DISCOVERY
# ==========================================
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

LOCAL_IP = get_local_ip()

# ==========================================
# 2. WiGLE API CREDENTIALS & TARGET AREA
# ==========================================
API_NAME = "AIDeda9721de9b14a0149aed1dcc959e95b"
API_TOKEN = "7b303d899a311dee2c73f04fe1473e5d"

auth_str = f"{API_NAME}:{API_TOKEN}"
encoded_auth = base64.b64encode(auth_str.encode("ascii")).decode("ascii")

headers = {
    "Authorization": f"Basic {encoded_auth}",
    "Accept": "application/json",
}

# NIMS University Coordinates (~1.5 km coverage radius)
CENTER_LAT = 27.189814
CENTER_LON = 75.954264
LAT_RANGE = 0.015
LON_RANGE = 0.015

latrange1 = CENTER_LAT - LAT_RANGE
latrange2 = CENTER_LAT + LAT_RANGE
longrange1 = CENTER_LON - LON_RANGE
longrange2 = CENTER_LON + LON_RANGE

campus_cameras = [
    {
        "name": "Live Laptop Sentry Cam (CAM-01)",
        "lat": 27.189814,
        "lon": 75.954264,
        "stream_url": f"http://{LOCAL_IP}:5000/video_feed",
        "web_ui": f"http://{LOCAL_IP}:5000",
        "is_live": True
    },
    {
        "name": "Hostel Main Entrance Cam",
        "lat": 27.189500,
        "lon": 75.954100,
        "stream_url": "rtsp://admin:HostelPass123@192.168.1.101:554/live",
        "web_ui": "#",
        "is_live": False
    },
    {
        "name": "Hostel Ground Floor Corridor",
        "lat": 27.189900,
        "lon": 75.954500,
        "stream_url": "rtsp://admin:HostelPass123@192.168.1.102:554/live",
        "web_ui": "#",
        "is_live": False
    }
]

print("[*] Querying WiGLE wireless database for NIMS University area...")

url = "https://api.wigle.net/api/v2/network/search"
params = {
    "latrange1": latrange1,
    "latrange2": latrange2,
    "longrange1": longrange1,
    "longrange2": longrange2,
    "resultsPerPage": 100,
}

try:
    response = requests.get(url, headers=headers, params=params, timeout=20)
    
    if response.status_code != 200:
        print(f"[-] API Error {response.status_code}: {response.text}")
        exit(1)

    data = response.json()

    if not data.get("success"):
        print(f"[-] Query failed: {data.get('message')}")
        exit(1)

    networks = data.get("results", [])
    print(f"[+] Successfully retrieved {len(networks)} wireless nodes in this area!")

    # ==========================================
    # 3. BUILD MULTI-LAYER SATELLITE MAP
    # ==========================================
    campus_map = folium.Map(location=[CENTER_LAT, CENTER_LON], zoom_start=16, tiles=None)
    
    # High-Resolution Esri Orbital Satellite Imagery
    folium.TileLayer(
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri World Imagery',
        name='Orbital Satellite Imagery',
        overlay=False,
        control=True
    ).add_to(campus_map)
    
    # Street Map Layer
    folium.TileLayer(
        tiles='OpenStreetMap', 
        name='Standard Street Map',
        overlay=False,
        control=True
    ).add_to(campus_map)
    
    # Feature Groups
    network_group = folium.FeatureGroup(name="📡 Wireless Networks (WiGLE)").add_to(campus_map)
    camera_group = folium.FeatureGroup(name="📹 Security Cameras & Live Feeds").add_to(campus_map)

    # Campus Center Pin
    folium.Marker(
        [CENTER_LAT, CENTER_LON],
        popup="<b>NIMS University Main Campus</b>",
        tooltip="NIMS Main Campus",
        icon=folium.Icon(color="red", icon="graduation-cap", prefix="fa"),
    ).add_to(campus_map)

    # Plot Wireless Nodes
    critical_count = 0
    secure_count = 0

    for net in networks:
        ssid = net.get("ssid") or "<Hidden SSID>"
        bssid = net.get("netid", "N/A")
        trilat = net.get("trilat")
        trilong = net.get("trilong")
        encryption = net.get("encryption", "Unknown")
        channel = net.get("channel", "N/A")

        if trilat and trilong:
            color = "#0099FF"
            status = "Standard (WPA2)"
            if "wpa3" in encryption.lower():
                color = "#00CC44"
                status = "Secure (WPA3)"
                secure_count += 1
            elif "wep" in encryption.lower() or "open" in encryption.lower() or "none" in encryption.lower():
                color = "#FF3300"
                status = "Vulnerable / Open"
                critical_count += 1
            else:
                secure_count += 1

            popup_html = f"""
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; width: 240px;">
                <b style="font-size: 13px; color:#0284c7;">📡 {ssid}</b><hr style="margin: 4px 0;">
                <b>MAC (BSSID):</b> <code>{bssid}</code><br>
                <b>Security:</b> {encryption}<br>
                <b>Audit Status:</b> <b>{status}</b><br>
                <b>Channel:</b> {channel}<br>
                <b>GPS:</b> {trilat:.6f}, {trilong:.6f}
            </div>
            """

            folium.CircleMarker(
                location=[trilat, trilong],
                radius=6,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.75,
                tooltip=f"{ssid} ({encryption})",
                popup=folium.Popup(popup_html, max_width=280),
            ).add_to(network_group)

    # Plot CCTV & Live Sentry Feeds
    for cam in campus_cameras:
        if cam["is_live"]:
            cam_html = f"""
            <div style="font-family: sans-serif; font-size: 12px; width: 310px; text-align:center;">
                <b style="color: #ef4444; font-size: 13px;">🔴 {cam['name']} [LIVE]</b><hr style="margin: 4px 0;">
                <div style="background:#000; border: 2px solid #ef4444; border-radius: 6px; overflow:hidden;">
                    <img src="{cam['stream_url']}" style="width:100%; display:block;" alt="Connecting to stream...">
                </div>
                <div style="margin-top:6px; font-size:11px; text-align:left;">
                    <b>Stream Endpoint:</b> <code>{cam['stream_url']}</code>
                </div>
            </div>
            """
            icon_color = "red"
        else:
            cam_html = f"""
            <div style="font-family: sans-serif; font-size: 12px; width: 230px;">
                <b style="color: #2e7d32; font-size: 13px;">📹 {cam['name']}</b><hr style="margin: 4px 0;">
                <b>Status:</b> Standby Asset<br>
                <b>RTSP Path:</b> <code>{cam['stream_url']}</code>
            </div>
            """
            icon_color = "green"

        folium.Marker(
            location=[cam['lat'], cam['lon']],
            popup=folium.Popup(cam_html, max_width=340),
            tooltip=cam['name'],
            icon=folium.Icon(color=icon_color, icon="video-camera", prefix="fa")
        ).add_to(camera_group)

    # Map Controls
    folium.LayerControl(collapsed=False).add_to(campus_map)
    Fullscreen(position="topleft").add_to(campus_map)
    MeasureControl(position="bottomleft").add_to(campus_map)

    # ==========================================
    # 4. EMBED INTEGRATED SENTRY & SIREN HUD OVERLAY
    # ==========================================
    hud_overlay = f"""
    <div style="
        position: fixed;
        bottom: 25px;
        right: 25px;
        z-index: 1000;
        width: 380px;
        background: rgba(11, 17, 32, 0.95);
        border: 2px solid #1e293b;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.7);
        font-family: 'Consolas', 'Segoe UI', monospace;
        color: #f8fafc;
        overflow: hidden;
        backdrop-filter: blur(8px);
    ">
        <!-- Top Bar -->
        <div style="background:#0f172a; padding: 10px 14px; border-bottom: 1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#38bdf8; font-weight:bold; font-size:13px;">🛡️ CYBER SENTRY CONTROLLER</span>
            <span id="hudBadge" style="background:#16a34a; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold;">ARMED</span>
        </div>

        <!-- Live Camera Screen -->
        <div style="padding: 12px;">
            <div style="border:2px solid #334155; border-radius:6px; overflow:hidden; background:#000; position:relative;" id="hudVideoBox">
                <img src="http://localhost:5000/video_feed" style="width:100%; height:auto; display:block;" onerror="this.src='https://via.placeholder.com/640x480/000000/00ff00?text=SENTRY+SERVER+OFFLINE'">
            </div>

            <!-- Siren Controls -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:10px;">
                <button onclick="testSiren('wifi')" style="background:#ea580c; color:#fff; border:none; padding:8px 4px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; font-family:monospace;">🔊 SIREN: WI-FI</button>
                <button onclick="testSiren('high')" style="background:#dc2626; color:#fff; border:none; padding:8px 4px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; font-family:monospace;">🚨 SIREN: HIGH ALERT</button>
            </div>
            <button onclick="disarmAlarms()" style="width:100%; background:#16a34a; color:#fff; border:none; padding:7px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; margin-top:6px; font-family:monospace;">🛑 SILENCE ALARMS</button>

            <!-- Live Telemetry -->
            <div style="margin-top:10px; font-size:11px; color:#94a3b8; background:#030712; padding:8px; border-radius:4px; line-height:1.6;">
                <div>📡 <b>Wi-Fi Threats:</b> <span id="wifiHudStatus" style="color:#22c55e;">WIDS Active</span></div>
                <div>👀 <b>Motion Sensor:</b> <span id="motionHudStatus" style="color:#22c55e;">Clear</span></div>
                <div>🛰️ <b>Mapped Nodes:</b> <span style="color:#38bdf8;">{len(networks)}</span> (🔴 {critical_count} Open | 🟢 {secure_count} Secure)</div>
            </div>
        </div>
    </div>

    <script>
        let synthCtx = null;
        let synthOsc = null;

        function playWebSynth(isHigh) {{
            if (!synthCtx) synthCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (!synthOsc) {{
                synthOsc = synthCtx.createOscillator();
                synthOsc.type = "sawtooth";
                synthOsc.connect(synthCtx.destination);
                synthOsc.start();
                let f1 = isHigh ? 1500 : 1800;
                let f2 = isHigh ? 700 : 1200;
                let tog = true;
                setInterval(() => {{
                    if (synthOsc) {{
                        synthOsc.frequency.setValueAtTime(tog ? f1 : f2, synthCtx.currentTime);
                        tog = !tog;
                    }}
                }}, isHigh ? 220 : 120);
            }}
        }}

        function stopWebSynth() {{
            if (synthOsc) {{
                try {{ synthOsc.stop(); }} catch(e){{}}
                synthOsc.disconnect();
                synthOsc = null;
            }}
        }}

        function testSiren(mode) {{
            fetch('http://localhost:5000/api/test_siren/' + mode, {{method: 'POST'}}).catch(e => console.log(e));
            playWebSynth(mode === 'high');
        }}

        function disarmAlarms() {{
            fetch('http://localhost:5000/api/disarm', {{method: 'POST'}}).catch(e => console.log(e));
            stopWebSynth();
        }}

        // Poll Python backend status
        setInterval(() => {{
            fetch('http://localhost:5000/api/status')
                .then(r => r.json())
                .then(d => {{
                    const badge = document.getElementById('hudBadge');
                    const box = document.getElementById('hudVideoBox');
                    const wifiStatus = document.getElementById('wifiHudStatus');
                    const motionStatus = document.getElementById('motionHudStatus');

                    if (d.siren_active) {{
                        badge.style.background = '#dc2626';
                        badge.innerText = '🚨 ALARM ACTIVE';
                        box.style.borderColor = '#ef4444';
                        box.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
                    }} else {{
                        badge.style.background = '#16a34a';
                        badge.innerText = 'ARMED';
                        box.style.borderColor = '#334155';
                        box.style.boxShadow = 'none';
                        stopWebSynth();
                    }}

                    wifiStatus.innerText = d.wifi_threat_detected ? '⚠️ ROGUE DETECTED' : 'WIDS Normal';
                    wifiStatus.style.color = d.wifi_threat_detected ? '#ef4444' : '#22c55e';

                    motionStatus.innerText = d.motion_detected ? '⚠️ INTRUSION' : 'Clear';
                    motionStatus.style.color = d.motion_detected ? '#ef4444' : '#22c55e';
                }})
                .catch(err => {{}});
        }}, 1000);
    </script>
    """
    campus_map.get_root().html.add_child(folium.Element(hud_overlay))

    # Save to workspace and directly to Desktop
    workspace_file = "nims_recon_system.html"
    desktop_file = os.path.expanduser(r"~\Desktop\nims_recon_system.html")

    campus_map.save(workspace_file)
    campus_map.save(desktop_file)

    print(f"\n[+] Map successfully refreshed with full Sentry HUD, Siren, and Live Video!")
    print(f"    --> Workspace: {workspace_file}")
    print(f"    --> Desktop:   {desktop_file}")

except Exception as e:
    print(f"[-] Script execution failed: {e}")
