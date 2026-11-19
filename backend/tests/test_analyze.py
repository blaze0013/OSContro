import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.services.gemma import GemmaService
import os

client = TestClient(app)

@pytest.fixture
def mock_fetch_github_context():
    with patch("app.services.github.fetch_github_context", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "repository": {
                "owner": "test",
                "name": "repo",
                "url": "https://github.com/test/repo",
                "description": "Test repository",
                "primary_language": "Python"
            },
            "tree": ["README.md", "main.py"],
            "files": {"main.py": "print('hello')"},
            "issues": []
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
    os.environ["GENAI_AUTH"] = "api_key"
    os.environ["GEMINI_API_KEY"] = "fake_key"
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/foo/bar"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["meta"]["source"] == "fixture"
    assert "Demo data" in data["warnings"]

def test_analyze_invalid_url():
    os.environ["FIXTURE_MODE"] = "false"
    os.environ["AUTH_REQUIRED"] = "false"
    os.environ["GENAI_AUTH"] = "api_key"
    os.environ["GEMINI_API_KEY"] = "fake_key"
    resp = client.post("/api/analyze", data={"repository_url": "http://not-github.com/a/b"})
    assert resp.status_code == 400

def test_analyze_valid_mocked(mock_fetch_github_context, mock_gemma_generate):
    os.environ["FIXTURE_MODE"] = "false"
    os.environ["AUTH_REQUIRED"] = "false"
    os.environ["GENAI_AUTH"] = "api_key"
    os.environ["GEMINI_API_KEY"] = "fake_key"
    resp = client.post("/api/analyze", data={"repository_url": "https://github.com/foo/bar"})
    assert resp.status_code == 200

def test_no_silent_fallback_when_model_fails(mock_fetch_github_context):
    os.environ["FIXTURE_MODE"] = "false"
    os.environ["AUTH_REQUIRED"] = "false"
    os.environ["GENAI_AUTH"] = "api_key"
    os.environ["GEMINI_API_KEY"] = "fake_key"
    with patch("app.services.gemma.GemmaService.generate_analysis", new_callable=AsyncMock) as mock_gen:
        mock_gen.side_effect = Exception("Model quota exceeded")
        resp = client.post("/api/analyze", data={"repository_url": "https://github.com/foo/bar"})
        assert resp.status_code == 429
        assert resp.json()["error"]["code"] == "MODEL_ERROR"

def test_evidence_validation_logic():
    os.environ["GENAI_AUTH"] = "api_key"
    os.environ["GEMINI_API_KEY"] = "fake_key"
    service = GemmaService()
    
    context = {
        "repository": {
            "owner": "test",
            "name": "repo",
            "url": "https://github.com/test/repo",
            "description": "Test repository",
            "primary_language": "JavaScript"
        },
        "tree": ["README.md", "src/index.js", "package.json"],
        "files": {"src/index.js": "console.log('hi')"},
        "issues": [{"title": "Fix memory leak in parser"}]
    }

    # Valid contributions: citing real context files/issues
    valid_data = {
        "contributions": [
            {
                "title": "Fix readme link",
                "difficulty": "Beginner",
                "description": "Improve docs",
                "file_paths": ["README.md"],
                "paths_verified": True,
                "why_useful": "Better docs",
                "why_beginner_friendly": "Easy text edit",
                "evidence": [{"source": "README.md", "detail": "Missing link on line 10"}]
            },
            {
                "title": "Refactor index",
                "difficulty": "Easy",
                "description": "Refactor index",
                "file_paths": ["src/index.js"],
                "paths_verified": True,
                "why_useful": "Clean code",
                "why_beginner_friendly": "Small component",
                "evidence": [{"source": "src/index.js", "detail": "console.log call present"}]
            },
            {
                "title": "Address issue",
                "difficulty": "Intermediate",
                "description": "Fix leak",
                "file_paths": ["src/index.js"],
                "paths_verified": True,
                "why_useful": "Stability",
                "why_beginner_friendly": "Clear issue report",
                "evidence": [{"source": "issue", "detail": "Reported in 'Fix memory leak in parser'"}]
            }
        ]
    }
    is_valid, msg = service.validate_evidence(valid_data, context)
    assert is_valid is True
    assert msg == ""

    # Invalid contribution: citing fictitious file
    invalid_data = {
        "contributions": [
            valid_data["contributions"][0],
            valid_data["contributions"][1],
            {
                "title": "Invented file fix",
                "difficulty": "Intermediate",
                "description": "Fix non-existent file",
                "file_paths": ["non_existent_folder/fake.py"],
                "paths_verified": False,
                "why_useful": "Nothing",
                "why_beginner_friendly": "Impossible",
                "evidence": [{"source": "non_existent_folder/fake.py", "detail": "Does not exist"}]
            }
        ]
    }
    is_valid_inv, msg_inv = service.validate_evidence(invalid_data, context)
    assert is_valid_inv is False
    assert "does not cite a file or issue" in msg_inv

def test_different_contexts_produce_different_contributions():
    os.environ["GENAI_AUTH"] = "api_key"
    os.environ["GEMINI_API_KEY"] = "fake_key"
    service = GemmaService()

    context_a = {
        "repository": {
            "owner": "pallets",
            "name": "flask",
            "url": "https://github.com/pallets/flask",
            "description": "The Python micro framework for building web applications.",
            "primary_language": "Python"
        },
        "tree": ["src/flask/app.py", "README.rst"],
        "files": {"src/flask/app.py": "class Flask: pass"}
    }
    raw_response_a = {
        "architecture": {
            "summary": "Flask WSGI web framework",
            "technologies": ["Python"],
            "structure": [{"path": "src/flask/app.py", "purpose": "Core application class"}],
            "key_components": [{"name": "Flask", "path": "src/flask/app.py", "role": "WSGI app"}],
            "data_flow": "Request -> WSGI App -> Response"
        },
        "contributions": [
            {
                "title": "Improve Flask docstrings",
                "difficulty": "Beginner",
                "description": "Add docstrings in app.py",
                "file_paths": ["src/flask/app.py"],
                "paths_verified": True,
                "why_useful": "Helps developers",
                "why_beginner_friendly": "Docs only",
                "evidence": [{"source": "src/flask/app.py", "detail": "Class Flask has missing docstrings"}]
            },
            {
                "title": "Add test for app",
                "difficulty": "Easy",
                "description": "Add test",
                "file_paths": ["src/flask/app.py"],
                "paths_verified": True,
                "why_useful": "Coverage",
                "why_beginner_friendly": "Simple test",
                "evidence": [{"source": "src/flask/app.py", "detail": "Tested unit"}]
            },
            {
                "title": "Update README.rst",
                "difficulty": "Beginner",
                "description": "Update readme",
                "file_paths": ["README.rst"],
                "paths_verified": True,
                "why_useful": "Onboarding",
                "why_beginner_friendly": "Text only",
                "evidence": [{"source": "README.rst", "detail": "Add installation command"}]
            }
        ],
        "screenshot_diagnosis": {"available": False},
        "pr_checklist": ["Fork repo", "Submit PR"],
        "warnings": []
    }

    context_b = {
        "repository": {
            "owner": "expressjs",
            "name": "express",
            "url": "https://github.com/expressjs/express",
            "description": "Fast, unopinionated, minimalist web framework for node.",
            "primary_language": "JavaScript"
        },
        "tree": ["lib/express.js", "Readme.md"],
        "files": {"lib/express.js": "function createApplication() {}"}
    }
    raw_response_b = {
        "architecture": {
            "summary": "Express Node.js web framework",
            "technologies": ["JavaScript", "Node.js"],
            "structure": [{"path": "lib/express.js", "purpose": "Application factory"}],
            "key_components": [{"name": "createApplication", "path": "lib/express.js", "role": "Factory"}],
            "data_flow": "Middleware pipeline"
        },
        "contributions": [
            {
                "title": "TypeScript types for createApplication",
                "difficulty": "Intermediate",
                "description": "Add type annotations",
                "file_paths": ["lib/express.js"],
                "paths_verified": True,
                "why_useful": "Type safety",
                "why_beginner_friendly": "Well scoped",
                "evidence": [{"source": "lib/express.js", "detail": "createApplication lacks explicit return type"}]
            },
            {
                "title": "Update Readme.md examples",
                "difficulty": "Beginner",
                "description": "Add ES module example",
                "file_paths": ["Readme.md"],
                "paths_verified": True,
                "why_useful": "Modern syntax",
                "why_beginner_friendly": "Doc update",
                "evidence": [{"source": "Readme.md", "detail": "Examples only show CommonJS require"}]
            },
            {
                "title": "Add lint check for express.js",
                "difficulty": "Easy",
                "description": "Linting",
                "file_paths": ["lib/express.js"],
                "paths_verified": True,
                "why_useful": "Code consistency",
                "why_beginner_friendly": "Mechanical fixes",
                "evidence": [{"source": "lib/express.js", "detail": "Formatting consistency"}]
            }
        ],
        "screenshot_diagnosis": {"available": False},
        "pr_checklist": ["Fork repo", "Submit PR"],
        "warnings": []
    }

    res_a = service._finalize_response(raw_response_a, context_a)
    res_b = service._finalize_response(raw_response_b, context_b)

    assert res_a is not None
    assert res_b is not None
    assert res_a.repository.name == "flask"
    assert res_b.repository.name == "express"
    assert res_a.meta.source == "gemma"
    assert res_b.meta.source == "gemma"

    # Distinct contributions
    titles_a = [c.title for c in res_a.contributions]
    titles_b = [c.title for c in res_b.contributions]
    assert titles_a != titles_b
    assert res_a.contributions[0].file_paths != res_b.contributions[0].file_paths

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
    os.environ.pop('GEMINI_API_KEY', None)
    os.environ.pop('GOOGLE_API_KEY', None)
    svc = gemma_module.GemmaService()
    assert svc.auth_mode == 'adc'
    mock_auth.assert_called_once()
    os.environ['GENAI_AUTH'] = 'api_key'
    os.environ['GEMINI_API_KEY'] = 'fake_key'

@patch('app.services.gemma.GemmaService.verify_evidence')
@patch('app.services.gemma.GemmaService.plan_files')
@patch('app.services.github.GitHubContextBuilder.fetch_specific_files')
@patch('app.services.github.fetch_github_minimal_context')
@patch('app.services.gemma.GemmaService.generate_analysis')
def test_analyze_agentic_mode(mock_generate, mock_minimal, mock_fetch_specific, mock_plan, mock_verify):
    os.environ['AGENTIC_MODE'] = 'true'
    os.environ['FIXTURE_MODE'] = 'false'
    os.environ['AUTH_REQUIRED'] = 'false'
    os.environ['GENAI_AUTH'] = 'api_key'
    os.environ['GEMINI_API_KEY'] = 'fake_key'
    
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

def test_analyze_aq_api_key():
    os.environ['GENAI_AUTH'] = 'api_key'
    os.environ['GEMINI_API_KEY'] = 'AQ.test_key_sample_12345'
    import app.services.gemma as gemma_module
    svc = gemma_module.GemmaService()
    assert svc.auth_mode == 'api_key'
    assert svc.client._api_client.api_key == 'AQ.test_key_sample_12345'
    assert svc.client._api_client.vertexai is False
