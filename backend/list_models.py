import os
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
if not key:
    print("API Key not found in .env")
else:
    client = genai.Client(api_key=key)
    for model in client.models.list():
        print(f"Model ID: {model.name}, Display Name: {model.display_name}")
