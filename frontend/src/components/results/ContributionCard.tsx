import { useState } from 'react';
import type { Contribution } from '../../types/api';

interface ContributionCardProps {
  contribution: Contribution;
  index: number;
}

export function ContributionCard({ contribution, index }: ContributionCardProps) {
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const difficultyColors = {
    Beginner: 'bg-[var(--color-badge-beginner-bg)] text-[var(--color-badge-beginner-text)] ring-1 ring-[var(--color-badge-beginner-text)]/20',
    Easy: 'bg-[var(--color-badge-easy-bg)] text-[var(--color-badge-easy-text)] ring-1 ring-[var(--color-badge-easy-text)]/20',
    Intermediate: 'bg-[var(--color-badge-intermediate-bg)] text-[var(--color-badge-intermediate-text)] ring-1 ring-[var(--color-badge-intermediate-text)]/20'
  };

  const badgeColor = difficultyColors[contribution.difficulty] || difficultyColors.Beginner;

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-strong)] shadow-[var(--shadow-warm)] overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-raised)] flex-1">
        <div className="flex items-start justify-between mb-4 gap-4">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">
            <span className="text-[var(--color-accent)] mr-2">#{index + 1}</span>
            {contribution.title}
          </h3>
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium shrink-0 ${badgeColor}`}>
            {contribution.difficulty}
          </span>
        </div>
        
        <p className="text-[var(--color-text-primary)] text-sm mb-6 leading-relaxed">{contribution.description}</p>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Why it's useful</h4>
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{contribution.why_useful}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Why it's beginner friendly</h4>
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{contribution.why_beginner_friendly}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[var(--color-page)]">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Target Files</h4>
          {!contribution.paths_verified && (
            <span className="text-xs text-[var(--color-notice-text)] flex items-center bg-[var(--color-notice-bg)] px-1.5 py-0.5 rounded border border-[var(--color-notice-border)]" title="These paths were inferred but could not be strictly verified">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Unverified paths
            </span>
          )}
        </div>
        
        <ul className="space-y-2 mb-6">
          {contribution.file_paths.map((path, i) => (
            <li key={i} className="flex items-center justify-between bg-[var(--color-code-bg)] rounded-[8px] border border-[var(--color-border-soft)] p-2">
              <span className="font-mono text-sm text-[var(--color-code-text)] font-medium truncate mr-2" title={path}>{path}</span>
              <button
                onClick={() => handleCopy(path)}
                className="shrink-0 p-1.5 rounded-md hover:bg-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Copy path"
              >
                {copiedPath === path ? (
                  <svg className="w-4 h-4 text-[var(--color-badge-beginner-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div>
          <button
            onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
            className="flex items-center text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            {isEvidenceExpanded ? 'Hide Evidence' : 'Show Evidence'}
            <svg className={`ml-1 w-3 h-3 transform transition-transform ${isEvidenceExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isEvidenceExpanded && (
            <ul className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {contribution.evidence.map((ev, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-[var(--color-text-primary)] block mb-0.5">{ev.source}:</span>
                  <span className="text-[var(--color-text-secondary)] italic leading-relaxed">"{ev.detail}"</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
