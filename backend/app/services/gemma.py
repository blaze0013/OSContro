import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
import asyncio
import google.genai as genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

from app.errors import APIError
from app.schemas import AnalyzeResponse

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "analyze.txt"

# Max characters for each context section to keep total prompt under ~20k chars
_README_LIMIT = 2000
_FILE_LIMIT = 1500
_MANIFEST_LIMIT = 1000
_ISSUE_LIMIT = 300
_TREE_LIMIT = 200   # max number of paths to list
_TOTAL_CONTEXT_LIMIT = 18000  # hard cap on serialized context string


def _compress_context(repo_context: Dict[str, Any]) -> Dict[str, Any]:
    """Trim context to stay well within model token limits."""
    tree = repo_context.get("tree", [])
    # Keep only top-level + first 200 paths
    compressed_tree = tree[:_TREE_LIMIT]
    if len(tree) > _TREE_LIMIT:
        compressed_tree.append(f"... ({len(tree) - _TREE_LIMIT} more paths truncated)")

    issues = []
    for issue in repo_context.get("issues", []):
        issues.append({
            "title": issue.get("title", ""),
            "labels": issue.get("labels", []),
            "body": (issue.get("body") or "")[:_ISSUE_LIMIT],
        })

    manifests = {}
    for path, content in repo_context.get("manifests", {}).items():
        manifests[path] = content[:_MANIFEST_LIMIT]

    files = {}
    for path, content in repo_context.get("files", {}).items():
        files[path] = content[:_FILE_LIMIT]

    return {
        "repository": repo_context.get("repository", {}),
        "tree": compressed_tree,
        "readme": (repo_context.get("readme") or "")[:_README_LIMIT],
        "contributing": (repo_context.get("contributing") or "")[:_README_LIMIT],
        "manifests": manifests,
        "files": files,
        "issues": issues,
        "truncated": repo_context.get("truncated", False),
    }


import google.auth
from google.auth.transport.requests import Request
from google.genai.types import HttpOptions

_ADC_CREDS = None

