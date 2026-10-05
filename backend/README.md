# OSContro Backend

This is the FastAPI backend for OSContro. It analyzes GitHub repositories and generates beginner-friendly contribution opportunities using Gemma 4.

## Setup
1. Open a terminal and run: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill it in.

## Environment Variables
- `GEMINI_API_KEY`: Your Google Gemini API key (must start with `AIza`).
- `GEMMA_MODEL`: `models/gemma-4-26b-a4b-it` or `models/gemma-4-31b-it`.
- `GITHUB_TOKEN`: (Optional) Prevents GitHub rate limiting.
- `AUTH_REQUIRED`: Set to `true` to require Firebase ID token verification.
- `FIREBASE_PROJECT_ID`: Must match frontend's `VITE_FIREBASE_PROJECT_ID`. Required if `AUTH_REQUIRED=true`.
- `FIXTURE_MODE`: Set to `true` to return canned responses without hitting Gemini/GitHub.

## Running the Server (Local & LAN)
Start the server with:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The `--host 0.0.0.0` argument allows the frontend agent (running on another laptop on the same network) to connect to this backend. Find your local IP address (e.g., `192.168.x.x`) and share it with the frontend agent.

## Testing
Run the test suite with:
```bash
pytest tests/
```

- GENAI_AUTH: Set to dc to use Google Application Default Credentials (Service Accounts), or pi_key for standard API keys.
- GOOGLE_APPLICATION_CREDENTIALS: Path to your service account JSON file if using GENAI_AUTH=adc.

- AGENTIC_MODE: Set to 	rue to enable two-round agentic reasoning. Defaults to alse.
