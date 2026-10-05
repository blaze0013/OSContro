# OSContro Backend

## Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill it in.

## Run
`python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
