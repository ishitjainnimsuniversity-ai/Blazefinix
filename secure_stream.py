import cv2
import numpy as np
from flask import Flask, Response, render_template_string
import datetime
import socket
import time
import threading

app = Flask(__name__)

# ==========================================================
# WINDOWS DIRECTSHOW CAMERA CAPTURE
# cv2.CAP_DSHOW is required on Windows to prevent MSMF hangs
# ==========================================================
class CameraStream:
    def __init__(self, src=0):
        self.src = src
        # Try DirectShow on Windows, fallback to default
        self.cap = cv2.VideoCapture(self.src, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(self.src)
            
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        self.frame = None
        self.running = True
        self.lock = threading.Lock()
        
        # Start background frame reader thread
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()

    def _update(self):
        while self.running:
            if self.cap.isOpened():
                success, frame = self.cap.read()
                if success and frame is not None and frame.size > 0:
                    with self.lock:
                        self.frame = frame.copy()
                else:
                    time.sleep(0.05)
            else:
                time.sleep(0.1)

    def get_frame(self):
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
        return None

    def stop(self):
        self.running = False
        if self.cap.isOpened():
            self.cap.release()

# Global camera instance
camera_stream = CameraStream(0)

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

def generate_frames():
    angle = 0
    while True:
        frame = camera_stream.get_frame()
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if frame is None:
            # Fallback: High-Tech Security Radar Test Pattern if webcam is warming up
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.circle(frame, (320, 240), 160, (0, 100, 0), 2)
            cv2.circle(frame, (320, 240), 80, (0, 70, 0), 1)
            
            # Sweeping radar line
            rad = np.deg2rad(angle)
            end_x = int(320 + 160 * np.cos(rad))
            end_y = int(240 + 160 * np.sin(rad))
            cv2.line(frame, (320, 240), (end_x, end_y), (0, 255, 0), 2)
            angle = (angle + 10) % 360
            
            cv2.putText(frame, "STANDBY: INITIALIZING CAMERA...", (110, 230),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, "Check Windows Camera Privacy if feed persists", (100, 270),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
        else:
            # Resize frame for clean web delivery
            frame = cv2.resize(frame, (640, 480))
            
            # Security HUD Overlay
            cv2.putText(frame, f"REC [LIVE] - {timestamp}", (15, 35), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)
            cv2.putText(frame, "NIMS HOSTEL SENTRY | CAM-01", (15, 460), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 1)

        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)  # ~30 FPS

@app.route('/')
def index():
    html_page = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>NIMS Security Monitor</title>
        <style>
            body {{
                background-color: #0b1120;
                color: #f8fafc;
                font-family: 'Consolas', 'Segoe UI', monospace;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }}
            .card {{
                background: #1e293b;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                border: 1px solid #334155;
                text-align: center;
                max-width: 680px;
            }}
            h2 {{
                color: #38bdf8;
                margin: 0 0 15px 0;
                font-size: 18px;
            }}
            .screen {{
                border: 3px solid #ef4444;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 0 15px rgba(239,68,68,0.3);
                background: #000;
            }}
            img {{
                width: 100%;
                display: block;
            }}
            .meta {{
                margin-top: 15px;
                font-size: 12px;
                color: #94a3b8;
                background: #0f172a;
                padding: 10px;
                border-radius: 6px;
                text-align: left;
                line-height: 1.6;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🛰️ NIMS CYBER SENTRY - CAM-01 [LIVE]</h2>
            <div class="screen">
                <img src="/video_feed" alt="Streaming Camera Feed...">
            </div>
            <div class="meta">
                <div>🔴 <b>Status:</b> Live MJPEG Video Feed (DirectShow)</div>
                <div>📡 <b>Local Access:</b> <a href="http://localhost:5000" style="color:#38bdf8;">http://localhost:5000</a></div>
                <div>🌐 <b>Network Access:</b> http://{LOCAL_IP}:5000</div>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_page)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("=" * 60)
    print(f"[*] Starting DirectShow Camera Stream Server...")
    print(f"[*] Local URL:    http://localhost:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
