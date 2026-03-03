import matchering as mg
import sys
import os
from pedalboard import Pedalboard, HighShelfFilter, LowShelfFilter, Compressor, Chorus
from pedalboard.io import AudioFile

def process_audio(target_path, reference_path, output_path, sub, air, snap, width):
    print("MATCHERING WORKER: Received request for OMEGA-tier audio finalization.")
    print(f"TARGET: {target_path}")
    print(f"REFERENCE: {reference_path}")
    
    if not os.path.exists(target_path):
        print(f"ERROR: Target file not found at {target_path}")
        sys.exit(1)
        
    if not os.path.exists(reference_path):
        print(f"ERROR: Reference file not found at {reference_path}")
        sys.exit(1)

    print("MATCHERING WORKER: Phase 1 - Initializing AI Matchering Engine...")
    temp_matched_path = target_path + "_matched.wav"
    
    try:
        # MatchRMS & EQ Match
        mg.process(
            target=target_path,
            reference=reference_path,
            results=[
                mg.pcm24(temp_matched_path)
            ]
        )
        print("MATCHERING WORKER: Phase 1 complete. Base LUFS achieved.")
    except Exception as e:
        print(f"CRITICAL ERROR in Matchering Engine: {str(e)}")
        sys.exit(1)

    print(f"MATCHERING WORKER: Phase 2 - Applying Sovereign DSP Engine (Sub:{sub} Air:{air} Snap:{snap} Width:{width}).")
    sub = float(sub)
    air = float(air)
    snap = float(snap)
    width = float(width)

    # Calculate pedalboard parameters (50 is neutral baseline)
    sub_gain_db = (sub - 50) / 10.0  # e.g., 100 -> +5dB
    air_gain_db = (air - 50) / 10.0  # e.g., 100 -> +5dB
    
    board = Pedalboard([
        LowShelfFilter(cutoff_frequency_hz=80, gain_db=sub_gain_db),
        HighShelfFilter(cutoff_frequency_hz=10000, gain_db=air_gain_db),
    ])
    
    # Transient Snap (Compressor)
    if snap > 50:
        ratio = 1.0 + ((snap - 50) / 25.0) # max 3:1
        board.append(Compressor(threshold_db=-20.0, ratio=ratio, attack_ms=30.0, release_ms=100.0))
        
    # Stereo Width (Chorus for micro-widening)
    if width > 50:
        mix = (width - 50) / 200.0 # max 0.25
        board.append(Chorus(rate_hz=0.5, depth=0.1, centre_delay_ms=7.0, feedback=0.0, mix=mix))

    try:
        with AudioFile(temp_matched_path) as f:
            audio = f.read(f.frames)
            samplerate = f.samplerate
        
        effected = board(audio, samplerate)
        
        with AudioFile(output_path, 'w', samplerate, effected.shape[0]) as f:
            f.write(effected)
            
        print("MATCHERING WORKER: Phase 2 complete. Master topology finalized.")
    except Exception as e:
        print(f"CRITICAL ERROR in DSP Engine: {str(e)}")
        sys.exit(1)
    finally:
        if os.path.exists(temp_matched_path):
            os.remove(temp_matched_path)
            
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) < 8:
        print("Usage: python matcher_worker.py <target> <reference> <output> <sub> <air> <snap> <width>")
        sys.exit(1)
        
    process_audio(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7])
