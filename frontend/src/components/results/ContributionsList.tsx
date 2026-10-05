import { ContributionCard } from './ContributionCard';
import type { Contribution } from '../../types/api';

interface ContributionsListProps {
  contributions: Contribution[];
}

export function ContributionsList({ contributions }: ContributionsListProps) {
  return (
    <div className="space-y-6" id="contributions">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center">
            <svg className="w-5 h-5 mr-2 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Starter Contributions
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Three personalized starting points for your first pull request.</p>
        </div>
        
        {contributions.length !== 3 && (
          <span className="text-xs text-[var(--color-notice-text)] bg-[var(--color-notice-bg)] px-2 py-1 rounded border border-[var(--color-notice-border)]">
            Expected 3, got {contributions.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {contributions.map((contribution, index) => (
          <ContributionCard key={index} contribution={contribution} index={index} />
        ))}
        {contributions.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-soft)]">
            <p className="text-[var(--color-text-secondary)]">No contributions suggested by the model.</p>
          </div>
        )}
      </div>
    </div>
  );
}
