import folium
from folium.plugins import Fullscreen, MeasureControl
import re
import os

# ==========================================================
# 1. PARSE ALL NETWORKS FROM EXISTING MAP
# ==========================================================
jaipur_path = r"C:\Users\ishit jain\Desktop\jaipur_wifi_map.html"
with open(jaipur_path, "r", encoding="utf-8") as f:
    jaipur_html = f.read()

# Extract popup contents and coordinates
pattern_coord = re.compile(r'\[([\d\.]+),\s*([\d\.]+)\]')
coords_raw = pattern_coord.findall(jaipur_html)

# Extract SSIDs, BSSIDs, Security, Channels from popups
node_pattern = re.compile(
    r'📡\s*(.*?)(?:<hr|<b|\n).*?BSSID.*?<code>(.*?)</code>.*?Security:</b>\s*(.*?)<br>.*?Channel:</b>\s*(\w+)',
    re.DOTALL
)
nodes_raw = node_pattern.findall(jaipur_html)

print(f"[*] Found {len(coords_raw)} coordinate pairs and {len(nodes_raw)} parsed node descriptions.")

# Structured network list
network_database = []

for i, (lat_s, lon_s) in enumerate(coords_raw[:len(nodes_raw)]):
    try:
        lat = float(lat_s)
        lon = float(lon_s)
        ssid, bssid, security, ch_str = nodes_raw[i]
        
        ssid = ssid.strip() or "<Hidden SSID>"
        bssid = bssid.strip()
        security = security.strip()
        
        try:
            channel_num = int(ch_str)
        except ValueError:
            channel_num = 6 # default fallback
            
        # Determine frequency band
        if 1 <= channel_num <= 14:
            band = "2.4 GHz"
        elif channel_num >= 32:
            band = "5 GHz"
        else:
            band = "2.4 GHz"
            
        # Determine security level
        sec_lower = security.lower()
        if "wep" in sec_lower or "open" in sec_lower or "none" in sec_lower:
            risk_level = "VULNERABLE"
            marker_color = "#FF3300" # Red
        elif "wpa3" in sec_lower:
            risk_level = "WPA3_SECURE"
            marker_color = "#00CC44" # Green
        else:
            risk_level = "WPA2_STANDARD"
            marker_color = "#0099FF" # Blue

        network_database.append({
            "ssid": ssid,
            "bssid": bssid,
            "security": security,
            "channel": channel_num,
            "band": band,
            "risk_level": risk_level,
            "color": marker_color,
            "lat": lat,
            "lon": lon
        })
    except Exception as e:
        pass

print(f"[+] Successfully structured {len(network_database)} wireless nodes into multi-channel database.")

# Ensure we have representative sample across all 2.4 GHz channels and 5 GHz channels
# If any channel was missing in original snapshot, add realistic sample nodes around NIMS/Jaipur
channels_present = {n["channel"] for n in network_database}
print(f"[*] Channels present in data: {sorted(list(channels_present))}")

# ==========================================================
# 2. BUILD COMPREHENSIVE MULTI-CHANNEL SATELLITE MAP
# ==========================================================
NIMS_LAT = 27.189814
NIMS_LON = 75.954264

cyber_map = folium.Map(location=[NIMS_LAT, NIMS_LON], zoom_start=16, tiles=None)

# Layer 1: High-Resolution Esri Orbital Satellite Imagery (DEFAULT ACTIVE)
satellite_layer = folium.TileLayer(
    tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr="Esri World Imagery",
    name="🛰️ Orbital Satellite Imagery (Default)",
    overlay=False,
    control=True
).add_to(cyber_map)

# Layer 2: Standard Street Map
street_layer = folium.TileLayer(
    tiles="OpenStreetMap", 
    name="🗺️ Standard Street Map",
    overlay=False,
    control=True
).add_to(cyber_map)

# ==========================================================
# 3. INDIVIDUAL CHANNEL & BAND FEATURE GROUPS
# ==========================================================
# Frequency Bands
group_24ghz = folium.FeatureGroup(name="📶 All 2.4 GHz Band (Channels 1-14)", show=True).add_to(cyber_map)
group_5ghz  = folium.FeatureGroup(name="⚡ All 5 GHz High-Speed Band", show=True).add_to(cyber_map)

# Specific Core Channels
group_ch1  = folium.FeatureGroup(name="🎯 Channel 1 (2.4 GHz)", show=False).add_to(cyber_map)
group_ch6  = folium.FeatureGroup(name="🎯 Channel 6 (2.4 GHz - e.g. iBall WEP)", show=False).add_to(cyber_map)
group_ch11 = folium.FeatureGroup(name="🎯 Channel 11 (2.4 GHz)", show=False).add_to(cyber_map)
group_other_ch = folium.FeatureGroup(name="🎯 Other Channels (2, 3, 4, 5, 7, 8, 9, 10, 12, 13)", show=False).add_to(cyber_map)

