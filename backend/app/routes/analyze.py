from fastapi import APIRouter, Form, UploadFile, File, Depends
from typing import Optional, Dict, Any
from app.errors import APIError
from app.services.fixtures import get_fixture_response
from app.services.auth import get_current_user
import os

router = APIRouter()

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", 5))

@router.post("/analyze")
async def analyze(
    repository_url: str = Form(...),
    screenshot: Optional[UploadFile] = File(None),
    user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    # Validate URL loosely here, more strictly later
    if not repository_url.startswith("https://github.com/"):
        raise APIError(400, "INVALID_URL", "Only GitHub URLs are supported.")

    has_screenshot = False
    if screenshot:
        if screenshot.content_type not in ["image/png", "image/jpeg", "image/webp"]:
            raise APIError(415, "IMAGE_INVALID", "Unsupported image format. Allowed: png, jpeg, webp.")
        
        # Check size
        file_bytes = await screenshot.read()
        if len(file_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
            raise APIError(413, "IMAGE_TOO_LARGE", f"Image size exceeds {MAX_UPLOAD_MB}MB limit.")
        
        has_screenshot = True

    # Fixture Mode Check
    if os.getenv("FIXTURE_MODE", "false").lower() == "true":
        return get_fixture_response(has_screenshot)
        
    # Phase 3 & 4: Real execution
    from app.services.github import fetch_github_context, fetch_github_minimal_context
    from app.services.gemma import GemmaService

    gemma = GemmaService()
    image_bytes = None
    mime_type = None
    if has_screenshot:
        await screenshot.seek(0)
        image_bytes = await screenshot.read()
        mime_type = screenshot.content_type

    agentic_mode = os.getenv("AGENTIC_MODE", "false").lower() == "true"
    
    if agentic_mode:
        try:
            # Round 1: Minimal context
            builder = await fetch_github_minimal_context(repository_url)
            minimal_context = {
                "repository": builder.repo_meta,
                "tree": builder.all_paths,
                "readme": builder.readme_content,
                "contributing": "",
                "manifests": {},
                "files": {},
                "issues": builder.issues,
                "truncated": builder.context_truncated
            }
            # Ask Gemma what to fetch
            files_to_read = await gemma.plan_files(minimal_context)
            fetched_files = await builder.fetch_specific_files(files_to_read)
            
            # Add fetched files to context for Round 2
            minimal_context["files"] = fetched_files
            
            # Round 2: Generate analysis
            result = await gemma.generate_analysis(minimal_context, image_bytes, mime_type)
            result = gemma.verify_evidence(result, list(fetched_files.keys()))
            return result
            
        except Exception as e:
            # Fallback to standard pipeline
            import logging
            logging.error(f"Agentic mode failed: {e}. Falling back to standard pipeline.")
            # Let standard pipeline run below
            pass

    # Standard Pipeline (and fallback)
    try:
        context = await fetch_github_context(repository_url)
    except APIError:
        raise
    except Exception as e:
        raise APIError(500, "INTERNAL", f"Failed to fetch context: {str(e)}")

    result = await gemma.generate_analysis(context, image_bytes, mime_type)
    if agentic_mode:
        result.warnings.append("Agentic mode failed or fell back to standard pipeline.")
    return result
