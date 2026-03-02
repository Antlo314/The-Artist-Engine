import requests
import os
import shutil

# API Endpoint (Testing against local server)
API_URL = "http://localhost:8000/api/master"

# Hardcoded Paths
TARGET_FILE = r"C:\Users\aarons\Downloads\Audio_Master_Core\LANDR-I DO-target.wav"
REF_FILE = r"C:\Users\aarons\Downloads\Audio_Master_Core\reference.mp3"
OUTPUT_DIR = r"C:\Users\aarons\Downloads\Audio_Master_Core"
FINAL_FILE = os.path.join(OUTPUT_DIR, "SOVEREIGN_MASTER_TEST.wav")

def test_mastering():
    print(f"--- INITIATING SOVEREIGN MASTERING TEST ---")
    print(f"Target: {TARGET_FILE}")
    print(f"Reference: {REF_FILE}")
    
    if not os.path.exists(TARGET_FILE) or not os.path.exists(REF_FILE):
        print("ERROR: Test files not found. Check paths.")
        return

    # Mock parameters that Oracle would suggest
    data = {
        'sub': '65',
        'air': '85',  # Heavy air boost to restore transients post-matchering
        'snap': '70', # Some snap to keep the kick/snare punchy
        'width': '60',
        'output_format': 'wav'
    }

    try:
        with open(TARGET_FILE, 'rb') as t_file, open(REF_FILE, 'rb') as r_file:
            files = {
                'target': ('target.wav', t_file, 'audio/wav'),
                'reference': ('reference.mp3', r_file, 'audio/mpeg')
            }
            
            print(f"Dispatching payload to {API_URL}...")
            response = requests.post(API_URL, data=data, files=files, stream=True)
            
            if response.status_code == 200:
                with open(FINAL_FILE, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"SUCCESS! Mastered audio saved to: {FINAL_FILE}")
                print("Please listen to the result to verify the muffled issue is resolved.")
            else:
                print(f"FAILED (Status {response.status_code}):")
                try:
                    print(response.json())
                except:
                    print(response.text)
                    
    except Exception as e:
        print(f"Connection Error: {e}")
        print("Make sure the backend is running locally via 'venv\Scripts\activate' and 'uvicorn main:app --reload'")

if __name__ == "__main__":
    test_mastering()
