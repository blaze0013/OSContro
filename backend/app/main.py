import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from pathlib import Path

# Always load from the backend/.env regardless of working directory
_ENV_PATH = Path(__file__).parent / ".env"
if not _ENV_PATH.exists():
    _ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)


app = FastAPI(title="OSContro Backend")

cors_origins_str = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

from app.services.auth import get_auth_status, get_current_user
from fastapi import Depends
from typing import Optional, Dict, Any

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

from app.errors import APIError

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    content = {"error": {"code": exc.code, "message": exc.message}}
    if exc.detail:
        content["error"]["detail"] = exc.detail
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL", "message": str(exc)}},
    )

from app.routes import analyze

app.include_router(analyze.router, prefix="/api")

@app.get("/api/health")
async def health():
    model = os.getenv("GEMMA_MODEL", "models/gemma-4-31b-it")
    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip().strip("'\"")
    fixture_env = os.getenv("FIXTURE_MODE", "").lower()
    if fixture_env == "true":
        fixture_mode = True
    elif fixture_env == "false":
        fixture_mode = False
    else:
        fixture_mode = not bool(api_key)

    return {
        "status": "ok",
        "model": model,
        "fixture_mode": fixture_mode,
        "auth_required": get_auth_status()
    }

@app.get("/api/health/model")
async def health_model():
    model = os.getenv("GEMMA_MODEL", "models/gemma-4-31b-it")
    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip().strip("'\"")
    auth_mode = os.getenv("GENAI_AUTH", "api_key").lower()
    
    if not api_key and auth_mode != "adc":
        return {
            "ok": False,
            "model": model,
            "detail": "GEMINI_API_KEY is not configured in backend/.env"
        }
    try:
        from app.services.gemma import GemmaService
        svc = GemmaService()
        await svc.client.aio.models.generate_content(
            model=svc.model,
            contents=["Say 'ok'"]
        )
        return {"ok": True, "model": svc.model, "detail": None}
    except APIError as ae:
        return {"ok": False, "model": model, "detail": ae.detail or ae.message}
    except Exception as e:
        from app.services.gemma import GemmaService
        err = GemmaService._map_error(e)
        return {"ok": False, "model": model, "detail": err.detail or err.message}

@app.get("/api/me")
async def get_me(user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    if user:
        return user
    return {
        "uid": "anonymous",
        "name": "Anonymous User",
        "email": "anonymous@example.com",
        "picture": "",
        "provider": "none"
    }
