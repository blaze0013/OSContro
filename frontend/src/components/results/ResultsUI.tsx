import type { AnalyzeResponse } from '../../types/api';
import { ArchitectureCard } from './ArchitectureCard';
import { ContributionsList } from './ContributionsList';
import { ScreenshotDiagnosisCard } from './ScreenshotDiagnosisCard';
import { PRChecklist } from './PRChecklist';
import { WarningsPanel } from './WarningsPanel';

interface ResultsUIProps {
  result: AnalyzeResponse;
  fileUrl?: string;
  onReset: () => void;
}

export function ResultsUI({ result, fileUrl, onReset }: ResultsUIProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Analysis Results</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Review the architecture and suggested contributions.</p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--color-raised)] transition-colors shadow-[var(--shadow-warm)]"
        >
          <svg className="w-4 h-4 mr-2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Analyze another repo
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content Area */}
        <div className="w-full lg:w-3/4 space-y-10 order-2 lg:order-1">
          <ArchitectureCard repository={result.repository} architecture={result.architecture} />
          
          {result.screenshot_diagnosis.available && (
            <ScreenshotDiagnosisCard 
              diagnosis={result.screenshot_diagnosis} 
              fileUrl={fileUrl} 
            />
          )}
          
          <ContributionsList contributions={result.contributions} />
          
          <PRChecklist items={result.pr_checklist} />
        </div>

        {/* Sidebar Area */}
        <div className="w-full lg:w-1/4 sticky top-6 space-y-6 order-1 lg:order-2">
          {/* Section Nav */}
          <nav className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-soft)] p-4 shadow-[var(--shadow-warm)] hidden lg:block">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Jump to</h3>
            <ul className="space-y-2">
              <li>
                <a href="#architecture" className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] mr-2"></span>
                  Architecture
                </a>
              </li>
              {result.screenshot_diagnosis.available && (
                <li>
                  <a href="#diagnosis" className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] mr-2"></span>
                    Diagnosis
                  </a>
                </li>
              )}
              <li>
                <a href="#contributions" className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] mr-2"></span>
                  Contributions
                </a>
              </li>
              <li>
                <a href="#checklist" className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] mr-2"></span>
                  PR Checklist
                </a>
              </li>
            </ul>
          </nav>

          {/* Warnings & Meta Info */}
          <WarningsPanel warnings={result.warnings} meta={result.meta} />
        </div>
      </div>
    </div>
  );
}
