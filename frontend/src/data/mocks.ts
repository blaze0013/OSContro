import type { AnalyzeResponse } from '../types/api';

export const MOCK_RESPONSE_NO_SCREENSHOT: AnalyzeResponse = {
  repository: {
    owner: "octocat",
    name: "Hello-World",
    url: "https://github.com/octocat/Hello-World",
    description: "My first repository on GitHub!",
    primary_language: "TypeScript"
  },
  architecture: {
    summary: "A simple starter repository demonstrating basic Git operations.",
    technologies: ["Git", "GitHub"],
    structure: [
      { path: "README.md", purpose: "Contains project documentation and setup instructions." },
      { path: "index.js", purpose: "Main entry point for the mock application." }
    ],
    key_components: [
      { name: "Doc Engine", path: "docs/", role: "Generates static documentation." }
    ],
    data_flow: "User interacts with the CLI which reads the local files."
  },
  contributions: [
    {
      title: "Fix typo in README",
      difficulty: "Beginner",
      description: "There is a typo in the main heading of the README file that can be easily fixed.",
      file_paths: ["README.md"],
      paths_verified: true,
      why_useful: "Improves readability for new users onboarding to the project.",
      why_beginner_friendly: "Requires no code changes and introduces the PR workflow safely.",
      evidence: [
        { source: "README.md", detail: "Line 3 says 'Hllo World' instead of 'Hello World'" }
      ]
    },
    {
      title: "Add unit tests for string utility",
      difficulty: "Easy",
      description: "The string utility functions lack basic unit tests.",
      file_paths: ["src/utils/string.js", "tests/string.test.js"],
      paths_verified: true,
      why_useful: "Increases test coverage and prevents regressions.",
      why_beginner_friendly: "The functions are simple and well-isolated.",
      evidence: [
        { source: "src/utils/string.js", detail: "No test files correspond to this module." }
      ]
    },
    {
      title: "Migrate legacy component",
      difficulty: "Intermediate",
      description: "Migrate the legacy list component to use the new virtualized list.",
      file_paths: ["src/components/List.jsx"],
      paths_verified: false,
      why_useful: "Improves performance for large datasets.",
      why_beginner_friendly: "The migration pattern is already established in other components.",
      evidence: [
        { source: "src/components/List.jsx", detail: "Still using standard DOM mapping for 10k+ items." }
      ]
    }
  ],
  screenshot_diagnosis: {
    available: false
  },
  pr_checklist: [
    "Fork the repository",
    "Create a new branch for your feature",
    "Make the changes and commit them",
    "Push to your fork",
    "Open a Pull Request against the main branch"
  ],
  warnings: [
    "Could not verify existence of 'src/components/List.jsx'."
  ],
  meta: {
    model: "gemini-4-mock",
    files_analyzed: ["README.md", "src/utils/string.js", "package.json"],
    context_truncated: false
  }
};

export const MOCK_RESPONSE_WITH_SCREENSHOT: AnalyzeResponse = {
  ...MOCK_RESPONSE_NO_SCREENSHOT,
  screenshot_diagnosis: {
    available: true,
    visible_problem: "The submit button is overflowing the container on mobile screens.",
    observed_facts: [
      "Submit button text is clipped",
      "Container width appears to be 320px",
      "Button width is fixed at 400px"
    ],
    likely_area: "Frontend UI (Mobile layout)",
    likely_causes: [
      "Hardcoded fixed width on the button element",
      "Missing responsive media queries",
      "Parent container lacks overflow-hidden or flex-wrap"
    ],
    likely_files: [
      "src/styles/components/button.css",
      "src/components/SubmitForm.jsx"
    ],
    suggested_contribution: "Update the button CSS to use max-w-full or a responsive width.",
    confidence: "High",
    uncertainty: "It is unclear if this is due to a recent change in the layout framework without seeing the commit history."
  },
  contributions: [
    {
      title: "Fix button overflow on mobile",
      difficulty: "Beginner",
      description: "Modify the submit button styling so it doesn't overflow small screens.",
      file_paths: ["src/components/SubmitForm.jsx"],
      paths_verified: true,
      why_useful: "Directly fixes the visual bug shown in the screenshot, making the app usable on mobile.",
      why_beginner_friendly: "CSS fix isolated to a single component.",
      evidence: [
        { source: "Screenshot", detail: "Submit button overflows right edge." },
        { source: "src/components/SubmitForm.jsx", detail: "Has fixed width class 'w-[400px]'." }
      ]
    },
    ...MOCK_RESPONSE_NO_SCREENSHOT.contributions.slice(1)
  ]
};
