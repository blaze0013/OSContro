export function validateGithubUrl(url: string): string | null {
  if (!url || !url.trim()) {
    return null;
  }
  const trimmed = url.trim();
  const pattern = /^https:\/\/github\.com\/[^/]+\/[^/]+(?:\.git|\/tree\/.*|\/)?$/;
  if (!pattern.test(trimmed)) {
    return 'URL must be a valid GitHub repository URL (e.g. https://github.com/owner/repo)';
  }
  return null;
}

