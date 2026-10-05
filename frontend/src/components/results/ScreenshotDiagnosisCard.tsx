import { useState } from 'react';
import type { ScreenshotDiagnosisAvailable } from '../../types/api';

interface ScreenshotDiagnosisCardProps {
  diagnosis: ScreenshotDiagnosisAvailable;
  fileUrl?: string; // We can pass the object URL created for the preview
}

export function ScreenshotDiagnosisCard({ diagnosis, fileUrl }: ScreenshotDiagnosisCardProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const confidenceColors = {
    Low: 'bg-[var(--color-badge-low-bg)] text-[var(--color-badge-low-text)] ring-1 ring-[var(--color-badge-low-text)]/20',
    Medium: 'bg-[var(--color-badge-intermediate-bg)] text-[var(--color-badge-intermediate-text)] ring-1 ring-[var(--color-badge-intermediate-text)]/20',
    High: 'bg-[var(--color-badge-beginner-bg)] text-[var(--color-badge-beginner-text)] ring-1 ring-[var(--color-badge-beginner-text)]/20'
  };

  const badgeColor = confidenceColors[diagnosis.confidence] || confidenceColors.Medium;

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-strong)] shadow-[var(--shadow-warm)] overflow-hidden" id="diagnosis">
      <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-raised)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center">
            <svg className="w-5 h-5 mr-2 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Screenshot Diagnosis
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Analysis of your provided bug screenshot.</p>
        </div>
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium shrink-0 ${badgeColor}`}>
          Confidence: {diagnosis.confidence}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {fileUrl ? (
            <div className="rounded-[8px] overflow-hidden border border-[var(--color-border-soft)] bg-[var(--color-page)] sticky top-6 shadow-[var(--shadow-warm)]">
              <img src={fileUrl} alt="User provided screenshot" className="w-full h-auto" />
            </div>
          ) : (
            <div className="rounded-[8px] border border-[var(--color-border-soft)] border-dashed bg-[var(--color-page)] aspect-video flex items-center justify-center text-[var(--color-text-secondary)]">
              Screenshot not available
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{diagnosis.visible_problem}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Likely Area: <span className="text-[var(--color-text-primary)] font-semibold">{diagnosis.likely_area}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-page)] rounded-[8px] p-5 border border-[var(--color-border-soft)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                What I can see
              </h4>
              <ul className="space-y-2">
                {diagnosis.observed_facts.map((fact, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start">
                    <span className="text-[var(--color-border-strong)] mr-2 font-bold">•</span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[var(--color-page)] rounded-[8px] p-5 border border-[var(--color-border-soft)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[var(--color-badge-intermediate-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                What it might be
              </h4>
              <ul className="space-y-2">
                {diagnosis.likely_causes.map((cause, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start">
                    <span className="text-[var(--color-border-strong)] mr-2 font-bold">•</span>
                    <span className="italic">{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">Likely Files to Check</h4>
            <ul className="space-y-2">
              {diagnosis.likely_files.map((file, i) => (
                <li key={i} className="flex items-center justify-between bg-[var(--color-code-bg)] rounded-[8px] border border-[var(--color-border-soft)] p-2 max-w-lg">
                  <span className="font-mono text-sm text-[var(--color-code-text)] font-medium truncate mr-2" title={file}>{file}</span>
                  <button
                    onClick={() => handleCopy(file)}
                    className="shrink-0 p-1.5 rounded-md hover:bg-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {copiedPath === file ? (
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
          </div>

          <div className="bg-[var(--color-notice-bg)] border border-[var(--color-notice-border)] rounded-[8px] p-5">
            <h4 className="text-sm font-semibold text-[var(--color-notice-text)] mb-2">Suggested Approach</h4>
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{diagnosis.suggested_contribution}</p>
          </div>

          {diagnosis.uncertainty && (
            <div className="text-xs text-[var(--color-text-secondary)] italic border-l-2 border-[var(--color-border-strong)] pl-3 leading-relaxed">
              Note: {diagnosis.uncertainty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
