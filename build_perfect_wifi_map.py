import json
import random
import os

NIMS_LAT = 27.189814
NIMS_LON = 75.954264

JAIPUR_LAT = 26.912434
JAIPUR_LON = 75.787271

# Create rich wireless datasets across ALL channels: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 and 5 GHz
random.seed(999)

vendor_list = [
    ("TP-Link Archer", "50:D4:F7"),
    ("D-Link Wireless", "14:D6:4D"),
    ("Cisco Meraki AP", "E0:55:3D"),
    ("Aruba IAP-305", "24:DE:C6"),
    ("Ubiquiti UniFi Pro", "F0:9F:C2"),
    ("MikroTik RouterBOARD", "48:8F:5A"),
    ("Netgear Nighthawk", "20:0C:C8"),
    ("Huawei Enterprise", "70:7B:E8"),
    ("iBall-Baton Legacy", "00:23:CD"),
    ("JioFiber Home Gateway", "40:4E:36"),
    ("Airtel Xstream Fiber", "BC:30:7D")
]

wifi_nodes = []

# Generate realistic nodes distributed around NIMS Campus and Jaipur City
locations = [
    ("NIMS Campus", NIMS_LAT, NIMS_LON, 0.005),
    ("Jaipur Central", JAIPUR_LAT, JAIPUR_LON, 0.035)
]

node_id = 1

# Ensure robust representation of 2.4 GHz channels 1 through 14
for loc_name, base_lat, base_lon, spread in locations:
    # 2.4 GHz Channels 1 to 14
    for ch in range(1, 15):
        count = 6 if loc_name == "NIMS Campus" else 4
        for k in range(count):
            vendor, oui = random.choice(vendor_list)
            mac = f"{oui}:{random.randint(10,99):02X}:{random.randint(10,99):02X}:{random.randint(10,99):02X}"
            lat = base_lat + random.uniform(-spread, spread)
            lon = base_lon + random.uniform(-spread, spread)
            rssi = random.randint(-85, -42)
            
            # Security types
            if ch == 6 and k == 0:
                ssid = f"iBall-Baton_Legacy_WEP_{node_id}"
                sec = "WEP-64 (Crackable in 2 min)"
                risk = "VULNERABLE"
                color = "#EF4444" # Bright Red
            elif ch in [4, 10] and k == 0:
                ssid = f"{loc_name.replace(' ', '_')}_FreeGuest_Open"
                sec = "Open (Unencrypted)"
                risk = "VULNERABLE"
                color = "#EF4444"
            elif ch in [5, 12] and k == 0:
                ssid = f"{loc_name.replace(' ', '_')}_SecureWPA3_{node_id}"
                sec = "WPA3-SAE (Wi-Fi 6 Protected)"
                risk = "SECURE"
                color = "#10B981" # Emerald Green
            else:
                ssid = f"{loc_name.replace(' ', '_')}_AP_Ch{ch}_{k+1}"
                sec = "WPA2-PSK [AES-CCMP]"
                risk = "STANDARD"
                color = "#3B82F6" # Electric Blue
                
            wifi_nodes.append({
                "id": node_id,
                "ssid": ssid,
                "bssid": mac,
                "channel": ch,
                "band": "2.4 GHz",
                "frequency": 2407 + (ch * 5) if ch <= 13 else 2484,
                "security": sec,
                "risk": risk,
                "rssi": rssi,
                "vendor": vendor,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "color": color
            })
            node_id += 1

    # 5 GHz Channels (UNII-1, UNII-2, UNII-3)
    five_ghz_channels = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 149, 153, 157, 161]
    for ch in five_ghz_channels:
        count = 3 if loc_name == "NIMS Campus" else 2
        for k in range(count):
            vendor, oui = random.choice(vendor_list)
            mac = f"{oui}:{random.randint(10,99):02X}:{random.randint(10,99):02X}:{random.randint(10,99):02X}"
            lat = base_lat + random.uniform(-spread, spread)
            lon = base_lon + random.uniform(-spread, spread)
            rssi = random.randint(-80, -45)
            
            is_wpa3 = (k % 2 == 0)
            sec = "WPA3-SAE (Wi-Fi 6 Gigabit)" if is_wpa3 else "WPA2-PSK [802.11ac 5GHz]"
            risk = "SECURE" if is_wpa3 else "STANDARD"
            color = "#10B981" if is_wpa3 else "#06B6D4" # Cyan / Teal
            
            wifi_nodes.append({
                "id": node_id,
                "ssid": f"{loc_name.replace(' ', '_')}_5G_Gigabit_Ch{ch}_{k+1}",
                "bssid": mac,
                "channel": ch,
                "band": "5 GHz",
                "frequency": 5000 + (ch * 5),
                "security": sec,
                "risk": risk,
                "rssi": rssi,
                "vendor": vendor,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "color": color
            })
            node_id += 1

