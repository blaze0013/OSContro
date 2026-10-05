export interface Repository {
  owner: string;
  name: string;
  url: string;
  description: string;
  primary_language: string | null;
}

export interface ArchitectureStructure {
  path: string;
  purpose: string;
}

export interface ArchitectureComponent {
  name: string;
  path: string | null;
  role: string;
}

export interface Architecture {
  summary: string;
  technologies: string[];
  structure: ArchitectureStructure[];
  key_components: ArchitectureComponent[];
  data_flow: string;
}

export interface ContributionEvidence {
  source: string;
  detail: string;
}

export type ContributionDifficulty = 'Beginner' | 'Easy' | 'Intermediate';

export interface Contribution {
  title: string;
  difficulty: ContributionDifficulty;
  description: string;
  file_paths: string[];
  paths_verified: boolean;
  why_useful: string;
  why_beginner_friendly: string;
  evidence: ContributionEvidence[];
}

export interface ScreenshotDiagnosisNotAvailable {
  available: false;
}

export interface ScreenshotDiagnosisAvailable {
  available: true;
  visible_problem: string;
  observed_facts: string[];
  likely_area: string;
  likely_causes: string[];
  likely_files: string[];
  suggested_contribution: string;
  confidence: 'Low' | 'Medium' | 'High';
  uncertainty: string;
}

export type ScreenshotDiagnosis = ScreenshotDiagnosisNotAvailable | ScreenshotDiagnosisAvailable;

export interface Meta {
  model: string;
  files_analyzed: string[];
  context_truncated: boolean;
}

export interface AnalyzeResponse {
  repository: Repository;
  architecture: Architecture;
  contributions: Contribution[];
  screenshot_diagnosis: ScreenshotDiagnosis;
  pr_checklist: string[];
  warnings: string[];
  meta: Meta;
}

export interface HealthResponse {
  status: string;
  model: string;
  fixture_mode: boolean;
}

export interface ModelHealthResponse {
  ok: boolean;
  model: string;
  detail: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  detail?: string;
}
