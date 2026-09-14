"""
OpenCV Dermatological Skin Phototype and Cutaneous Feature Extraction Engine
Calculates Individual Typology Angle (ITA), Fitzpatrick Skin Classification (Types I-VI),
melanin and erythema indexes, and lesion morphological irregularity.
"""

import cv2
import numpy as np
import base64
import math
from typing import Dict, Any, Tuple

class SkinVisionAnalyzer:
    """Extracts objective skin pigmentation and dermatological biomarkers using OpenCV."""

    @staticmethod
    def calculate_ita(l_val: float, b_val: float) -> float:
        """
        Calculates Individual Typology Angle (ITA) in degrees:
        ITA = arctan((L* - 50) / b*) * (180 / pi)
        """
        if abs(b_val) < 1e-5:
            b_val = 1e-5
        ita_rad = math.atan2(l_val - 50.0, b_val)
        return float(math.degrees(ita_rad))

    @staticmethod
    def classify_fitzpatrick(ita: float) -> Tuple[str, str, str]:
        """
        Standard clinical dermatological classification based on ITA degrees.
        Returns: (Phototype, Category Name, Clinical Description)
        """
        if ita > 55.0:
            return ("Type I", "Very Light", "Always burns easily, never tans; highest photosensitivity risk.")
        elif ita > 41.0:
            return ("Type II", "Light", "Burns easily, tans minimally; high photosensitivity.")
        elif ita > 28.0:
            return ("Type III", "Intermediate", "Burns moderately, tans gradually to light brown.")
        elif ita > 10.0:
            return ("Type IV", "Tan / Olive", "Burns minimally, tans easily to moderate brown.")
        elif ita > -30.0:
            return ("Type V", "Brown", "Rarely burns, tans profusely to dark brown.")
        else:
            return ("Type VI", "Dark / Deeply Pigmented", "Never burns, deeply pigmented; strong natural photoprotection.")

    @classmethod
    def analyze_image_bytes(cls, image_bytes: bytes) -> Dict[str, Any]:
        """Runs full OpenCV analysis on raw image bytes."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("OpenCV failed to decode image. Invalid image buffer format.")
        return cls.analyze_image_array(img)

    @classmethod
    def analyze_image_array(cls, img: np.ndarray) -> Dict[str, Any]:
        """Performs color space conversion, ITA calculation, and lesion morphology."""
        h, w, _ = img.shape

        # 1. Focus on center optical reticle & skin chrominance to exclude background/clothing/hair
        cx, cy = w // 2, h // 2
        radius = max(20, min(w, h) // 4)

        # Create central circular mask matching the camera reticle
        circle_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(circle_mask, (cx, cy), radius, 255, -1)

        # Convert to CIE L*a*b* for objective colorimetry
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_chan, a_chan, b_chan = cv2.split(lab)

        # Also compute YCrCb skin chrominance mask
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        skin_chroma_mask = cv2.inRange(ycrcb, np.array([20, 130, 70]), np.array([255, 180, 135]))

        # Combined mask: prioritize skin pixels within or near central reticle
        fused_mask = cv2.bitwise_and(circle_mask, skin_chroma_mask)
        if cv2.countNonZero(fused_mask) < 200:
            # Fallback to central circle if lighting deviates from standard YCrCb thresholds
            fused_mask = circle_mask

        # Extract pixels from skin ROI
        skin_pixels_l = l_chan[fused_mask > 0]
        skin_pixels_a = a_chan[fused_mask > 0]
        skin_pixels_b = b_chan[fused_mask > 0]

        if len(skin_pixels_l) > 0:
            # Scale to standard scientific CIE units: L* in [0, 100], a* and b* in [-128, 127]
            l_real = float(np.mean(skin_pixels_l) * (100.0 / 255.0))
            a_real = float(np.mean(skin_pixels_a) - 128.0)
            b_real = float(np.mean(skin_pixels_b) - 128.0)
        else:
            l_real = float(np.mean(l_chan) * (100.0 / 255.0))
            a_real = float(np.mean(a_chan) - 128.0)
            b_real = float(np.mean(b_chan) - 128.0)

        # Calculate ITA and Fitzpatrick Phototype
        ita = cls.calculate_ita(l_real, b_real)
        phototype, cat_name, desc = cls.classify_fitzpatrick(ita)

        # 2. RGB Photometric metrics on skin ROI
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        skin_r = rgb[:, :, 0][fused_mask > 0]
        r_mean = float(np.mean(skin_r)) if len(skin_r) > 0 else float(np.mean(rgb[:, :, 0]))

        # Melanin and Erythema Index proxies
        melanin_index = round(max(0.0, (255.0 - r_mean) / 2.55), 2)
        erythema_index = round(max(0.0, a_real * 2.0 + 20.0), 2)

        # 3. Lesion Contour and Morphology Detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        border_irregularity = 0.12
        asymmetry_score = 0.10
        lesion_detected = False

        annotated_img = img.copy()

        # Draw optical alignment target overlay on annotated image
        cv2.circle(annotated_img, (cx, cy), radius, (0, 255, 128), 2)
        cv2.putText(annotated_img, f"ROI ITA: {ita:.1f} deg", (cx - 60, cy - radius - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 128), 1, cv2.LINE_AA)

        if contours:
            # Filter contours near central area
            significant_cnts = [
                cnt for cnt in contours
                if cv2.contourArea(cnt) > (h * w * 0.005) and cv2.arcLength(cnt, True) > 0
            ]
            if significant_cnts:
                largest_cnt = max(significant_cnts, key=cv2.contourArea)
                area = cv2.contourArea(largest_cnt)
                perimeter = cv2.arcLength(largest_cnt, True)
                
                lesion_detected = True
                circularity = (4.0 * math.pi * area) / (perimeter * perimeter)
                border_irregularity = round(max(0.0, min(1.0, 1.0 - circularity)), 3)

                rect = cv2.minAreaRect(largest_cnt)
                box_w, box_h = rect[1]
                if max(box_w, box_h) > 0:
                    aspect_ratio = min(box_w, box_h) / max(box_w, box_h)
                    asymmetry_score = round(max(0.0, min(1.0, 1.0 - aspect_ratio)), 3)

                cv2.drawContours(annotated_img, [largest_cnt], -1, (255, 128, 0), 2)
                M = cv2.moments(largest_cnt)
                if M["m00"] != 0:
                    cX = int(M["m10"] / M["m00"])
                    cY = int(M["m01"] / M["m00"])
                    cv2.circle(annotated_img, (cX, cY), 4, (0, 165, 255), -1)

        color_std = float(np.std(rgb[:, :, 0]) + np.std(rgb[:, :, 1]) + np.std(rgb[:, :, 2])) / 3.0
        color_variegation = round(min(1.0, color_std / 50.0), 3)

        _, enc_buf = cv2.imencode('.jpg', annotated_img, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        raw_b64 = base64.b64encode(enc_buf).decode('utf-8')
        b64_image = f"data:image/jpeg;base64,{raw_b64}"

        return {
            "l_star": round(l_real, 2),
            "a_star": round(a_real, 2),
            "b_star": round(b_real, 2),
            "ita_degrees": round(ita, 2),
            "fitzpatrick_phototype": phototype,
            "skin_category": cat_name,
            "clinical_description": desc,
            "melanin_index": melanin_index,
            "erythema_index": erythema_index,
            "lesion_detected": lesion_detected,
            "border_irregularity_score": border_irregularity,
            "asymmetry_score": asymmetry_score,
            "color_variegation_score": color_variegation,
            "image_annotated_b64": b64_image
        }

    @classmethod
    def generate_reference_sample(cls, phototype_index: int) -> Tuple[np.ndarray, str]:
        """
        Synthesizes reference clinical skin phototype textures for testing and baseline benchmarking.
        Indices 0 to 5 map to Fitzpatrick Types I through VI.
        """
        h, w = 300, 300
        # Realistic nominal RGB skin tones for Fitzpatrick I-VI
        nominal_tones = [
            (250, 226, 210),  # Type I (Very Light)
            (240, 205, 175),  # Type II (Light)
            (218, 178, 140),  # Type III (Intermediate)
            (185, 140, 100),  # Type IV (Tan/Olive)
            (138, 90, 55),    # Type V (Brown)
            (72, 45, 30),     # Type VI (Dark)
        ]
        idx = max(0, min(5, phototype_index))
        r_base, g_base, b_base = nominal_tones[idx]

        # Generate base skin texture with subtle micro-vasculature and melanin noise
        np.random.seed(42 + idx)
        noise = np.random.normal(0, 4, (h, w, 3))
        img = np.zeros((h, w, 3), dtype=np.float32)
        img[:, :, 0] = b_base + noise[:, :, 0]  # OpenCV BGR
        img[:, :, 1] = g_base + noise[:, :, 1]
        img[:, :, 2] = r_base + noise[:, :, 2]

        # Add benign cutaneous lesion in center for morphology testing
        cv2.circle(img, (w // 2, h // 2), 26, (b_base * 0.75, g_base * 0.70, r_base * 0.70), -1)
        cv2.ellipse(img, (w // 2 + 5, h // 2 - 4), (20, 14), 30, 0, 360, (b_base * 0.70, g_base * 0.65, r_base * 0.65), -1)

        img = np.clip(img, 0, 255).astype(np.uint8)
        img = cv2.GaussianBlur(img, (3, 3), 0)

        _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        b64 = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"
        return img, b64
