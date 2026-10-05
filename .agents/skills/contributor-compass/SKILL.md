---
name: contributor-compass
description: >-
  Analyzes a public GitHub repository to understand its architecture, find
  beginner-friendly contribution opportunities grounded in real evidence, and
  optionally diagnose a UI bug from a screenshot. Use this skill whenever someone asks:
  "Where can I contribute to this repo?", "What are good first issues?", or
  "What does this bug screenshot suggest?"
---

# Contributor Compass

A portable agent skill for identifying beginner-friendly open-source contribution opportunities grounded entirely in real repository evidence.

## Workflow

1. **Inspect the repository:** Use your tools to read the README, dependency manifests, directory tree, key source files, and relevant open issues.
2. **Explain the architecture:** Briefly explain what the project does and how it is structured in plain language.
3. **Find beginner-friendly contribution opportunities:** Identify clear, actionable tasks for a newcomer (e.g., missing tests, documentation gaps, labeled issues, small UI fixes).
4. **Ground every suggestion:** Ensure every suggested contribution links to real files or issues that you have verified exist. Never invent file paths.
5. **Screenshot diagnosis (if supplied):** If the user attached a screenshot of a bug, maintain strict separation between visual observations (what is visibly wrong) and inferred causes (what code might be causing it). Explicitly state any uncertainty.
6. **Output the architecture explanation.**
7. **Suggest exactly three starter issues:** Provide a title, difficulty, likely file paths, why it's useful, why it's beginner-friendly, and your supporting evidence.
8. **Provide a first-PR checklist:** List the steps the user should take to submit their pull request based on the repository's CONTRIBUTING.md or standard practices.

## Output Format & Example

Output a clean Markdown response following this structure:

### Example

**Architecture Summary**
This is a Python web backend using FastAPI. It has an `app/` directory containing routes and services, and uses `pytest` for testing.

**Starter Issues**
1. **Title:** Add missing docstrings to authentication service
   - **Difficulty:** Beginner
   - **Likely File:** `app/services/auth.py`
   - **Why useful:** Helps future contributors understand the auth flow.
   - **Why beginner-friendly:** Requires no business logic changes.
   - **Evidence:** The file exists but has no docstrings on 3 methods.
*(Repeat for issues 2 and 3)*

**Screenshot Diagnosis** (If applicable)
- **Observations:** The login button text is invisible.
- **Inferred Causes:** CSS color might be inheriting white-on-white.
- **Uncertainty:** Cannot determine exact CSS class without DOM inspection.

**First-PR Checklist**
- [ ] Fork the repository and branch off `main`.
- [ ] Install dependencies with `pip install -r requirements.txt`.
- [ ] Submit PR and wait for CI checks.
