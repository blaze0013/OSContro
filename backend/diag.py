import os, asyncio, json
from pathlib import Path
from dotenv import load_dotenv

# Load .env from same dir as this script (backend/.env)
_env = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env, override=True)

# Patch sys.path so app imports work
import sys
sys.path.insert(0, ".")

from app.services.gemma import GemmaService

fake_context = {
    "repository": {"owner": "psf", "name": "requests", "url": "https://github.com/psf/requests", "description": "HTTP for Humans", "primary_language": "Python"},
    "tree": ["README.md", "requests/__init__.py", "requests/api.py", "docs/index.rst", "CONTRIBUTING.md"],
    "readme": "# Requests: HTTP for Humans\n\nRequests is a simple, elegant HTTP library.",
    "contributing": "Please read our contributing guide.",
    "manifests": {},
    "files": {"requests/api.py": "def get(url, **kwargs):\n    return request('GET', url, **kwargs)"},
    "issues": [{"title": "Add type hints to api.py", "body": "No type hints present", "labels": ["good first issue"]}],
    "truncated": False
}

async def main():
    svc = GemmaService()
    print("Model:", svc.model)
    try:
        result = await svc.generate_analysis(fake_context)
        print("SUCCESS! Contributions:", [c.title for c in result.contributions])
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")

asyncio.run(main())
