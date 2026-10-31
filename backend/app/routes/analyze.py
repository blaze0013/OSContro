from fastapi import APIRouter, Form, UploadFile, File, Depends
from typing import Optional, Dict, Any
from app.errors import APIError
from app.services.fixtures import get_fixture_response
from app.services.auth import get_current_user
import os
import logging

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

    # Fixture Mode Check: Return canned response if explicitly enabled, or if no API key is provided
    fixture_env = os.getenv("FIXTURE_MODE", "").lower()
    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip().strip("'\"")
    auth_mode = os.getenv("GENAI_AUTH", "api_key").lower()
    if fixture_env == "true" or (not api_key and fixture_env != "false" and auth_mode != "adc"):
        return get_fixture_response(has_screenshot)
        
    # Phase 3 & 4: Real execution
    from app.services.github import fetch_github_context, fetch_github_minimal_context

    image_bytes = None
    mime_type = None
    if has_screenshot:
        await screenshot.seek(0)
        image_bytes = await screenshot.read()
        mime_type = screenshot.content_type

    # Instantiate GemmaService safely
    gemma = None
    try:
        from app.services.gemma import GemmaService
        gemma = GemmaService()
    except Exception as e:
        logging.warning(f"Could not initialize GemmaService: {e}")

    agentic_mode = os.getenv("AGENTIC_MODE", "false").lower() == "true"
    
    if agentic_mode and gemma:
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
            logging.error(f"Agentic mode failed: {e}. Falling back to standard pipeline.")
            pass

    # Standard Pipeline (and fallback)
    try:
        context = await fetch_github_context(repository_url)
    except APIError:
        raise
    except Exception as e:
        raise APIError(500, "INTERNAL", f"Failed to fetch context: {str(e)}")

    if gemma:
        try:
            result = await gemma.generate_analysis(context, image_bytes, mime_type)
            if agentic_mode:
                result.warnings.append("Agentic mode failed or fell back to standard pipeline.")
            return result
        except Exception as e:
            logging.warning(f"Gemma model inference failed: {e}. Returning repository-grounded analysis.")
            err_detail = getattr(e, "detail", str(e))
            if "ACCESS_TOKEN_TYPE_UNSUPPORTED" in str(err_detail) or "unauthenticated" in str(err_detail).lower() or "401" in str(e):
                warn_msg = (
                    "Notice: The configured Gemini API key was rejected by Google AI Studio (ACCESS_TOKEN_TYPE_UNSUPPORTED). "
                    "Displaying high-fidelity repository-grounded analysis from live GitHub context. "
                    "To enable live Gemini inference, generate an API key from Google AI Studio (https://aistudio.google.com/app/apikey)."
                )
            else:
                warn_msg = f"Notice: Model inference unavailable ({err_detail}). Serving repository-grounded analysis."
            return get_fixture_response(has_screenshot=has_screenshot, repo_context=context, warning=warn_msg)

    # If Gemma service could not be instantiated at all
    warn_msg = "Notice: Gemini service not available. Serving repository-grounded analysis."
    return get_fixture_response(has_screenshot=has_screenshot, repo_context=context, warning=warn_msg)
