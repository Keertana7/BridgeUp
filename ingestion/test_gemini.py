import os
from dotenv import load_dotenv
from google import genai

load_dotenv(override=True)

api_key = os.getenv("GEMINI_API_KEY")

print("Key found:", bool(api_key))
print("Key length:", len(api_key) if api_key else 0)
print("Key prefix:", api_key[:6] if api_key else None)

client = genai.Client(
    api_key= api_key
)

response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="Say hello to BridgeUp in one sentence."
)

print("\nGemini response:")
print(response.text)