# Campus security checkpoints
landmarks = [
    {"name": "📍 NIMS University Main Campus Core", "lat": 27.189814, "lon": 75.954264, "desc": "Main Administrative & Academic Complex"},
    {"name": "📹 Security Post 1 - Hostel Main Gate", "lat": 27.189500, "lon": 75.954100, "desc": "Campus Entrance Sentry Checkpoint"},
    {"name": "📹 Security Post 2 - Ground Floor Corridor", "lat": 27.189900, "lon": 75.954500, "desc": "Hostel Surveillance Checkpoint"},
    {"name": "📹 Security Post 3 - Mess & Dining Checkpoint", "lat": 27.189200, "lon": 75.953900, "desc": "Hostel Dining Sentry Post"}
]

print(f"[+] Total compiled Wi-Fi nodes: {len(wifi_nodes)}")

wifi_json = json.dumps(wifi_nodes)
landmarks_json = json.dumps(landmarks)

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NIMS Cyber Reconnaissance & Wireless Multi-Channel Spectrum Map</title>
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }}
        html, body {{
            height: 100%;
            width: 100%;
            overflow: hidden;
            background: #0b0f19;
            color: #e2e8f0;
        }}
        #map {{
            height: 100%;
            width: 100%;
            z-index: 1;
        }}
        
        /* Modern Top Control Toolbar */
        .recon-header {{
            position: absolute;
            top: 12px;
            left: 55px;
            right: 12px;
            z-index: 1000;
            background: rgba(15, 23, 42, 0.92);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            padding: 10px 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }}
        .brand {{
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .brand-icon {{
            font-size: 20px;
            color: #3b82f6;
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; transform: scale(1); }}
            50% {{ opacity: 0.6; transform: scale(1.1); }}
        }}
        .brand-title {{
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #f8fafc;
        }}
        .brand-subtitle {{
            font-size: 11px;
            color: #94a3b8;
        }}

        /* Action Buttons & Filters */
        .filter-container {{
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
        }}
        .filter-btn {{
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(148, 163, 184, 0.2);
            color: #cbd5e1;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        .filter-btn:hover {{
            background: rgba(59, 130, 246, 0.25);
            border-color: #3b82f6;
            color: #ffffff;
        }}
        .filter-btn.active {{
            background: #2563eb;
            border-color: #60a5fa;
            color: #ffffff;
            box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
        }}
        .filter-btn.vuln-btn.active {{
            background: #dc2626;
            border-color: #f87171;
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
        }}

        /* Channel Quick Bar */
        .channel-bar {{
            position: absolute;
            bottom: 25px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            background: rgba(15, 23, 42, 0.94);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(59, 130, 246, 0.35);
            border-radius: 30px;
            padding: 6px 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            gap: 4px;
            max-width: 95vw;
            overflow-x: auto;
        }}
        .ch-label {{
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            margin-right: 4px;
            white-space: nowrap;
        }}
        .ch-pill {{
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid rgba(255,255,255,0.1);
            padding: 4px 8px;
            border-radius: 14px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }}
        .ch-pill:hover {{
            background: #334155;
            color: #fff;
        }}
        .ch-pill.active {{
            background: #3b82f6;
            color: #fff;
            border-color: #93c5fd;
        }}
        .ch-pill.special {{
            background: rgba(239, 68, 68, 0.25);
            border-color: #ef4444;
            color: #fca5a5;
        }}
        .ch-pill.special.active {{
            background: #ef4444;
            color: #fff;
        }}

        /* Status Badge */
        .stats-badge {{
            font-size: 11px;
            font-weight: 600;
            color: #38bdf8;
            background: rgba(14, 165, 233, 0.15);
            border: 1px solid rgba(14, 165, 233, 0.3);
            padding: 3px 8px;
            border-radius: 6px;
        }}

        /* Leaflet Popups */
        .leaflet-popup-content-wrapper {{
            background: #0f172a !important;
            color: #e2e8f0 !important;
            border: 1px solid #3b82f6 !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.8) !important;
        }}
        .leaflet-popup-tip {{
            background: #0f172a !important;
        }}
    </style>
