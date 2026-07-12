import matchering as mg
import sys
import os
import json
import shutil
import subprocess
import numpy as np
import resampy
from pedalboard import (
    Pedalboard, HighShelfFilter, LowShelfFilter, PeakFilter,
    Compressor, Chorus, Limiter, LowpassFilter, HighpassFilter,
)
from pedalboard.io import AudioFile

# ---------------------------------------------------------------------------
# Sovereign Mastering Worker
#
# Backward compatible: the first 7 positional args are unchanged
#   <target> <reference|NONE> <output> <sub> <air> <snap> <width>
# New options are passed as trailing --key=value flags:
#   --warmth= --presence= --demud=   (0-100, 50 neutral tone bands)
#   --mono_bass=true|false           (sum <120Hz to mono, phase-tight lows)
#   --ref_influence=0..100           (blend matchered vs original; 100 = full)
#   --lufs=<number>                  (EBU R128 loudnorm target, e.g. -14)
# reference == "NONE" -> Pure mode (no reference; skip matchering).
# ---------------------------------------------------------------------------


def parse_flags(argv):
    flags = {}
    for a in argv:
        if a.startswith("--"):
            if "=" in a:
                k, v = a[2:].split("=", 1)
                flags[k] = v
            else:
                flags[a[2:]] = "true"
    return flags


def read_audio(path):
    with AudioFile(path) as f:
        audio = f.read(f.frames)  # (channels, frames) float32
        sr = f.samplerate
    return audio, sr


def to_stereo(a):
    if a.shape[0] == 1:
        return np.vstack([a, a])
    if a.shape[0] > 2:
        return a[:2]
    return a


def run_loudnorm(in_path, out_path, lufs):
    """Two-pass EBU R128 loudnorm to `lufs` LUFS at -1.0 dBTP.
    Returns True on success; never raises (loudness is a nice-to-have)."""
    try:
        pass1 = subprocess.run(
            ["ffmpeg", "-hide_banner", "-i", in_path,
             "-af", f"loudnorm=I={lufs}:TP=-1.0:LRA=11:print_format=json",
             "-f", "null", "-"],
            capture_output=True, text=True,
        )
        txt = pass1.stderr or ""
        start, end = txt.rfind("{"), txt.rfind("}")
        if start == -1 or end == -1:
            print("LOUDNORM WARNING: could not read measurement; keeping un-normalized.")
            return False
        meas = json.loads(txt[start:end + 1])
        af = (
            f"loudnorm=I={lufs}:TP=-1.0:LRA=11:"
            f"measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
            f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
            f"offset={meas['target_offset']}:linear=true"
        )
        pass2 = subprocess.run(
            ["ffmpeg", "-hide_banner", "-y", "-i", in_path,
             "-af", af, "-ar", "44100", out_path],
            capture_output=True, text=True,
        )
        return pass2.returncode == 0 and os.path.exists(out_path)
    except Exception as e:
        print(f"LOUDNORM WARNING: {e} — keeping un-normalized output.")
        return False