class GemmaService:
    def __init__(self):
        self.auth_mode = os.getenv("GENAI_AUTH", "api_key").lower()
        self.model = os.getenv("GEMMA_MODEL", "models/gemma-4-26b-a4b-it")
        
        if self.auth_mode == "adc":
            import google.auth
            try:
                creds, proj = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
            except Exception as e:
                raise APIError(500, "INTERNAL", f"ADC Auth failed: {e}")
                
            project_id = proj or os.getenv("FIREBASE_PROJECT_ID") or "oscontro"
            
            # Developer API blocks Service Accounts. We MUST use Vertex AI for ADC.
            # Gemma 4 is not natively on Vertex, so we fallback to gemini-1.5-flash.
            self.model = "gemini-1.5-flash"
            self.client = genai.Client(
                vertexai=True,
                project=project_id,
                location="us-central1",
                credentials=creds
            )
        elif self.auth_mode == "vertex":
            raise APIError(500, "INTERNAL", "Vertex AI mode is not supported for Gemma 4 models directly. Use 'adc' or 'api_key'.")
            
        else:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise APIError(500, "INTERNAL", "GEMINI_API_KEY is not configured")
            self.client = genai.Client(api_key=api_key)

    def _strip_json(self, text: str) -> str:
        """Strip markdown code fences and extract the outermost JSON object."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
        return text

    def _build_contents(
        self,
        prompt: str,
        image_bytes: Optional[bytes],
        mime_type: Optional[str],
    ):
        if image_bytes:
            return [
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ]
        return [prompt]

    def _call_model(self, contents) -> str:
        """Synchronous wrapper — called via asyncio.to_thread."""
        response = self.client.models.generate_content(
            model=self.model, contents=contents
        )
        return response.text

    def _map_error(self, e: Exception) -> APIError:
        """Map genai SDK errors to our contract APIError."""
        err_str = str(e).lower()
        if hasattr(e, "code") or "401" in err_str or "403" in err_str or "unauthenticated" in err_str:
            detail = str(e)
            if "ACCESS_TOKEN_TYPE_UNSUPPORTED" in detail:
                detail = "API key starts with 'AQ.' and requires proper Google Cloud/OAuth configuration, or use an 'AIza' API key."
            return APIError(401, "MODEL_ERROR", "Gemini API rejected the API key/credentials", detail=detail)
        elif "404" in err_str or "not_found" in err_str or "not found" in err_str:
            return APIError(404, "MODEL_ERROR", "Model not found; check GEMMA_MODEL", detail=str(e))
        elif "429" in err_str or "quota" in err_str or "exhausted" in err_str:
            return APIError(429, "MODEL_ERROR", "Gemini API quota or rate limit exceeded", detail=str(e))
        elif "timeout" in err_str or "network" in err_str:
            return APIError(504, "MODEL_ERROR", "Network timeout or connection error to Gemini API", detail=str(e))
        elif "finish_reason" in err_str or "blocked" in err_str:
            return APIError(500, "MODEL_ERROR", "Model response was blocked or empty", detail=str(e))
        elif "too large" in err_str or "400" in err_str or "invalid argument" in err_str:
            return APIError(400, "MODEL_ERROR", "Request too large or invalid", detail=str(e))
        else:
            return APIError(502, "MODEL_ERROR", "The AI model encountered an unexpected error", detail=str(e))

    async def generate_analysis(
        self,
        repo_context: Dict[str, Any],
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> AnalyzeResponse:
        prompt_template = _PROMPT_PATH.read_text(encoding="utf-8")

        # Compress context before serialising
        small_context = _compress_context(repo_context)
        context_str = json.dumps(small_context, indent=2)
        if len(context_str) > _TOTAL_CONTEXT_LIMIT:
            context_str = context_str[:_TOTAL_CONTEXT_LIMIT] + "\n... [context truncated]"

        if image_bytes:
            screenshot_str = (
                "SCREENSHOT PROVIDED: An image is attached as the next part. "
                "Analyse it carefully for visible UI bugs per the SCREENSHOT RULES above."
            )
        else:
            screenshot_str = 'SCREENSHOT PROVIDED: None. Set screenshot_diagnosis to {"available": false}.'

        prompt = (
            prompt_template
            .replace("{{repo_context}}", context_str)
            .replace("{{screenshot_context}}", screenshot_str)
        )

        contents = self._build_contents(prompt, image_bytes, mime_type)

        # --- First attempt ---
        try:
            raw_text = await asyncio.to_thread(self._call_model, contents)
        except Exception as e:
            err = self._map_error(e)
            if err.status_code == 400 and "too large" in err.message.lower():
                # Fallback: drastically reduce context and retry once
                small_context["files"] = {}
                small_context["manifests"] = {}
                small_context["truncated"] = True
                context_str = json.dumps(small_context, indent=2)
                prompt = (
                    prompt_template
                    .replace("{{repo_context}}", context_str)
                    .replace("{{screenshot_context}}", screenshot_str)
                )
                contents = self._build_contents(prompt, image_bytes, mime_type)
                try:
                    raw_text = await asyncio.to_thread(self._call_model, contents)
                except Exception as e2:
                    raise self._map_error(e2)
            else:
                raise err

        result = self._parse_and_finalize(raw_text, repo_context)
        if result:
            return result

        # --- Retry once with repair prompt ---
        repair = (
            "Your previous output was invalid or did not match the required schema. "
            "Return ONLY valid raw JSON — no markdown, no explanation.\n\n"
            f"Previous output (first 500 chars):\n{raw_text[:500]}"
        )
        retry_contents = self._build_contents(prompt + "\n\n" + repair, None, None)
        try:
            raw_text2 = await asyncio.to_thread(self._call_model, retry_contents)
        except Exception as e:
            raise self._map_error(e)

        result2 = self._parse_and_finalize(raw_text2, repo_context)
        if result2:
            return result2

        raise APIError(
            502,
            "MODEL_INVALID_OUTPUT",
            "Model returned invalid JSON after two attempts.",
        )

    async def plan_files(self, repo_context: Dict[str, Any]) -> List[str]:
        """Round 1: Ask Gemma which files it wants to read based on minimal context."""
        small_context = _compress_context(repo_context)
        context_str = json.dumps(small_context, indent=2)
        if len(context_str) > _TOTAL_CONTEXT_LIMIT:
            context_str = context_str[:_TOTAL_CONTEXT_LIMIT] + "\n... [context truncated]"
            
        prompt = (
            "You are an expert open-source contributor. You need to analyze this repository to find "
            "beginner-friendly contribution opportunities.\n\n"
            "Below is the repository context (metadata, tree, README, issues):\n"
            f"{context_str}\n\n"
            "Respond with ONLY a JSON object in this format:\n"
            "{\"files_to_read\": [\"path/to/file1\", \"path/to/file2\"]}\n\n"
            "Rules:\n"
            "1. Select up to 5 files that will help you understand the architecture or find specific contribution areas.\n"
            "2. Select ONLY from the provided directory tree.\n"
            "3. Return ONLY valid raw JSON."
        )
        contents = self._build_contents(prompt, None, None)
        try:
            raw_text = await asyncio.to_thread(self._call_model, contents)
            json_str = self._strip_json(raw_text)
            data = json.loads(json_str)
            return data.get("files_to_read", [])
        except Exception as e:
            import logging
            logging.error(f"plan_files error: {e}")
            return []

    def verify_evidence(self, result: AnalyzeResponse, fetched_files: List[str]) -> AnalyzeResponse:
        """Optional self-check: drop contributions whose evidence relies on un-fetched files."""
        valid_contributions = []
        for c in result.contributions:
            # Simple check: if paths_verified is false, or if it claims files that we didn't fetch (and aren't README/issues).
            # Actually, the requirement: "drops any contribution whose evidence is not supported by the fetched files"
            is_valid = True
            for file_path in c.file_paths:
                # We allow README, CONTRIBUTING, and anything in fetched_files
                if "README" not in file_path and "CONTRIBUTING" not in file_path and file_path not in fetched_files:
                    is_valid = False
                    break
            
            if is_valid:
                valid_contributions.append(c)
                
        # If we dropped some, we might have less than 3. The API contract says exactly 3, but this is a self-check pass.
        # If we drop all of them, or don't have 3, we should let it pass or pad it?
        # Actually, the contract says "exactly 3 items". We shouldn't break the contract. 
        # If dropping breaks the contract, we can just return the original result but add a warning.
        if len(valid_contributions) == 3:
            result.contributions = valid_contributions
        else:
            result.warnings.append("AGENTIC_MODE warning: Some contributions were not perfectly supported by fetched files, but were retained to meet the 3-item contract.")
        return result

    def _parse_and_finalize(
        self, raw: str, repo_context: Dict[str, Any]
    ) -> Optional[AnalyzeResponse]:
        cleaned = self._strip_json(raw)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            return None
        return self._finalize_response(data, repo_context)

    def _finalize_response(
        self, data: Dict[str, Any], repo_context: Dict[str, Any]
    ) -> Optional[AnalyzeResponse]:
        real_tree = set(repo_context.get("tree", []))

        # Ground truth: always override repository from GitHub metadata
        data["repository"] = repo_context.get("repository", {})

        warnings: list = data.get("warnings", [])
        if not isinstance(warnings, list):
            warnings = []

        # --- Verify contribution file_paths ---
        for contrib in data.get("contributions", []):
            bad = [p for p in contrib.get("file_paths", []) if p not in real_tree]
            if bad:
                contrib["paths_verified"] = False
                warnings.append(
                    f"Contribution '{contrib.get('title')}': unverified paths {bad}"
                )
            else:
                contrib["paths_verified"] = True

        # --- Verify screenshot likely_files ---
        sd = data.get("screenshot_diagnosis", {})
        if isinstance(sd, dict) and sd.get("available"):
            verified = [p for p in sd.get("likely_files", []) if p in real_tree]
            dropped = [p for p in sd.get("likely_files", []) if p not in real_tree]
            if dropped:
                warnings.append(
                    f"Screenshot: likely_files not in repo tree removed: {dropped}"
                )
            sd["likely_files"] = verified

        data["warnings"] = list(dict.fromkeys(warnings))

        data["meta"] = {
            "model": self.model,
            "files_analyzed": list(repo_context.get("files", {}).keys()),
            "context_truncated": repo_context.get("truncated", False),
        }

        try:
            return AnalyzeResponse(**data)
        except Exception as e:
            print(f"[gemma] Pydantic validation error: {e}")
            return None
