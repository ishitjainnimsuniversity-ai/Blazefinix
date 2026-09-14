import folium
from folium.plugins import MarkerCluster, Fullscreen, MeasureControl
import re
import os

# ==========================================
# 1. PARSE EXISTING NETWORKS FROM JAIPUR MAP
# ==========================================
jaipur_path = r"C:\Users\ishit jain\Desktop\jaipur_wifi_map.html"
with open(jaipur_path, "r", encoding="utf-8") as f:
    jaipur_html = f.read()

# Extract popups and coordinates using regex
pattern = re.compile(r'\[([\d\.]+),\s*([\d\.]+)\]')
popup_pattern = re.compile(r'<div style="font-family: sans-serif;.*?</div>', re.DOTALL)

coords_found = pattern.findall(jaipur_html)
popups_found = popup_pattern.findall(jaipur_html)

print(f"[*] Found {len(coords_found)} coordinates in existing map data.")

# ==========================================
# 2. BUILD PRISTINE NIMS RECON SYSTEM MAP
# ==========================================
NIMS_LAT = 27.189814
NIMS_LON = 75.954264

nims_map = folium.Map(location=[NIMS_LAT, NIMS_LON], zoom_start=16, tiles=None)

# High-Resolution Esri Orbital Satellite Layer
folium.TileLayer(
    tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr="Esri World Imagery",
    name="Orbital Satellite Imagery",
    overlay=False,
    control=True
).add_to(nims_map)

# Standard Street Navigation Layer
folium.TileLayer(
    tiles="OpenStreetMap", 
    name="Standard Street Map",
    overlay=False,
    control=True
).add_to(nims_map)

# Feature Groups
network_group = folium.FeatureGroup(name="📡 Wireless Networks (WiGLE)").add_to(nims_map)
camera_group = folium.FeatureGroup(name="📹 Campus Security Landmarks").add_to(nims_map)

# Permanent NIMS Center Epicenter
folium.Marker(
    location=[NIMS_LAT, NIMS_LON],
    popup="<b>📍 NIMS University Main Campus Epicenter</b><br>GPS: 27.189814, 75.954264",
    tooltip="NIMS University Core",
    icon=folium.Icon(color="red", icon="graduation-cap", prefix="fa")
).add_to(nims_map)

# Campus Camera Asset Pins
campus_cameras = [
    {"name": "Hostel Main Entrance Cam", "lat": 27.189500, "lon": 75.954100},
    {"name": "Hostel Ground Floor Corridor", "lat": 27.189900, "lon": 75.954500},
    {"name": "Hostel Mess Area Gate", "lat": 27.189200, "lon": 75.953900}
]

for cam in campus_cameras:
    folium.Marker(
        location=[cam["lat"], cam["lon"]],
        popup=f"<b>📹 {cam['name']}</b><br>Status: Sentry Guard Point",
        tooltip=cam["name"],
        icon=folium.Icon(color="green", icon="video-camera", prefix="fa")
    ).add_to(camera_group)

# Add all extracted networks and highlight NIMS area nodes
for i, (lat_s, lon_s) in enumerate(coords_found[:150]):
    try:
        lat = float(lat_s)
        lon = float(lon_s)
        if 26.0 < lat < 28.0 and 75.0 < lon < 77.0:
            popup_text = popups_found[i] if i < len(popups_found) else "<b>Wireless Node</b>"
            
            # Color logic
            color = "#0099FF"
            if "wpa3" in popup_text.lower():
                color = "#00CC44"
            elif "wep" in popup_text.lower() or "open" in popup_text.lower():
                color = "#FF3300"

            folium.CircleMarker(
                location=[lat, lon],
                radius=6,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.8,
                popup=folium.Popup(popup_text, max_width=280)
            ).add_to(network_group)
    except Exception:
        pass

# Add Map Controls
folium.LayerControl(collapsed=False).add_to(nims_map)
Fullscreen(position="topleft").add_to(nims_map)
MeasureControl(position="bottomleft").add_to(nims_map)

# Save clean, pure full-screen map without floating overlays
nims_output = r"c:\Users\ishit jain\Desktop\nims_recon_system.html"
workspace_nims = r"c:\Users\ishit jain\Documents\antigravity\quirky-bell\nims_recon_system.html"
nims_map.save(nims_output)
nims_map.save(workspace_nims)

print("[+] Clean satellite map generated: Floating HUD completely removed!")
