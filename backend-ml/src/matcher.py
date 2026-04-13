"""
Pure Python/OpenCV fingerprint minutiae extraction and matching.
No external biometric library required.

Steps:
  1. Histogram equalization + Gabor filter bank (ridge enhancement)
  2. Gaussian blur + Otsu threshold + morphological cleanup
  3. Skeletonize ridges to 1-pixel width
  4. Crossing Number algorithm: CN=1 → ending, CN=3 → bifurcation
  5. Match two minutiae sets by spatial proximity + type agreement

Match score >= 0.4 → same finger (tune based on your sensor DPI and dataset)
"""

import cv2
import numpy as np
from pathlib import Path
from skimage.morphology import skeletonize

def preprocess(image_path: str) -> np.ndarray:
    img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Cannot read: {image_path}")
    img = cv2.equalizeHist(img)
    img = _apply_gabor(img)
    img = cv2.GaussianBlur(img, (3, 3), 0)
    _, binary = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    return skeletonize(binary // 255).astype(np.uint8)

def _apply_gabor(img: np.ndarray) -> np.ndarray:
    enhanced = np.zeros_like(img, dtype=np.float32)
    for theta in [0, 45, 90, 135]:
        kernel = cv2.getGaborKernel((15,15), 4.0, np.deg2rad(theta), 10.0, 0.5, 0)
        enhanced = np.maximum(enhanced, cv2.filter2D(img.astype(np.float32), -1, kernel))
    return cv2.normalize(enhanced, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

def extract_minutiae(image_path: str) -> np.ndarray:
    skeleton = preprocess(image_path)
    h, w = skeleton.shape
    offsets = [(-1,-1),(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1),(0,-1)]
    minutiae = []
    for y in range(1, h-1):
        for x in range(1, w-1):
            if skeleton[y, x] == 0:
                continue
            neighbors = [skeleton[y+dy, x+dx] for dy, dx in offsets]
            cn = sum(abs(int(neighbors[k]) - int(neighbors[(k+1)%8])) for k in range(8)) // 2
            if cn == 1:
                minutiae.append([x, y, 0, 0.0])
            elif cn == 3:
                minutiae.append([x, y, 1, 0.0])
    minutiae = np.array(minutiae, dtype=np.float32) if minutiae else np.zeros((0, 4))
    if len(minutiae) > 0:
        margin = 15
        mask = ((minutiae[:,0] > margin) & (minutiae[:,0] < w-margin) &
                (minutiae[:,1] > margin) & (minutiae[:,1] < h-margin))
        minutiae = minutiae[mask]
    return minutiae

def serialize_minutiae(minutiae: np.ndarray) -> bytes:
    return minutiae.tobytes() + len(minutiae).to_bytes(4, 'little')

def deserialize_minutiae(data: bytes) -> np.ndarray:
    count = int.from_bytes(data[-4:], 'little')
    return np.frombuffer(data[:-4], dtype=np.float32).reshape(count, 4)

def match_minutiae(m1: np.ndarray, m2: np.ndarray,
                   dist_threshold=20.0, type_weight=0.3) -> float:
    if len(m1) == 0 or len(m2) == 0:
        return 0.0
    matched, used = 0.0, set()
    for pt1 in m1:
        dists = np.linalg.norm(m2[:, :2] - pt1[:2], axis=1)
        j = int(np.argmin(dists))
        if dists[j] < dist_threshold and j not in used:
            matched += 1.0 if pt1[2] == m2[j, 2] else (1.0 - type_weight)
            used.add(j)
    return matched / max(len(m1), len(m2))

def verify_identity(probe_path: str, stored_bytes: bytes,
                    threshold=0.4) -> tuple:
    probe = extract_minutiae(probe_path)
    stored = deserialize_minutiae(stored_bytes)
    score = match_minutiae(probe, stored)
    return score >= threshold, score
