"""
Broadcast-style meters for mastered audio — free/open stack only.

Uses soundfile + numpy. Optional pyloudnorm for ITU BS.1770 if installed;
otherwise a transparent RMS/peak approximation so the UI always gets numbers.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

import numpy as np


def measure_audio(path: str | Path) -> dict[str, Any]:
    """Return integrated loudness, true-peak, crest factor, duration."""
    path = str(path)
    try:
        import soundfile as sf
    except ImportError:
        return _empty("soundfile missing")

    try:
        data, sr = sf.read(path, always_2d=True)
    except Exception as e:
        return _empty(str(e))

    if data.size == 0 or sr <= 0:
        return _empty("empty audio")

    # mono for loudness
    mono = data.mean(axis=1).astype(np.float64)
    peak = float(np.max(np.abs(data)))
    true_peak_db = 20.0 * math.log10(max(peak, 1e-12))
    rms = float(np.sqrt(np.mean(mono ** 2)))
    rms_db = 20.0 * math.log10(max(rms, 1e-12))
    crest = true_peak_db - rms_db if peak > 0 else 0.0
    duration_s = float(len(mono) / sr)

    lufs = None
    lufs_method = "approx_rms"
    try:
        import pyloudnorm as pyln  # type: ignore

        meter = pyln.Meter(sr)
        # pyloudnorm expects (samples, channels)
        lufs = float(meter.integrated_loudness(data.astype(np.float64)))
        if math.isnan(lufs) or math.isinf(lufs):
            lufs = None
        else:
            lufs_method = "pyloudnorm_bs1770"
    except Exception:
        # Approx: many masters land near RMS - 3 to -5 dB vs LUFS; we report RMS as "approx LUFS"
        lufs = rms_db - 3.0
        lufs_method = "approx_rms_minus_3"

    return {
        "lufs_integrated": round(lufs, 2) if lufs is not None else None,
        "lufs_method": lufs_method,
        "true_peak_db": round(true_peak_db, 2),
        "rms_db": round(rms_db, 2),
        "crest_factor_db": round(crest, 2),
        "duration_sec": round(duration_s, 2),
        "sample_rate": int(sr),
        "channels": int(data.shape[1]),
        "streaming_ready": (
            lufs is not None
            and -16.5 <= lufs <= -12.5
            and true_peak_db <= -0.8
        ),
        "notes": (
            "Target ~−14 LUFS / ≤ −1.0 dBTP for most streaming platforms."
            if lufs is not None
            else "Install pyloudnorm for true BS.1770 LUFS."
        ),
    }


def _empty(reason: str) -> dict[str, Any]:
    return {
        "lufs_integrated": None,
        "lufs_method": "unavailable",
        "true_peak_db": None,
        "rms_db": None,
        "crest_factor_db": None,
        "duration_sec": None,
        "sample_rate": None,
        "channels": None,
        "streaming_ready": False,
        "notes": reason,
    }
