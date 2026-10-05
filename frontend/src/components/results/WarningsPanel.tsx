import { useState } from 'react';
import type { Meta } from '../../types/api';

interface WarningsPanelProps {
  warnings: string[];
  meta: Meta;
}

export function WarningsPanel({ warnings, meta }: WarningsPanelProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);

  if (isDismissed && !isMetaExpanded) {
    return (
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsMetaExpanded(true)}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] underline underline-offset-2 transition-colors"
        >
          Show analysis details
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {!isDismissed && warnings.length > 0 && (
        <div className="bg-[var(--color-notice-bg)] border border-[var(--color-notice-border)] rounded-[12px] p-4 flex items-start shadow-sm">
          <svg className="w-5 h-5 text-[var(--color-notice-text)] mt-0.5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-notice-text)]">Analysis Warnings</h3>
            <ul className="mt-1 space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{w}</li>
              ))}
            </ul>
          </div>
          <button 
            onClick={() => setIsDismissed(true)}
            className="ml-3 text-[var(--color-notice-text)] opacity-50 hover:opacity-100 focus:outline-none transition-opacity"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-[var(--color-page)] border border-[var(--color-border-soft)] rounded-[12px] overflow-hidden shadow-[var(--shadow-warm)]">
        <button
          onClick={() => setIsMetaExpanded(!isMetaExpanded)}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] transition-colors"
        >
          <span>How this was analyzed</span>
          <svg className={`w-4 h-4 transform transition-transform ${isMetaExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isMetaExpanded && (
          <div className="p-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Model:</span>
              <span className="text-[var(--color-code-text)] font-mono font-medium bg-[var(--color-code-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border-soft)]">{meta.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Context Truncated:</span>
              <span className={meta.context_truncated ? 'text-[var(--color-notice-text)] font-semibold' : 'text-[var(--color-text-primary)] font-medium'}>
                {meta.context_truncated ? 'Yes (repo too large)' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)] block mb-1">Files Analyzed ({meta.files_analyzed.length}):</span>
              <div className="max-h-32 overflow-y-auto bg-[var(--color-surface)] p-2 rounded border border-[var(--color-border-soft)] font-mono text-[10px] text-[var(--color-code-text)]">
                {meta.files_analyzed.map((f, i) => (
                  <div key={i}>{f}</div>
                ))}
              </div>
            </div>
            
            {isDismissed && (
               <div className="pt-2 flex justify-end">
                  <button onClick={() => setIsMetaExpanded(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium">Hide</button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
