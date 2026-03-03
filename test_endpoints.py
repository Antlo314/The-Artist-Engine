import requests
import os

with open("test_audio.wav", "wb") as f:
    f.write(b"RIFF" + b"\x00"*40)

print("Testing Master Endpoint...")
try:
    with open("test_audio.wav", "rb") as t, open("test_audio.wav", "rb") as r:
        res = requests.post("http://localhost:8000/api/master", files={"target": t, "reference": r})
        print(f"Master Status: {res.status_code}")
        print(res.text[:200])
except Exception as e:
    print(f"Master Error: {e}")

print("\nTesting Stems Endpoint...")
try:
    with open("test_audio.wav", "rb") as t:
        res = requests.post("http://localhost:8000/api/extract-stems", files={"target": t})
        print(f"Stems Status: {res.status_code}")
        print(res.text[:200])
except Exception as e:
    print(f"Stems Error: {e}")

if os.path.exists("test_audio.wav"):
    os.remove("test_audio.wav")
