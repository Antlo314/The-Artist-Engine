import requests
import json
import time

url = "http://127.0.0.1:8001/api/scout"
data = {
    "city": "Chicago",
    "genre": "Deep House",
    "tier": "Mid-Size Touring (250-1000 cap)",
    "radius": "50 miles",
    "timeframe": "Fall 2026"
}

start = time.time()
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)[:500]}...")
except Exception as e:
    print(f"Error: {e}")
print(f"Time taken: {time.time() - start:.2f} seconds")
