import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
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
        api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip().strip("'\"")
        raw_auth_mode = os.getenv("GENAI_AUTH", "api_key").lower()

        sa_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        has_sa_file = bool(sa_creds and Path(sa_creds).exists())

        if api_key and (raw_auth_mode == "api_key" or not has_sa_file):
            self.auth_mode = "api_key"
        else:
            self.auth_mode = raw_auth_mode

        model_name = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it").strip()
        if model_name.startswith("models/"):
            model_name = model_name[7:]
        self.model = model_name

        if self.auth_mode == "adc":
            import google.auth
            try:
                creds, proj = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
            except Exception as e:
                raise APIError(500, "INTERNAL", f"ADC Auth failed: {e}")

            project_id = proj or os.getenv("FIREBASE_PROJECT_ID") or "oscontro"
            self.model = os.getenv("GEMMA_MODEL", "gemini-1.5-flash")
            self.client = genai.Client(
                vertexai=True,
                project=project_id,
                location="us-central1",
                credentials=creds
            )
        elif self.auth_mode == "vertex":
            raise APIError(500, "INTERNAL", "Vertex AI mode is not supported for Gemma 4 models directly. Use 'adc' or 'api_key'.")

        else:
            if not api_key:
                raise APIError(500, "INTERNAL", "GEMINI_API_KEY is not configured")
            # Explicitly set vertexai=False to ensure keys starting with AQ. or AIza
            # route to Gemini Developer API (Google AI Studio)
            self.client = genai.Client(api_key=api_key, vertexai=False)

    def _strip_json(self, text: str) -> str:
        """Strip markdown code fences and extract the outermost JSON object."""
        text = (text or "").strip()
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

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        cleaned = self._strip_json(text)
        try:
            return json.loads(cleaned)
        except Exception:
            return None

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
        """Synchronous wrapper — called via asyncio.to_thread with automatic resilient fallback."""
        candidate_models = [self.model]
        for fallback in ["gemma-4-26b-a4b-it", "gemma-4-31b-it", "gemini-3.5-flash-lite", "gemini-3.5-flash"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = None
        for m in candidate_models:
            clean_m = m.strip()
            if clean_m.startswith("models/"):
                clean_m = clean_m[7:]
            try:
                response = self.client.models.generate_content(
                    model=clean_m, contents=contents
                )
                if response and response.text:
                    self.model = clean_m
                    return response.text
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "401" in err_str or "unauthenticated" in err_str or "access_token_type_unsupported" in err_str:
                    raise e
                continue
        if last_error:
            raise last_error
        return ""

    @staticmethod
    def _map_error(e: Exception) -> APIError:
        """Map genai SDK errors to our contract APIError."""
        if isinstance(e, APIError):
            return e
        err_str = str(e).lower()
        if hasattr(e, "code") or "401" in err_str or "403" in err_str or "unauthenticated" in err_str:
            detail = str(e)
            if "ACCESS_TOKEN_TYPE_UNSUPPORTED" in detail:
                detail = "Authentication rejected by Gemini API. Please verify your GEMINI_API_KEY is valid and active in Google AI Studio."
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

    def validate_evidence(self, data: Dict[str, Any], repo_context: Dict[str, Any]) -> tuple[bool, str]:
        """Validate that every contribution's evidence cites at least one file or issue from the context."""
        tree = set(repo_context.get("tree", []))
        for p in repo_context.get("files", {}).keys():
            tree.add(p)
        for p in repo_context.get("manifests", {}).keys():
            tree.add(p)
        if repo_context.get("readme"):
            tree.add("README.md")
            tree.add("README")
        if repo_context.get("contributing"):
            tree.add("CONTRIBUTING.md")
            tree.add("CONTRIBUTING")

        normalized_paths = {p.strip().lstrip("./").lower() for p in tree if p}
        basenames = {p.split("/")[-1].lower() for p in normalized_paths if p}

        issues = repo_context.get("issues", [])
        has_issues = bool(issues)
        issue_titles = [i.get("title", "").lower() for i in issues if i.get("title")]

        contributions = data.get("contributions", [])
        if not isinstance(contributions, list) or len(contributions) != 3:
            return False, "Expected exactly 3 contributions."

        for idx, contrib in enumerate(contributions):
            evidence_items = contrib.get("evidence", [])
            file_paths = [p.strip().lstrip("./").lower() for p in contrib.get("file_paths", [])]
            
            has_grounded_evidence = False
            for ev in evidence_items:
                source = ev.get("source", "").strip().lstrip("./").lower()
                detail = ev.get("detail", "").strip().lower()

                # 1. Source matches a known context path or basename
                if source in normalized_paths or source in basenames:
                    has_grounded_evidence = True
                    break
                
                # 2. Source contains a known path (e.g. "src/index.js:12")
                if any(p in source for p in normalized_paths if len(p) >= 3):
                    has_grounded_evidence = True
                    break

                # 3. Source or detail references an issue
                if has_issues and ("issue" in source or any(t in detail for t in issue_titles)):
                    has_grounded_evidence = True
                    break

                # 4. Detail explicitly mentions a verified file path
                if any(fp in detail for fp in file_paths if fp in normalized_paths):
                    has_grounded_evidence = True
                    break

            if not has_grounded_evidence:
                title = contrib.get("title", f"Contribution #{idx + 1}")
                return False, f"Contribution '{title}' evidence does not cite a file or issue from the context."

        return True, ""

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

        raw_data = self._parse_json(raw_text)
        evidence_error = None
        if raw_data:
            valid_evidence, evidence_error = self.validate_evidence(raw_data, repo_context)
            if valid_evidence:
                result = self._finalize_response(raw_data, repo_context)
                if result:
                    return result

        # --- Retry once with repair prompt ---
        if evidence_error:
            repair_msg = (
                f"Validation failed: {evidence_error}\n"
                "Every contribution in 'contributions' MUST cite at least one real file path or issue present in the context in its 'evidence'.\n"
                "Return ONLY valid raw JSON adhering strictly to the schema."
            )
        else:
            repair_msg = (
                "Your previous output was invalid or did not match the required schema. "
                "Return ONLY valid raw JSON — no markdown, no explanation.\n\n"
                f"Previous output (first 500 chars):\n{raw_text[:500]}"
            )

        retry_contents = self._build_contents(prompt + "\n\n" + repair_msg, None, None)
        try:
            raw_text2 = await asyncio.to_thread(self._call_model, retry_contents)
        except Exception as e:
            raise self._map_error(e)

        raw_data2 = self._parse_json(raw_text2)
        if raw_data2:
            valid_evidence2, evidence_error2 = self.validate_evidence(raw_data2, repo_context)
            if valid_evidence2:
                result2 = self._finalize_response(raw_data2, repo_context)
                if result2:
                    return result2
            else:
                raise APIError(
                    502,
                    "MODEL_INVALID_OUTPUT",
                    "Model output failed evidence grounding validation",
                    detail=f"Evidence does not reference a file path or issue from context: {evidence_error2}"
                )

        raise APIError(
            502,
            "MODEL_INVALID_OUTPUT",
            "Model returned invalid JSON after two attempts.",
            detail="Output could not be parsed as valid JSON matching schema."
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
            is_valid = True
            for file_path in c.file_paths:
                if "README" not in file_path and "CONTRIBUTING" not in file_path and file_path not in fetched_files:
                    is_valid = False
                    break
            
            if is_valid:
                valid_contributions.append(c)
                
        if len(valid_contributions) == 3:
            result.contributions = valid_contributions
        else:
            result.warnings.append("AGENTIC_MODE warning: Some contributions were not perfectly supported by fetched files, but were retained to meet the 3-item contract.")
        return result

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

        analyzed_files = list(repo_context.get("files", {}).keys())
        for m in repo_context.get("manifests", {}).keys():
            if m not in analyzed_files:
                analyzed_files.append(m)
        if repo_context.get("readme") and "README.md" not in analyzed_files:
            analyzed_files.append("README.md")
        if repo_context.get("contributing") and "CONTRIBUTING.md" not in analyzed_files:
            analyzed_files.append("CONTRIBUTING.md")

        data["meta"] = {
            "model": self.model,
            "files_analyzed": analyzed_files,
            "context_truncated": repo_context.get("truncated", False),
            "source": "gemma",
        }

        try:
            return AnalyzeResponse(**data)
        except Exception as e:
            print(f"[gemma] Pydantic validation error: {e}")
            return None
