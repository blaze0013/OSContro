import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
import os

client = TestClient(app)

@pytest.fixture
def mock_fetch_github_context():
    with patch("app.services.github.fetch_github_context", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "repository": {"owner": "test", "name": "repo"},
            "tree": ["README.md", "main.py"]
        }
        yield mock

@pytest.fixture
def mock_gemma_generate():
    with patch("app.services.gemma.GemmaService.generate_analysis", new_callable=AsyncMock) as mock:
        class MockResponse:
            def dict(self):
                return {"mock": "response"}
        mock.return_value = MockResponse()
        yield mock

def test_analyze_fixture_mode():
    os.environ["FIXTURE_MODE"] = "true"
    os.environ["AUTH_REQUIRED"] = "false"
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/foo/bar"})
    assert resp.status_code == 200

def test_analyze_invalid_url():
    os.environ["FIXTURE_MODE"] = "false"
    os.environ["AUTH_REQUIRED"] = "false"
    resp = client.post("/api/analyze", data={"repository_url": "http://not-github.com/a/b"})
    assert resp.status_code == 400

def test_analyze_valid_mocked(mock_fetch_github_context, mock_gemma_generate):
    os.environ["FIXTURE_MODE"] = "false"
    os.environ["AUTH_REQUIRED"] = "false"
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/foo/bar"})
    assert resp.status_code == 200

@patch('google.auth.default')
def test_analyze_adc_auth(mock_auth):
    import app.services.gemma as gemma_module
    gemma_module._ADC_CREDS = None
    mock_creds = AsyncMock()
    mock_creds.valid = True
    mock_creds.token = 'fake_token'
    mock_creds.quota_project_id = 'test_project'
    mock_auth.return_value = (mock_creds, 'test_project')
    os.environ['GENAI_AUTH'] = 'adc'
    svc = gemma_module.GemmaService()
    assert svc.auth_mode == 'adc'
    mock_auth.assert_called_once()


@patch('app.services.gemma.GemmaService.verify_evidence')
@patch('app.services.gemma.GemmaService.plan_files')
@patch('app.services.github.GitHubContextBuilder.fetch_specific_files')
@patch('app.services.github.fetch_github_minimal_context')
@patch('app.services.gemma.GemmaService.generate_analysis')
def test_analyze_agentic_mode(mock_generate, mock_minimal, mock_fetch_specific, mock_plan, mock_verify):
    import os
    os.environ['AGENTIC_MODE'] = 'true'
    os.environ['FIXTURE_MODE'] = 'false'
    os.environ['AUTH_REQUIRED'] = 'false'
    
    class MockBuilder:
        repo_meta = {}
        all_paths = ['path1']
        readme_content = ''
        issues = []
        context_truncated = False
        async def fetch_specific_files(self, p):
            return {'path1': 'content'}
    mock_minimal.return_value = MockBuilder()
    mock_plan.return_value = ['path1']
    mock_fetch_specific.return_value = {'path1': 'content'}
    
    class MockResponse:
        warnings = []
        contributions = []
        def dict(self):
            return {'mock': 'response'}
    
    mock_generate.return_value = MockResponse()
    mock_verify.return_value = MockResponse()
    
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    resp = client.post('/api/analyze', data={'repository_url': 'https://github.com/foo/bar'})
    assert resp.status_code == 200
    mock_minimal.assert_called_once()
    mock_plan.assert_called_once()
    os.environ['AGENTIC_MODE'] = 'false'
