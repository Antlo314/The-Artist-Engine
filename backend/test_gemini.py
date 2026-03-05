import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv(dotenv_path=".env")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def test_async():
    print("Testing async...")
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents="Say hello"
        )
        print("Async response:", response.text)
    except Exception as e:
        print("Async error:", e)

def test_sync():
    print("Testing sync...")
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents="Say hello"
        )
        print("Sync response:", response.text)
    except Exception as e:
        print("Sync error:", e)

if __name__ == "__main__":
    test_sync()
    asyncio.run(test_async())
