import os
from pathlib import Path
from dotenv import load_dotenv
import google.genai as genai

_env = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env, override=True)

key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip().strip("'\"")
if not key:
    print("GEMINI_API_KEY not found in backend/.env")
else:
    client = genai.Client(api_key=key, vertexai=False)
    print(f"Listing models available for API key ({key[:6]}...):")
    for model in client.models.list():
        print(f"Model ID: {model.name}, Display Name: {model.display_name}")
