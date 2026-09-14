import base64
import json
import folium
from folium.plugins import MarkerCluster, Fullscreen, MeasureControl
import requests

# ==========================================
# 1. WiGLE API CREDENTIALS
# ==========================================
API_NAME = "AIDeda9721de9b14a0149aed1dcc959e95b"
API_TOKEN = "7b303d899a311dee2c73f04fe1473e5d"

auth_str = f"{API_NAME}:{API_TOKEN}"
encoded_auth = base64.b64encode(auth_str.encode("ascii")).decode("ascii")

headers = {
    "Authorization": f"Basic {encoded_auth}",
    "Accept": "application/json",
}

# ==========================================
# 2. JAIPUR METROPOLITAN COORDINATES
# ==========================================
# Center of Jaipur (Pink City)
JAIPUR_LAT = 26.912434
JAIPUR_LON = 75.787271

# Key zones across Jaipur to sample and build a city-wide map
ZONES = [
    {"name": "Central Jaipur / Pink City / MI Road", "lat": 26.9124, "lon": 75.7873},
    {"name": "Malviya Nagar / WTP / JLN Marg", "lat": 26.8530, "lon": 75.8050},
    {"name": "Mansarovar & Gopalpura Bypass", "lat": 26.8500, "lon": 75.7600},
    {"name": "Vaishali Nagar / Queens Road", "lat": 26.9050, "lon": 75.7350},
    {"name": "Sitapura Industrial & Tech Hub", "lat": 26.7750, "lon": 75.8350},
    {"name": "Jaipur-Delhi Highway & NIMS University Area", "lat": 27.1898, "lon": 75.9542}
]

print("[*] Contacting WiGLE Global Database for Jaipur Metropolitan Area...")

url = "https://api.wigle.net/api/v2/network/search"
all_networks = []
seen_bssids = set()

# Query each major sector of Jaipur (~50-100 per sector to stay safe within API rate limits)
for zone in ZONES:
    print(f"[*] Scanning Zone: {zone['name']}...")
    params = {
        "latrange1": zone["lat"] - 0.02,
        "latrange2": zone["lat"] + 0.02,
        "longrange1": zone["lon"] - 0.02,
        "longrange2": zone["lon"] + 0.02,
        "resultsPerPage": 50,
    }
    try:
        res = requests.get(url, headers=headers, params=params, timeout=15)
        if res.status_code == 200:
            data = res.json()
            if data.get("success"):
                results = data.get("results", [])
                for net in results:
                    bssid = net.get("netid")
                    if bssid and bssid not in seen_bssids:
                        seen_bssids.add(bssid)
                        all_networks.append(net)
                print(f"    [+] Retrieved {len(results)} nodes from {zone['name']}")
            else:
                print(f"    [-] Zone query message: {data.get('message')}")
        else:
            print(f"    [-] HTTP error {res.status_code}")
        time.sleep(2)  # Respect WiGLE per-minute query rate limit
    except Exception as e:
        print(f"    [-] Error querying zone: {e}")

print(f"\n[+] Total unique wireless nodes mapped across Jaipur: {len(all_networks)}")


# ==========================================
# 3. BUILD INTERACTIVE SATELLITE MAP
# ==========================================
print("[*] Rendering High-Resolution Satellite Map of Jaipur...")

jaipur_map = folium.Map(location=[JAIPUR_LAT, JAIPUR_LON], zoom_start=12, tiles=None)

# High-Resolution Esri Orbital Satellite Imagery
folium.TileLayer(
    tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr="Esri World Imagery",
    name="Orbital Satellite Imagery",
    overlay=False,
    control=True
).add_to(jaipur_map)

# Street Map Layer
folium.TileLayer(
    tiles="OpenStreetMap", 
    name="Street Navigation Map",
    overlay=False,
    control=True
).add_to(jaipur_map)

# Marker Clustering to keep browser smooth across the whole city
cluster_group = MarkerCluster(name="📡 Clustered Wireless Nodes (Click to Expand)").add_to(jaipur_map)

# Security Risk Assessment & Pin Plotting
for net in all_networks:
    ssid = net.get("ssid") or "<Hidden SSID>"
    bssid = net.get("netid", "N/A")
    trilat = net.get("trilat")
    trilong = net.get("trilong")
    encryption = net.get("encryption", "Unknown")
    channel = net.get("channel", "N/A")

    if trilat and trilong:
        # Color coding
        color = "blue"
        status = "Standard (WPA2)"
        if "wpa3" in encryption.lower():
            color = "green"
            status = "Secure (WPA3)"
        elif "wep" in encryption.lower() or "open" in encryption.lower() or "none" in encryption.lower():
            color = "red"
            status = "Vulnerable / Open"

        popup_html = f"""
        <div style="font-family: sans-serif; font-size: 12px; width: 230px;">
            <b style="font-size: 13px; color: #0284c7;">📡 {ssid}</b><hr style="margin: 4px 0;">
            <b>BSSID (MAC):</b> <code>{bssid}</code><br>
            <b>Security:</b> {encryption}<br>
            <b>Status:</b> <b>{status}</b><br>
            <b>Channel:</b> {channel}<br>
            <b>Location:</b> {trilat:.5f}, {trilong:.5f}
        </div>
        """

        folium.CircleMarker(
            location=[trilat, trilong],
            radius=6,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8,
            tooltip=f"{ssid} [{status}]",
            popup=folium.Popup(popup_html, max_width=280),
        ).add_to(cluster_group)

# Add Zone Landmark Pins
for zone in ZONES:
    folium.Marker(
        location=[zone["lat"], zone["lon"]],
        popup=f"<b>📍 {zone['name']}</b>",
        tooltip=zone["name"],
        icon=folium.Icon(color="purple", icon="crosshairs", prefix="fa")
    ).add_to(jaipur_map)

# Add Controls
folium.LayerControl(collapsed=False).add_to(jaipur_map)
Fullscreen(position="topleft").add_to(jaipur_map)
MeasureControl(position="bottomleft").add_to(jaipur_map)

# Save
output_path = "c:\\Users\\ishit jain\\Desktop\\jaipur_wifi_map.html"
jaipur_map.save(output_path)
print(f"\n[+] Full Jaipur Satellite Map built and saved directly to Desktop:")
print(f"    --> {output_path}")
