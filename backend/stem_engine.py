"""
Open-source stem separation.

Preferred: Demucs (if installed — heavy torch, optional).
Default free path: scipy / numpy harmonic-percussive source separation (HPSS)
plus band splits. Honest labels — never claim neural if mock/HPSS.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np


def separate_stems(source_path: str, out_dir: str, job_id: str) -> dict[str, Any]:
    """
    Write stem WAVs into out_dir. Returns {stems: {name: filename}, method, note}.
    Filenames are relative to out_dir (e.g. stem_xxx_vocals.wav).
    """
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    demucs = _try_demucs(source_path, out_dir, job_id)
    if demucs:
        return demucs

    return _hpss_band_stems(source_path, out_dir, job_id)


def _try_demucs(source_path: str, out_dir: str, job_id: str) -> dict[str, Any] | None:
    try:
        import torch  # noqa: F401
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        from demucs.audio import AudioFile, save_audio
    except Exception:
        return None

    try:
        model = get_model("htdemucs")
        model.eval()
        wav = AudioFile(source_path).read(streams=0, samplerate=model.samplerate, channels=model.audio_channels)
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()
        sources = apply_model(model, wav[None], device="cpu")[0]
        names = model.sources  # typically drums, bass, other, vocals
        stems: dict[str, str] = {}
        for i, name in enumerate(names):
            fname = f"stem_{job_id}_{name}.wav"
            save_audio(sources[i], os.path.join(out_dir, fname), model.samplerate)
            stems[name] = fname
        # Aliases for UI that expects acapella/synth
        if "vocals" in stems and "acapella" not in stems:
            stems["acapella"] = stems["vocals"]
        if "other" in stems and "synth" not in stems:
            stems["synth"] = stems["other"]
        return {
            "stems": stems,
            "method": "demucs_htdemucs",
            "note": "Neural separation via open-source Demucs (Facebook Research).",
        }
    except Exception as e:
        print(f"[STEM ENGINE] Demucs failed, falling back to HPSS: {e}")
        return None


def _hpss_band_stems(source_path: str, out_dir: str, job_id: str) -> dict[str, Any]:
    """
    Free DSP stems: harmonic/percussive + frequency bands.
    Not neural — useful for rough isolation on free hosts without torch.
    """
    import soundfile as sf
    from scipy import signal

    data, sr = sf.read(source_path, always_2d=True)
    mono = data.mean(axis=1).astype(np.float64)

    # Simple STFT HPSS (Fitzgerald-style soft mask approximation)
    n_fft = 2048
    hop = 512
    f, t, Z = signal.stft(mono, fs=sr, nperseg=n_fft, noverlap=n_fft - hop)
    mag = np.abs(Z)
    phase = np.angle(Z)

    # Median filter along time → harmonic; along frequency → percussive
    from scipy.ndimage import median_filter

    harm = median_filter(mag, size=(1, 31))
    perc = median_filter(mag, size=(31, 1))
    total = harm + perc + 1e-8
    mask_h = harm / total
    mask_p = perc / total
    H = mask_h * mag * np.exp(1j * phase)
    P = mask_p * mag * np.exp(1j * phase)
    _, harmonic = signal.istft(H, fs=sr, nperseg=n_fft, noverlap=n_fft - hop)
    _, percussive = signal.istft(P, fs=sr, nperseg=n_fft, noverlap=n_fft - hop)

    n = len(mono)
    harmonic = _fit(harmonic, n)
    percussive = _fit(percussive, n)

    # Band splits on original for bass / air-ish "vocals"
    bass = _butter_filter(mono, sr, kind="low", cutoff=250)
    vocals_band = _butter_filter(mono, sr, kind="high", cutoff=300) * 0.7 + harmonic * 0.3
    drums = percussive
    other = mono - 0.5 * bass - 0.35 * drums
    other = np.clip(other, -1.0, 1.0)

    mapping = {
        "bass": bass,
        "drums": drums,
        "acapella": vocals_band,
        "synth": other,
        "vocals": vocals_band,
        "other": other,
    }

    stems: dict[str, str] = {}
    for name, arr in mapping.items():
        if name in ("vocals", "other"):
            continue  # keep UI keys primary; include aliases only if needed
        fname = f"stem_{job_id}_{name}.wav"
        # stereo-ish write mono as 1ch
        sf.write(os.path.join(out_dir, fname), arr.astype(np.float32), sr)
        stems[name] = fname

    return {
        "stems": stems,
        "method": "scipy_hpss_bands",
        "note": (
            "Open-source HPSS + band split (scipy/numpy). "
            "Install Demucs + torch for neural stems. Not a substitute for dedicated stem tools."
        ),
    }


def _fit(x: np.ndarray, n: int) -> np.ndarray:
    if len(x) < n:
        return np.pad(x, (0, n - len(x)))
    return x[:n]


def _butter_filter(x: np.ndarray, sr: int, kind: str, cutoff: float) -> np.ndarray:
    from scipy import signal

    nyq = 0.5 * sr
    wn = min(max(cutoff / nyq, 0.001), 0.999)
    b, a = signal.butter(4, wn, btype=kind)
    return signal.filtfilt(b, a, x)
