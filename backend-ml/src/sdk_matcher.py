"""
SecuGen SDK template operations for Linux.
Uses PYSGFPLib from the installed Linux SDK to:
  1. Create SG400 templates from grayscale PNG images
  2. Compare two templates and return a match score 0-199

The SDK shared library (libpysgfplib.so) must be installed to /usr/local/lib/
via the setup_sdk.sh script before this module can be used.
"""

import sys
import os
import logging

# Add the sdk/ subdirectory to path so pysgfplib can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sdk'))

import cv2
import numpy as np
from ctypes import c_int, create_string_buffer

logger = logging.getLogger(__name__)

# SG400 template is always exactly 400 bytes
TEMPLATE_SIZE = 400

# Standard image size expected by the SDK
STANDARD_WIDTH = 300
STANDARD_HEIGHT = 400


def _load_sdk():
    """Load and initialize the SecuGen SDK."""
    from sdk.pysgfplib import PYSGFPLib
    sg = PYSGFPLib()
    sg.Create()
    return sg


def create_template_from_png(png_path: str) -> bytes:
    """
    Read a PNG fingerprint image, normalize to 300x400 grayscale,
    and create an SG400 template (400 bytes).

    Args:
        png_path: Path to the PNG fingerprint image

    Returns:
        400-byte SG400 template

    Raises:
        FileNotFoundError: If image cannot be read
        RuntimeError: If SDK template creation fails
    """
    img = cv2.imread(png_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {png_path}")

    # Normalize to standard size
    if img.shape != (STANDARD_HEIGHT, STANDARD_WIDTH):
        img = cv2.resize(img, (STANDARD_WIDTH, STANDARD_HEIGHT), interpolation=cv2.INTER_AREA)

    raw = img.tobytes()
    raw_buf = create_string_buffer(raw, len(raw))
    tmpl_buf = create_string_buffer(TEMPLATE_SIZE)

    sg = _load_sdk()
    err = sg.CreateSG400Template(raw_buf, tmpl_buf)

    return bytes(tmpl_buf)


def get_match_score(template1: bytes, template2: bytes) -> int:
    """
    Compare two SG400 templates and return a match score.

    Args:
        template1: 400-byte SG400 template (probe)
        template2: 400-byte SG400 template (stored)

    Returns:
        Integer match score 0-199 (higher = more similar)
    """
    buf1 = create_string_buffer(template1, TEMPLATE_SIZE)
    buf2 = create_string_buffer(template2, TEMPLATE_SIZE)
    score = c_int(0)

    sg = _load_sdk()
    sg.GetMatchingScore(buf1, buf2, score)

    return score.value
