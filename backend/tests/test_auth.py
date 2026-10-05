import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
import os

client = TestClient(app)

@pytest.fixture
def mock_verify_firebase_token():
    with patch("google.oauth2.id_token.verify_firebase_token") as mock_verify:
        yield mock_verify

def test_health_auth_required_field():
    os.environ["AUTH_REQUIRED"] = "false"
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["auth_required"] is False
    
    os.environ["AUTH_REQUIRED"] = "true"
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["auth_required"] is True

def test_auth_required_missing_token():
    os.environ["AUTH_REQUIRED"] = "true"
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/a/b"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHENTICATED"

def test_auth_required_malformed_header():
    os.environ["AUTH_REQUIRED"] = "true"
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/a/b"}, headers={"Authorization": "Token 123"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHENTICATED"

def test_auth_required_invalid_token(mock_verify_firebase_token):
    os.environ["AUTH_REQUIRED"] = "true"
    os.environ["FIREBASE_PROJECT_ID"] = "test-project"
    mock_verify_firebase_token.side_effect = Exception("Invalid token")
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/a/b"}, headers={"Authorization": "Bearer badtoken"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHENTICATED"

def test_auth_required_valid_token(mock_verify_firebase_token):
    os.environ["AUTH_REQUIRED"] = "true"
    os.environ["FIREBASE_PROJECT_ID"] = "test-project"
    os.environ["FIXTURE_MODE"] = "true"
    mock_verify_firebase_token.return_value = {
        "user_id": "test_uid",
        "name": "Test User",
        "email": "test@example.com",
        "picture": "http://example.com/pic.jpg",
        "firebase": {"sign_in_provider": "google.com"}
    }
    
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/a/b"}, headers={"Authorization": "Bearer validtoken"})
    assert resp.status_code == 200
    mock_verify_firebase_token.assert_called_once()

def test_auth_not_required_passthrough():
    os.environ["AUTH_REQUIRED"] = "false"
    os.environ["FIXTURE_MODE"] = "true"
    # Even without token, it should pass
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/a/b"})
    assert resp.status_code == 200

def test_me_endpoint_anonymous():
    os.environ["AUTH_REQUIRED"] = "false"
    resp = client.get("/api/me")
    assert resp.status_code == 200
    assert resp.json()["uid"] == "anonymous"

def test_me_endpoint_authenticated(mock_verify_firebase_token):
    os.environ["AUTH_REQUIRED"] = "true"
    os.environ["FIREBASE_PROJECT_ID"] = "test-project"
    mock_verify_firebase_token.return_value = {
        "user_id": "test_uid",
        "name": "Test User",
        "email": "test@example.com",
        "picture": "http://example.com/pic.jpg",
        "firebase": {"sign_in_provider": "google.com"}
    }
    resp = client.get("/api/me", headers={"Authorization": "Bearer validtoken"})
    assert resp.status_code == 200
    assert resp.json()["uid"] == "test_uid"
    assert resp.json()["provider"] == "google.com"
