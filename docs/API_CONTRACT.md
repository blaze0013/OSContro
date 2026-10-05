=================================================================
API CONTRACT v1.1  (source of truth, identical in the frontend prompt)
=================================================================
Conventions: JSON UTF-8, snake_case keys, difficulty/confidence enums are capitalized exactly as shown.

GET /api/health
  200 {"status": "ok", "model": "<gemma model id>", "fixture_mode": false, "auth_required": false}

GET /api/me
  Headers: Authorization: Bearer <token> (required if AUTH_REQUIRED=true)
  200 {"uid": "string", "name": "string", "email": "string", "picture": "string", "provider": "string"}
  (When AUTH_REQUIRED=false and no token is provided, returns an anonymous placeholder)

POST /api/analyze   (multipart/form-data)
  Headers: Authorization: Bearer <token> (required if AUTH_REQUIRED=true)
  repository_url: string, required. Only https://github.com/{owner}/{repo}; tolerate a trailing slash, ".git", or "/tree/..." suffix.
  screenshot: file, optional. image/png, image/jpeg, image/webp. Max MAX_UPLOAD_MB.

200 response body:
{
  "repository": {
    "owner": "string",
    "name": "string",
    "url": "string",
    "description": "string",
    "primary_language": "string or null"
  },
  "architecture": {
    "summary": "string",
    "technologies": ["string"],
    "structure": [{"path": "string", "purpose": "string"}],
    "key_components": [{"name": "string", "path": "string or null", "role": "string"}],
    "data_flow": "string"
  },
  "contributions": [            // EXACTLY 3 items
    {
      "title": "string",
      "difficulty": "Beginner | Easy | Intermediate",
      "description": "string",
      "file_paths": ["string"],     // verified against the real repo tree
      "paths_verified": true,       // false if any path could not be verified
      "why_useful": "string",
      "why_beginner_friendly": "string",
      "evidence": [{"source": "string", "detail": "string"}]   // source e.g. "README.md", "src/app.py", "issue #123", "directory tree"
    }
  ],
  "screenshot_diagnosis": {"available": false}
     OR
  "screenshot_diagnosis": {
    "available": true,
    "visible_problem": "string",
    "observed_facts": ["string"],        // only what is visibly in the image
    "likely_area": "string",
    "likely_causes": ["string"],         // inferred, hedged
    "likely_files": ["string"],          // verified against the repo tree
    "suggested_contribution": "string",
    "confidence": "Low | Medium | High",
    "uncertainty": "string"
  },
  "pr_checklist": ["string"],            // ordered, actionable steps
  "warnings": ["string"],                // e.g. truncated context, unverified paths, thin evidence
  "meta": {"model": "string", "files_analyzed": ["string"], "context_truncated": false}
}

Error responses: matching HTTP status and body {"error": {"code": "<CODE>", "message": "string"}}
  UNAUTHENTICATED 401 | INVALID_URL 400 | IMAGE_INVALID 415 | IMAGE_TOO_LARGE 413 | REPO_NOT_FOUND 404 |
  GITHUB_RATE_LIMIT 429 | MODEL_ERROR 502 | MODEL_INVALID_OUTPUT 502 | INTERNAL 500
=================================================================
