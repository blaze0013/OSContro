import httpx
import re
import os
import asyncio
from typing import Dict, Any, List, Optional
from app.errors import APIError

class GitHubContextBuilder:
    def __init__(self, repo_url: str):
        self.repo_url = repo_url.strip()
        self.owner = ""
        self.repo = ""
        self.token = os.getenv("GITHUB_TOKEN")
        self.headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
        
        self.all_paths: List[str] = []
        self.context_truncated = False
        self.api_calls = 0
        self.MAX_CALLS = 15
        
        self.repo_meta = {}
        self.default_branch = "main"
        self.readme_content = ""
        self.contributing_content = ""
        self.manifest_contents = {}
        self.issues = []
        self.selected_files = {}

    def parse_url(self):
        # Tolerate trailing slash, .git, or /tree/...
        pattern = r"^https://github\.com/([^/]+)/([^/]+?)(?:\.git|/tree/.*|/)?$"
        match = re.match(pattern, self.repo_url)
        if not match:
            raise APIError(400, "INVALID_URL", "URL must be a valid GitHub repository URL.")
        self.owner = match.group(1)
        self.repo = match.group(2)

    async def get(self, client: httpx.AsyncClient, url: str) -> httpx.Response:
        if self.api_calls >= self.MAX_CALLS:
            return None
        self.api_calls += 1
        try:
            resp = await client.get(url, headers=self.headers)
            if resp.status_code == 429 or 'rate limit' in resp.text.lower() or resp.status_code == 403:
                raise APIError(429, "GITHUB_RATE_LIMIT", "GitHub API rate limit exceeded. Provide GITHUB_TOKEN.")
            return resp
        except httpx.RequestError as e:
            raise APIError(500, "INTERNAL", f"Network error: {str(e)}")

    async def build_context(self) -> Dict[str, Any]:
        self.parse_url()
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            # 1. Repo meta
            resp = await self.get(client, f"https://api.github.com/repos/{self.owner}/{self.repo}")
            if resp is None: raise APIError(500, "INTERNAL", "API call limit reached.")
            if resp.status_code == 404:
                raise APIError(404, "REPO_NOT_FOUND", "Repository not found or private.")
            if resp.status_code != 200:
                raise APIError(500, "INTERNAL", f"GitHub API error: {resp.status_code}")
            
            repo_data = resp.json()
            if repo_data.get("empty"):
                raise APIError(400, "INVALID_URL", "Repository is empty.")
                
            self.repo_meta = {
                "owner": self.owner,
                "name": self.repo,
                "url": repo_data.get("html_url", self.repo_url),
                "description": repo_data.get("description") or "",
                "primary_language": repo_data.get("language")
            }
            self.default_branch = repo_data.get("default_branch", "main")

            # 2. Tree
            tree_url = f"https://api.github.com/repos/{self.owner}/{self.repo}/git/trees/{self.default_branch}?recursive=1"
            tree_resp = await self.get(client, tree_url)
            if tree_resp and tree_resp.status_code == 200:
                tree_data = tree_resp.json()
                if tree_data.get("truncated"):
                    self.context_truncated = True
                self.all_paths = [item["path"] for item in tree_data.get("tree", []) if item["type"] == "blob"]
            else:
                self.context_truncated = True

            # 3. Readme
            readme_resp = await self.get(client, f"https://api.github.com/repos/{self.owner}/{self.repo}/readme")
            if readme_resp and readme_resp.status_code == 200:
                download_url = readme_resp.json().get("download_url")
                if download_url:
                    r2 = await client.get(download_url)
                    self.readme_content = r2.text[:5000]

            # 4. Issues (good first issue)
            issues_url = f"https://api.github.com/repos/{self.owner}/{self.repo}/issues?state=open&sort=updated&per_page=5"
            issues_resp = await self.get(client, issues_url)
            if issues_resp and issues_resp.status_code == 200:
                issues_data = issues_resp.json()
                # filter out PRs
                for issue in issues_data:
                    if "pull_request" not in issue:
                        labels = [l["name"] for l in issue.get("labels", [])]
                        self.issues.append({
                            "title": issue.get("title"),
                            "body": (issue.get("body") or "")[:500],
                            "labels": labels
                        })

            # 5. Manifests and key files
            manifest_names = ["package.json", "requirements.txt", "pyproject.toml", "go.mod", "Cargo.toml", "pom.xml", "CONTRIBUTING.md"]
            files_to_fetch = []
            
            # Deterministic heuristics for important files
            entry_patterns = [r"main\.py$", r"app\.py$", r"index\.js$", r"App\.js$", r"main\.go$"]
            
            for path in self.all_paths:
                name = path.split("/")[-1]
                if name in manifest_names:
                    files_to_fetch.append(path)
                elif any(re.search(p, path) for p in entry_patterns) and len(files_to_fetch) < 10:
                    files_to_fetch.append(path)

            for path in files_to_fetch[:8]: # cap to 8 files
                file_url = f"https://raw.githubusercontent.com/{self.owner}/{self.repo}/{self.default_branch}/{path}"
                f_resp = await self.get(client, file_url)
                if f_resp and f_resp.status_code == 200:
                    if path == "CONTRIBUTING.md":
                        self.contributing_content = f_resp.text[:3000]
                    elif path.split("/")[-1] in manifest_names:
                        self.manifest_contents[path] = f_resp.text[:2000]
                    else:
                        self.selected_files[path] = f_resp.text[:3000]

        return {
            "repository": self.repo_meta,
            "tree": self.all_paths,
            "readme": self.readme_content,
            "contributing": self.contributing_content,
            "manifests": self.manifest_contents,
            "files": self.selected_files,
            "issues": self.issues,
            "truncated": self.context_truncated
        }

    async def build_minimal_context(self) -> Dict[str, Any]:
        """Fetch only metadata, tree, README, and issues. Does not fetch other files."""
        self.parse_url()
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            # 1. Repo meta
            resp = await self.get(client, f"https://api.github.com/repos/{self.owner}/{self.repo}")
            if resp is None: raise APIError(500, "INTERNAL", "API call limit reached.")
            if resp.status_code == 404: raise APIError(404, "REPO_NOT_FOUND", "Repository not found or private.")
            if resp.status_code != 200: raise APIError(500, "INTERNAL", f"GitHub API error: {resp.status_code}")
            
            repo_data = resp.json()
            if repo_data.get("empty"): raise APIError(400, "INVALID_URL", "Repository is empty.")
                
            self.repo_meta = {
                "owner": self.owner,
                "name": self.repo,
                "url": repo_data.get("html_url", self.repo_url),
                "description": repo_data.get("description") or "",
                "primary_language": repo_data.get("language")
            }
            self.default_branch = repo_data.get("default_branch", "main")

            # 2. Tree
            tree_url = f"https://api.github.com/repos/{self.owner}/{self.repo}/git/trees/{self.default_branch}?recursive=1"
            tree_resp = await self.get(client, tree_url)
            if tree_resp and tree_resp.status_code == 200:
                tree_data = tree_resp.json()
                if tree_data.get("truncated"): self.context_truncated = True
                self.all_paths = [item["path"] for item in tree_data.get("tree", []) if item["type"] == "blob"]
            else:
                self.context_truncated = True

            # 3. Readme
            readme_resp = await self.get(client, f"https://api.github.com/repos/{self.owner}/{self.repo}/readme")
            if readme_resp and readme_resp.status_code == 200:
                download_url = readme_resp.json().get("download_url")
                if download_url:
                    r2 = await client.get(download_url)
                    self.readme_content = r2.text[:5000]

            # 4. Issues
            issues_url = f"https://api.github.com/repos/{self.owner}/{self.repo}/issues?state=open&sort=updated&per_page=5"
            issues_resp = await self.get(client, issues_url)
            if issues_resp and issues_resp.status_code == 200:
                for issue in issues_resp.json():
                    if "pull_request" not in issue:
                        self.issues.append({
                            "title": issue.get("title"),
                            "body": (issue.get("body") or "")[:500],
                            "labels": [l["name"] for l in issue.get("labels", [])]
                        })

        return {
            "repository": self.repo_meta,
            "tree": self.all_paths,
            "readme": self.readme_content,
            "contributing": "",
            "manifests": {},
            "files": {},
            "issues": self.issues,
            "truncated": self.context_truncated
        }

    async def fetch_specific_files(self, paths: List[str]) -> Dict[str, str]:
        """Fetch up to 5 specific valid paths."""
        fetched = {}
        valid_paths = [p for p in paths if p in self.all_paths][:5]
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for path in valid_paths:
                file_url = f"https://raw.githubusercontent.com/{self.owner}/{self.repo}/{self.default_branch}/{path}"
                resp = await self.get(client, file_url)
                if resp and resp.status_code == 200:
                    fetched[path] = resp.text[:3000]
        return fetched

async def fetch_github_context(repo_url: str) -> Dict[str, Any]:
    builder = GitHubContextBuilder(repo_url)
    return await builder.build_context()

async def fetch_github_minimal_context(repo_url: str) -> GitHubContextBuilder:
    builder = GitHubContextBuilder(repo_url)
    await builder.build_minimal_context()
    return builder
