from app.schemas import AnalyzeResponse

def get_fixture_response(has_screenshot: bool) -> dict:
    diagnosis = {"available": False}
    if has_screenshot:
        diagnosis = {
            "available": True,
            "visible_problem": "The text color in the header is hard to read against the background.",
            "observed_facts": ["Header background is dark blue", "Text is black"],
            "likely_area": "Header component CSS or styles",
            "likely_causes": ["Missing text-color property", "CSS class overridden"],
            "likely_files": ["src/components/Header.css"],
            "suggested_contribution": "Update the header text color to white or a lighter shade for better contrast.",
            "confidence": "High",
            "uncertainty": "Not sure if the color is controlled via inline styles or external CSS."
        }
        
    data = {
        "repository": {
            "owner": "fixture_owner",
            "name": "fixture_repo",
            "url": "https://github.com/fixture_owner/fixture_repo",
            "description": "A fixture repository for testing",
            "primary_language": "Python"
        },
        "architecture": {
            "summary": "Simple web app",
            "technologies": ["Python", "FastAPI"],
            "structure": [{"path": "app/main.py", "purpose": "Entry point"}],
            "key_components": [{"name": "API", "path": "app/main.py", "role": "Handles requests"}],
            "data_flow": "Client -> API -> Response"
        },
        "contributions": [
            {
                "title": "Fix contrast",
                "difficulty": "Beginner",
                "description": "Fix text contrast in header.",
                "file_paths": ["src/components/Header.css"],
                "paths_verified": True,
                "why_useful": "Improves accessibility.",
                "why_beginner_friendly": "Only requires changing a single CSS property.",
                "evidence": [{"source": "src/components/Header.css", "detail": "Header class missing color property."}]
            },
            {
                "title": "Add tests",
                "difficulty": "Easy",
                "description": "Add unit tests for utils.",
                "file_paths": ["tests/test_utils.py"],
                "paths_verified": True,
                "why_useful": "Improves reliability.",
                "why_beginner_friendly": "Isolated logic to test.",
                "evidence": [{"source": "app/utils.py", "detail": "Functions have no corresponding test file."}]
            },
            {
                "title": "Update README",
                "difficulty": "Beginner",
                "description": "Add installation instructions.",
                "file_paths": ["README.md"],
                "paths_verified": True,
                "why_useful": "Helps new developers.",
                "why_beginner_friendly": "Just documentation updates.",
                "evidence": [{"source": "README.md", "detail": "Missing steps to run the project locally."}]
            }
        ],
        "screenshot_diagnosis": diagnosis,
        "pr_checklist": ["Fork repo", "Make changes", "Submit PR"],
        "warnings": [],
        "meta": {
            "model": "fixture-model",
            "files_analyzed": ["app/main.py", "README.md"],
            "context_truncated": False
        }
    }
    
    # Validate with Pydantic to ensure it strictly conforms
    validated = AnalyzeResponse(**data)
    return validated.model_dump()