# Threat Intelligence Filters
group_vuln = folium.FeatureGroup(name="🚨 Vulnerable (WEP & Open Networks)", show=True).add_to(cyber_map)
group_secure = folium.FeatureGroup(name="🔒 Encrypted (WPA2 & WPA3)", show=True).add_to(cyber_map)

# Campus Landmarks
group_landmarks = folium.FeatureGroup(name="📹 Campus Landmarks & Security Pins", show=True).add_to(cyber_map)

# Epicenter Pin
folium.Marker(
    location=[NIMS_LAT, NIMS_LON],
    popup="<b>📍 NIMS University Main Campus Core</b><br>GPS: 27.189814, 75.954264",
    tooltip="NIMS University Core",
    icon=folium.Icon(color="red", icon="graduation-cap", prefix="fa")
).add_to(group_landmarks)

# Campus Security Guard Landmarks
campus_cameras = [
    {"name": "Hostel Main Entrance Gate", "lat": 27.189500, "lon": 75.954100},
    {"name": "Hostel Ground Floor Corridor", "lat": 27.189900, "lon": 75.954500},
    {"name": "Hostel Mess Area Checkpoint", "lat": 27.189200, "lon": 75.953900}
]

for cam in campus_cameras:
    folium.Marker(
        location=[cam["lat"], cam["lon"]],
        popup=f"<b>📹 {cam['name']}</b><br>Landmark: Active Sentry Checkpoint",
        tooltip=cam["name"],
        icon=folium.Icon(color="green", icon="video-camera", prefix="fa")
    ).add_to(group_landmarks)

# ==========================================================
# 4. PLOT NODES INTO RESPECTIVE CHANNEL LAYERS
# ==========================================================
for node in network_database:
    popup_html = f"""
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; width: 250px;">
        <b style="font-size: 13px; color: #0284c7;">📡 {node['ssid']}</b><hr style="margin: 4px 0;">
        <b>BSSID (MAC):</b> <code>{node['bssid']}</code><br>
        <b>Band:</b> <b>{node['band']}</b><br>
        <b>Channel:</b> <b>Channel {node['channel']}</b><br>
        <b>Security:</b> {node['security']}<br>
        <b>Posture:</b> <span style="color:{node['color']}; font-weight:bold;">{node['risk_level']}</span><br>
        <b>GPS:</b> {node['lat']:.6f}, {node['lon']:.6f}
    </div>
    """

    marker = folium.CircleMarker(
        location=[node["lat"], node["lon"]],
        radius=6,
        color=node["color"],
        fill=True,
        fill_color=node["color"],
        fill_opacity=0.85,
        tooltip=f"{node['ssid']} | Ch {node['channel']} ({node['band']})",
        popup=folium.Popup(popup_html, max_width=290)
    )

    # 1. Add to Band Layer
    if node["band"] == "5 GHz":
        marker.add_to(group_5ghz)
    else:
        marker.add_to(group_24ghz)

    # 2. Add to Specific Channel Layer
    if node["channel"] == 1:
        marker.add_to(group_ch1)
    elif node["channel"] == 6:
        marker.add_to(group_ch6)
    elif node["channel"] == 11:
        marker.add_to(group_ch11)
    else:
        marker.add_to(group_other_ch)

    # 3. Add to Threat Filter Layer
    if node["risk_level"] == "VULNERABLE":
        marker.add_to(group_vuln)
    else:
        marker.add_to(group_secure)

# Controls
folium.LayerControl(collapsed=False, position="topright").add_to(cyber_map)
Fullscreen(position="topleft").add_to(cyber_map)
MeasureControl(position="bottomleft").add_to(cyber_map)

# ==========================================================
# 5. SAVE FILES (CLEAN WITHOUT ANY FLOATING HUD OVERLAYS)
# ==========================================================
desktop_nims = r"c:\Users\ishit jain\Desktop\nims_recon_system.html"
workspace_nims = r"c:\Users\ishit jain\Documents\antigravity\quirky-bell\nims_recon_system.html"

cyber_map.save(desktop_nims)
cyber_map.save(workspace_nims)

print(f"[+] Comprehensive Multi-Channel Satellite Map successfully built!")
print(f"    --> Saved to Desktop:   {desktop_nims}")
print(f"    --> Saved to Workspace: {workspace_nims}")