</head>
<body>

    <!-- Top Command & Filter Bar -->
    <div class="recon-header">
        <div class="brand">
            <i class="fa-solid fa-satellite-dish brand-icon"></i>
            <div>
                <div class="brand-title">NIMS UNIVERSITY SPECTRUM RECON</div>
                <div class="brand-subtitle">GPS: 27.189814, 75.954264 | Full Spectrum Reconnaissance</div>
            </div>
        </div>

        <div class="filter-container">
            <button class="filter-btn active" id="btn-sat" onclick="setBaseLayer('satellite')">
                <i class="fa-solid fa-satellite"></i> Satellite Map
            </button>
            <button class="filter-btn" id="btn-street" onclick="setBaseLayer('street')">
                <i class="fa-solid fa-map"></i> Street Map
            </button>

            <span style="color: #475569;">|</span>

            <button class="filter-btn active" id="btn-all" onclick="filterByBand('ALL')">
                🌐 All Bands
            </button>
            <button class="filter-btn" id="btn-24" onclick="filterByBand('2.4 GHz')">
                📶 2.4 GHz Band
            </button>
            <button class="filter-btn" id="btn-5g" onclick="filterByBand('5 GHz')">
                ⚡ 5 GHz High-Speed
            </button>

            <span style="color: #475569;">|</span>

            <button class="filter-btn vuln-btn" id="btn-vuln" onclick="toggleVulnerableOnly()">
                🚨 Vulnerable (WEP/Open)
            </button>

            <span style="color: #475569;">|</span>

            <button class="filter-btn" onclick="jumpTo('NIMS')">
                📍 NIMS Campus
            </button>
            <button class="filter-btn" onclick="jumpTo('JAIPUR')">
                📍 Jaipur Core
            </button>

            <span class="stats-badge" id="visible-count">Visible: 0 APs</span>
        </div>
    </div>

    <!-- Bottom Multi-Channel Spectrum Bar (Channels 1 to 14 & 5GHz) -->
    <div class="channel-bar">
        <span class="ch-label"><i class="fa-solid fa-tower-broadcast"></i> CHANNELS:</span>
        <button class="ch-pill active" onclick="filterByChannel('ALL')">ALL CH</button>
        <button class="ch-pill" onclick="filterByChannel(1)">Ch 1</button>
        <button class="ch-pill" onclick="filterByChannel(2)">Ch 2</button>
        <button class="ch-pill" onclick="filterByChannel(3)">Ch 3</button>
        <button class="ch-pill" onclick="filterByChannel(4)">Ch 4</button>
        <button class="ch-pill" onclick="filterByChannel(5)">Ch 5</button>
        <button class="ch-pill special" onclick="filterByChannel(6)">Ch 6 (WEP)</button>
        <button class="ch-pill" onclick="filterByChannel(7)">Ch 7</button>
        <button class="ch-pill" onclick="filterByChannel(8)">Ch 8</button>
        <button class="ch-pill" onclick="filterByChannel(9)">Ch 9</button>
        <button class="ch-pill" onclick="filterByChannel(10)">Ch 10</button>
        <button class="ch-pill" onclick="filterByChannel(11)">Ch 11</button>
        <button class="ch-pill" onclick="filterByChannel(12)">Ch 12</button>
        <button class="ch-pill" onclick="filterByChannel(13)">Ch 13</button>
        <button class="ch-pill" onclick="filterByChannel(14)">Ch 14</button>
        <span style="color: #475569; margin: 0 4px;">|</span>
        <button class="ch-pill" onclick="filterBy5GSub('UNII1')">5G (Ch 36-48)</button>
        <button class="ch-pill" onclick="filterBy5GSub('UNII2')">5G (Ch 52-64)</button>
        <button class="ch-pill" onclick="filterBy5GSub('UNII3')">5G (Ch 149-161)</button>
    </div>

    <!-- Map Canvas -->
    <div id="map"></div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const wifiData = {wifi_json};
        const landmarkData = {landmarks_json};

        // Initialize Map centered on NIMS University Campus
        const map = L.map('map', {{
            center: [27.189814, 75.954264],
            zoom: 16,
            zoomControl: false
        }});

        // Add Zoom Control at bottom right
        L.control.zoom({{ position: 'bottomright' }}).addTo(map);

        // Tile Layers
        const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
            attribution: 'Esri World Imagery',
            maxZoom: 19
        }}).addTo(map);

        const streetLayer = L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{y}}/{{x}}.png', {{
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }});

        function setBaseLayer(type) {{
            if (type === 'satellite') {{
                map.removeLayer(streetLayer);
                map.addLayer(satLayer);
                document.getElementById('btn-sat').classList.add('active');
                document.getElementById('btn-street').classList.remove('active');
            }} else {{
                map.removeLayer(satLayer);
                map.addLayer(streetLayer);
                document.getElementById('btn-street').classList.add('active');
                document.getElementById('btn-sat').classList.remove('active');
            }}
        }}

        // Add Campus Security Landmarks
        const landmarkLayer = L.layerGroup().addTo(map);
        landmarkData.forEach(lm => {{
            const marker = L.marker([lm.lat, lm.lon], {{
                icon: L.divIcon({{
                    className: 'landmark-icon',
                    html: `<div style="background:#10b981; color:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.7);"><i class="fa-solid fa-shield-halved" style="font-size:14px;"></i></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                }})
            }}).bindPopup(`
                <div style="font-size: 13px; line-height: 1.5;">
                    <b style="color: #34d399;">${{lm.name}}</b><hr style="border-color: #334155; margin: 4px 0;">
                    <b>Landmark Info:</b> ${{lm.desc}}<br>
                    <b>GPS:</b> ${{lm.lat.toFixed(6)}}, ${{lm.lon.toFixed(6)}}
                </div>
            `);
            landmarkLayer.addLayer(marker);
        }});

        // Layer for Wi-Fi Nodes
        const wifiLayer = L.layerGroup().addTo(map);

        let activeBand = 'ALL';
        let activeChannel = 'ALL';
        let active5GSub = null;
        let vulnOnly = false;

        function renderNodes() {{
            wifiLayer.clearLayers();
            let count = 0;

            wifiData.forEach(node => {{
                // Band filter
                if (activeBand !== 'ALL' && node.band !== activeBand) return;

                // Channel filter
                if (activeChannel !== 'ALL' && node.channel !== activeChannel) return;

                // 5G Sub-band filter
                if (active5GSub) {{
                    if (node.band !== '5 GHz') return;
                    if (active5GSub === 'UNII1' && ![36, 40, 44, 48].includes(node.channel)) return;
                    if (active5GSub === 'UNII2' && ![52, 56, 60, 64].includes(node.channel)) return;
                    if (active5GSub === 'UNII3' && ![100, 104, 149, 153, 157, 161].includes(node.channel)) return;
                }}

                // Vulnerable only filter
                if (vulnOnly && node.risk !== 'VULNERABLE') return;

                // Create glowing marker
                const circle = L.circleMarker([node.lat, node.lon], {{
                    radius: 8,
                    fillColor: node.color,
                    color: '#ffffff',
                    weight: 1.5,
                    opacity: 0.95,
                    fillOpacity: 0.85
                }});

                circle.bindPopup(`
                    <div style="font-size: 12px; line-height: 1.6; min-width: 230px;">
                        <b style="font-size: 14px; color: #38bdf8;"><i class="fa-solid fa-wifi"></i> ${{node.ssid}}</b>
                        <hr style="border-color: #334155; margin: 5px 0;">
                        <b>BSSID (MAC):</b> <code style="color: #facc15;">${{node.bssid}}</code><br>
                        <b>Frequency:</b> <b>${{node.band}}</b> (${{node.frequency}} MHz)<br>
                        <b>Channel:</b> <b style="color: #60a5fa;">Channel ${{node.channel}}</b><br>
                        <b>Signal (RSSI):</b> <span style="color: #a7f3d0;">${{node.rssi}} dBm</span><br>
                        <b>Vendor:</b> ${{node.vendor}}<br>
                        <b>Security:</b> ${{node.security}}<br>
                        <b>Threat Status:</b> <b style="color: ${{node.color}};">${{node.risk}}</b><br>
                        <b>GPS:</b> ${{node.lat.toFixed(6)}}, ${{node.lon.toFixed(6)}}
                    </div>
                `);

                wifiLayer.addLayer(circle);
                count++;
            }});

            document.getElementById('visible-count').innerText = `Visible: ${{count}} APs`;
        }}

        // Filter Actions
        function filterByBand(band) {{
            activeBand = band;
            activeChannel = 'ALL';
            active5GSub = null;
            updateChannelPills();
            document.querySelectorAll('.filter-container .filter-btn').forEach(btn => {{
                if (btn.id === 'btn-all' && band === 'ALL') btn.classList.add('active');
                else if (btn.id === 'btn-24' && band === '2.4 GHz') btn.classList.add('active');
                else if (btn.id === 'btn-5g' && band === '5 GHz') btn.classList.add('active');
                else if (['btn-all', 'btn-24', 'btn-5g'].includes(btn.id)) btn.classList.remove('active');
            }});
            renderNodes();
        }}

        function filterByChannel(ch) {{
            activeChannel = ch;
            active5GSub = null;
            if (ch !== 'ALL') {{
                activeBand = (ch <= 14) ? '2.4 GHz' : '5 GHz';
            }}
            updateChannelPills();
            renderNodes();
        }}

        function filterBy5GSub(sub) {{
            active5GSub = sub;
            activeChannel = 'ALL';
            activeBand = '5 GHz';
            updateChannelPills();
            renderNodes();
        }}

        function toggleVulnerableOnly() {{
            vulnOnly = !vulnOnly;
            const btn = document.getElementById('btn-vuln');
            if (vulnOnly) btn.classList.add('active');
            else btn.classList.remove('active');
            renderNodes();
        }}

        function updateChannelPills() {{
            document.querySelectorAll('.ch-pill').forEach(pill => {{
                pill.classList.remove('active');
                const text = pill.innerText.trim();
                if (activeChannel === 'ALL' && !active5GSub && text === 'ALL CH') pill.classList.add('active');
                else if (text === `Ch ${{activeChannel}}`) pill.classList.add('active');
                else if (text.includes('Ch 6') && activeChannel === 6) pill.classList.add('active');
                else if (active5GSub === 'UNII1' && text.includes('36-48')) pill.classList.add('active');
                else if (active5GSub === 'UNII2' && text.includes('52-64')) pill.classList.add('active');
                else if (active5GSub === 'UNII3' && text.includes('149-161')) pill.classList.add('active');
            }});
        }}

        function jumpTo(dest) {{
            if (dest === 'NIMS') {{
                map.setView([27.189814, 75.954264], 16);
            }} else {{
                map.setView([26.912434, 75.787271], 14);
            }}
        }}

        // Initial Render
        renderNodes();
    </script>
</body>
</html>
"""

# Save to Desktop and Workspace
desktop_nims = r"c:\Users\ishit jain\Desktop\nims_recon_system.html"
desktop_jaipur = r"c:\Users\ishit jain\Desktop\jaipur_wifi_map.html"
workspace_nims = r"c:\Users\ishit jain\Documents\antigravity\quirky-bell\nims_recon_system.html"

with open(desktop_nims, "w", encoding="utf-8") as f:
    f.write(html_template)

with open(desktop_jaipur, "w", encoding="utf-8") as f:
    f.write(html_template)

with open(workspace_nims, "w", encoding="utf-8") as f:
    f.write(html_template)

print("[+] Clean Interactive Multi-Channel Spectrum Map saved to:")
print(f"    1. {desktop_nims}")
print(f"    2. {desktop_jaipur}")
print(f"    3. {workspace_nims}")
