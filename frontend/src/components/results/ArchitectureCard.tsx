import { useState } from 'react';
import type { Architecture, Repository } from '../../types/api';

interface ArchitectureCardProps {
  repository: Repository;
  architecture: Architecture;
}

export function ArchitectureCard({ repository, architecture }: ArchitectureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-strong)] shadow-[var(--shadow-warm)] overflow-hidden" id="architecture">
      <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-raised)]">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center">
          <svg className="w-5 h-5 mr-2 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Repository Architecture
        </h2>
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <a href={repository.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline">
              {repository.owner}/{repository.name}
            </a>
            {repository.primary_language && (
              <span className="inline-flex items-center rounded-full bg-[var(--color-page)] border border-[var(--color-border-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                {repository.primary_language}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{repository.description}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Summary</h3>
          <p className="text-[var(--color-text-primary)] leading-relaxed">{architecture.summary}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {architecture.technologies.map(tech => (
              <span key={tech} className="inline-flex items-center rounded-md bg-[var(--color-raised)] px-2 py-1 text-xs font-medium text-[var(--color-text-primary)] border border-[var(--color-border-soft)]">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Collapsible section for details */}
        <div className="pt-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {isExpanded ? 'Hide Details' : 'Show Detailed Structure & Data Flow'}
            <svg className={`ml-1 w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-[var(--color-border-soft)] animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Key Components</h3>
              <ul className="space-y-3">
                {architecture.key_components.map((comp, i) => (
                  <li key={i} className="bg-[var(--color-page)] rounded-[8px] p-4 border border-[var(--color-border-soft)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-semibold text-[var(--color-text-primary)]">{comp.name}</span>
                      {comp.path && <span className="font-mono text-xs text-[var(--color-code-text)] bg-[var(--color-code-bg)] px-2 py-1 rounded">{comp.path}</span>}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">{comp.role}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Folder Structure</h3>
              <ul className="space-y-3">
                {architecture.structure.map((item, i) => (
                  <li key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 text-sm bg-[var(--color-page)] p-3 rounded-[8px] border border-[var(--color-border-soft)]">
                    <span className="font-mono font-medium text-[var(--color-code-text)] shrink-0">{item.path}</span>
                    <span className="text-[var(--color-text-secondary)] leading-relaxed">{item.purpose}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Data Flow</h3>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed bg-[var(--color-page)] p-4 rounded-[8px] border border-[var(--color-border-soft)]">{architecture.data_flow}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
