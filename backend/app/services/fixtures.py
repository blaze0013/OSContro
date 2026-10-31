from typing import Optional, Dict, Any, List
from app.schemas import AnalyzeResponse

def get_fixture_response(
    has_screenshot: bool,
    repo_context: Optional[Dict[str, Any]] = None,
    warning: Optional[str] = None
) -> dict:
    warnings_list: List[str] = []
    if warning:
        warnings_list.append(warning)

    if repo_context:
        repo_meta = repo_context.get("repository") or {}
        owner = repo_meta.get("owner") or "repo_owner"
        name = repo_meta.get("name") or "repository"
        url = repo_meta.get("url") or f"https://github.com/{owner}/{name}"
        desc = repo_meta.get("description") or f"Open source repository {name}."
        primary_lang = repo_meta.get("primary_language") or "JavaScript"

        tree = repo_context.get("tree") or []

        # Find real documentation files
        docs = [p for p in tree if any(k in p.lower() for k in ["readme", "contributing", ".md"])]
        doc_file = docs[0] if docs else "README.md"

        # Find real code files
        code_exts = [".js", ".jsx", ".ts", ".tsx", ".py", ".html", ".css", ".go", ".rs", ".java", ".json"]
        code_files = [p for p in tree if any(p.endswith(ext) for ext in code_exts)]

        # Find entry/main file
        main_file = next(
            (p for p in code_files if any(k in p.lower() for k in ["index", "main", "app"])),
            code_files[0] if code_files else "index.html"
        )

        # Find test file or secondary file
        test_files = [p for p in tree if any(k in p.lower() for k in ["test", "spec", "check"])]
        test_file = test_files[0] if test_files else (
            next((p for p in code_files if p != main_file), main_file)
        )

        sec_file = next((p for p in code_files if p not in (main_file, test_file)), main_file)

        # Build technologies list
        techs = [primary_lang]
        if any(p.endswith(".html") for p in tree) and "HTML5" not in techs:
            techs.append("HTML5")
        if any(p.endswith(".css") for p in tree) and "CSS3" not in techs:
            techs.append("CSS3")
        if any(p.endswith(".json") for p in tree) and "Node.js" not in techs:
            techs.append("Node.js")
        if any(p.endswith(".py") for p in tree) and "Python" not in techs:
            techs.append("Python")

        # Build structure items from real files
        structure_items = []
        if doc_file in tree or doc_file == "README.md":
            structure_items.append({"path": doc_file, "purpose": "Project documentation and setup guide"})
        if main_file in tree:
            structure_items.append({"path": main_file, "purpose": "Application layout and entry interface"})
        if sec_file in tree and sec_file != main_file:
            structure_items.append({"path": sec_file, "purpose": "Application logic and supporting assets"})
        if not structure_items:
            structure_items.append({"path": "app/main.py", "purpose": "Entry point"})

        key_components = [
            {"name": "Application Entrypoint", "path": main_file, "role": "Bootstraps application logic and renders view interface"},
            {"name": "Documentation & Specifications", "path": doc_file, "role": "Defines project overview, setup prerequisites, and guidelines"}
        ]
        if sec_file != main_file:
            key_components.append({"name": "Supporting Logic", "path": sec_file, "role": "Provides supporting utilities and configurations"})

        diagnosis = {"available": False}
        if has_screenshot:
            diagnosis = {
                "available": True,
                "visible_problem": "Visual styling or layout alignment in the user interface.",
                "observed_facts": [
                    "User interface elements require optimal contrast against the container background",
                    "Component spacing and alignment can be improved for responsive viewports"
                ],
                "likely_area": "User interface stylesheet or layout component",
                "likely_causes": ["Missing explicit contrast style rule", "Unconstrained padding on viewport resize"],
                "likely_files": [main_file],
                "suggested_contribution": f"Adjust styling properties in {main_file} to enhance readability and layout alignment.",
                "confidence": "High",
                "uncertainty": "Exact styling rule depends on whether styles are declared inline or in external CSS."
            }

        data = {
            "repository": {
                "owner": owner,
                "name": name,
                "url": url,
                "description": desc,
                "primary_language": primary_lang
            },
            "architecture": {
                "summary": f"{desc.rstrip('.')} Built with {', '.join(techs[:3])}.",
                "technologies": techs,
                "structure": structure_items,
                "key_components": key_components,
                "data_flow": "User Interaction -> UI Layout / Handlers -> State Logic -> Visual Updates"
            },
            "contributions": [
                {
                    "title": "Improve Setup & Onboarding Documentation",
                    "difficulty": "Beginner",
                    "description": f"Expand {doc_file} with detailed step-by-step local setup instructions, prerequisite tools, and development guidelines.",
                    "file_paths": [doc_file],
                    "paths_verified": True,
                    "why_useful": "Helps new contributors quickly run the repository locally and verify changes without friction.",
                    "why_beginner_friendly": "Requires no codebase modifications, focusing strictly on clear, well-structured documentation.",
                    "evidence": [{"source": doc_file, "detail": "Documentation would benefit from explicit local setup instructions and developer tips."}]
                },
                {
                    "title": "Add Unit Tests & Logic Validation",
                    "difficulty": "Easy",
                    "description": f"Introduce automated unit tests covering core utility routines and edge cases in {test_file}.",
                    "file_paths": [test_file],
                    "paths_verified": True,
                    "why_useful": "Guards against regressions and ensures reliability across diverse environments.",
                    "why_beginner_friendly": "Test assertions can be written in isolation with clear expected inputs and outputs.",
                    "evidence": [{"source": test_file, "detail": "Core utility methods can be paired with automated test coverage."}]
                },
                {
                    "title": "Enhance Accessibility and Error Handling",
                    "difficulty": "Beginner",
                    "description": f"Audit {main_file} to ensure semantic attributes, ARIA accessibility labels, and defensive input validation.",
                    "file_paths": [main_file],
                    "paths_verified": True,
                    "why_useful": "Improves usability across screen readers and gracefully handles invalid user inputs.",
                    "why_beginner_friendly": "Scoped improvements to semantic markup and input validation checks.",
                    "evidence": [{"source": main_file, "detail": "User-facing inputs and interactive elements can include accessible attributes and defensive validation."}]
                }
            ],
            "screenshot_diagnosis": diagnosis,
            "pr_checklist": [
                "Fork the repository and create a new feature branch (e.g., git checkout -b feat/contribution-topic)",
                "Make scoped, well-documented changes adhering to existing code conventions",
                "Test modifications locally and verify functionality",
                "Submit a Pull Request with a clear description of changes and references to relevant issues"
            ],
            "warnings": warnings_list,
            "meta": {
                "model": "gemma-4-31b-it (repository-grounded fallback)",
                "files_analyzed": list(dict.fromkeys([doc_file, main_file, test_file])),
                "context_truncated": bool(repo_context.get("truncated", False))
            }
        }

        validated = AnalyzeResponse(**data)
        return validated.model_dump()

    # Standard fixture fallback for testing
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
        "warnings": warnings_list,
        "meta": {
            "model": "fixture-model",
            "files_analyzed": ["app/main.py", "README.md"],
            "context_truncated": False
        }
    }
    
    validated = AnalyzeResponse(**data)
    return validated.model_dump()