def process_audio(target_path, reference_path, output_path, sub, air, snap, width, flags):
    sub, air, snap, width = float(sub), float(air), float(snap), float(width)
    warmth = float(flags.get("warmth", 50))
    presence = float(flags.get("presence", 50))
    demud = float(flags.get("demud", 50))
    mono_bass = str(flags.get("mono_bass", "false")).lower() in ("1", "true", "yes")
    ref_influence = float(flags.get("ref_influence", 100))
    lufs = flags.get("lufs")

    if not os.path.exists(target_path):
        print(f"ERROR: Target file not found at {target_path}")
        sys.exit(1)

    use_ref = bool(reference_path) and reference_path != "NONE" and os.path.exists(reference_path)
    temp_matched_path = target_path + "_matched.wav"

    # ---- Phase 1: reference match (skipped in Pure mode) ----
    if use_ref:
        print("MATCHERING WORKER: Phase 1 - Reference matching...")
        try:
            mg.process(target=target_path, reference=reference_path,
                       results=[mg.pcm24(temp_matched_path)])
        except Exception as e:
            print(f"CRITICAL ERROR in Matchering Engine: {e}")
            sys.exit(1)
        base_path = temp_matched_path
        print("MATCHERING WORKER: Phase 1 complete.")
    else:
        print("MATCHERING WORKER: Pure mode (no reference) — DSP only.")
        base_path = target_path

    audio, sr = read_audio(base_path)

    # ---- Blend matchered vs original (reference influence) ----
    if use_ref and ref_influence < 100:
        try:
            orig, sr_o = read_audio(target_path)
            if sr_o != sr:
                orig = resampy.resample(orig, sr_o, sr, axis=1)
            if orig.shape[0] != audio.shape[0]:
                audio, orig = to_stereo(audio), to_stereo(orig)
            n = min(audio.shape[1], orig.shape[1])
            x = ref_influence / 100.0
            audio = audio[:, :n] * x + orig[:, :n] * (1.0 - x)
            print(f"MATCHERING WORKER: Blended reference influence {ref_influence:.0f}%.")
        except Exception as e:
            print(f"BLEND WARNING: {e} — using full matchered signal.")

    audio = audio.astype(np.float32)

    # ---- Phase 2: DSP chain (blend -> EQ -> dynamics) ----
    print(f"MATCHERING WORKER: Phase 2 - DSP (Sub:{sub} Demud:{demud} Warmth:{warmth} "
          f"Presence:{presence} Air:{air} Snap:{snap} Width:{width} MonoBass:{mono_bass}).")
    board = Pedalboard([LowShelfFilter(cutoff_frequency_hz=80, gain_db=(sub - 50) / 10.0)])
    if demud > 50:
        board.append(PeakFilter(cutoff_frequency_hz=300, gain_db=-(demud - 50) / 8.0, q=1.2))
    if warmth != 50:
        board.append(PeakFilter(cutoff_frequency_hz=200, gain_db=(warmth - 50) / 12.0, q=0.7))
    if presence != 50:
        board.append(PeakFilter(cutoff_frequency_hz=3800, gain_db=(presence - 50) / 10.0, q=0.9))
    board.append(HighShelfFilter(cutoff_frequency_hz=10000, gain_db=(air - 50) / 10.0))
    if snap > 50:
        board.append(Compressor(threshold_db=-20.0, ratio=1.0 + ((snap - 50) / 25.0),
                                attack_ms=30.0, release_ms=100.0))
    if width > 50:
        board.append(Chorus(rate_hz=0.5, depth=0.1, centre_delay_ms=7.0,
                            feedback=0.0, mix=(width - 50) / 200.0))

    try:
        effected = board(audio, sr)

        # Mono-bass: sum everything below 120Hz to mono (phase-tight club lows)
        if mono_bass and effected.shape[0] >= 2:
            low = Pedalboard([LowpassFilter(cutoff_frequency_hz=120)])(effected, sr)
            high = Pedalboard([HighpassFilter(cutoff_frequency_hz=120)])(effected, sr)
            low_mono = np.repeat(np.mean(low, axis=0, keepdims=True), effected.shape[0], axis=0)
            effected = low_mono + high

        # True-peak safety limiter (ALWAYS last DSP stage)
        effected = Pedalboard([Limiter(threshold_db=-1.0, release_ms=100.0)])(effected, sr)

        with AudioFile(output_path, 'w', sr, effected.shape[0]) as f:
            f.write(effected)
        print("MATCHERING WORKER: Phase 2 complete.")
    except Exception as e:
        print(f"CRITICAL ERROR in DSP Engine: {e}")
        sys.exit(1)
    finally:
        if use_ref and os.path.exists(temp_matched_path):
            os.remove(temp_matched_path)

    # ---- Phase 3: optional loudness normalization ----
    if lufs:
        print(f"MATCHERING WORKER: Phase 3 - Loudness normalize to {lufs} LUFS...")
        tmp_ln = output_path + "_ln.wav"
        if run_loudnorm(output_path, tmp_ln, float(lufs)):
            shutil.move(tmp_ln, output_path)
            print("MATCHERING WORKER: Loudness target achieved.")
        else:
            if os.path.exists(tmp_ln):
                os.remove(tmp_ln)
            print("MATCHERING WORKER: Loudness stage skipped (fallback to limiter output).")

    sys.exit(0)


if __name__ == "__main__":
    if len(sys.argv) < 8:
        print("Usage: python matcher_worker.py <target> <reference|NONE> <output> "
              "<sub> <air> <snap> <width> [--warmth= --presence= --demud= "
              "--mono_bass= --ref_influence= --lufs=]")
        sys.exit(1)

    flags = parse_flags(sys.argv[8:])
    process_audio(sys.argv[1], sys.argv[2], sys.argv[3],
                  sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7], flags)
