import os
from typing import Optional, Dict, Any
from fastapi import Request, Depends
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.errors import APIError

request_adapter = google_requests.Request()

def get_auth_status() -> bool:
    return os.getenv("AUTH_REQUIRED", "false").lower() == "true"

def get_current_user(request: Request) -> Optional[Dict[str, Any]]:
    auth_required = get_auth_status()
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        if auth_required:
            raise APIError(401, "UNAUTHENTICATED", "Missing Authorization header")
        return None
        
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        if auth_required:
            raise APIError(401, "UNAUTHENTICATED", "Invalid Authorization header format. Expected 'Bearer <token>'")
        return None
        
    token = parts[1]
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id and auth_required:
        raise APIError(500, "INTERNAL", "FIREBASE_PROJECT_ID is not configured")
        
    try:
        claims = id_token.verify_firebase_token(
            token, 
            request_adapter, 
            audience=project_id
        )
        return {
            "uid": claims.get("user_id") or claims.get("sub"),
            "name": claims.get("name"),
            "email": claims.get("email"),
            "picture": claims.get("picture"),
            "provider": claims.get("firebase", {}).get("sign_in_provider", "unknown")
        }
    except Exception as e:
        if auth_required:
            raise APIError(401, "UNAUTHENTICATED", "Invalid or expired token")
        return None
