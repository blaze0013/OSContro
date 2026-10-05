import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="OSContro Backend")

cors_origins_str = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL", "message": str(exc)}},
    )

@app.get("/api/health")
async def health():
    model = os.getenv("GEMMA_MODEL", "")
    fixture_mode = os.getenv("FIXTURE_MODE", "false").lower() == "true"
    return {
        "status": "ok",
        "model": model,
        "fixture_mode": fixture_mode
    }
