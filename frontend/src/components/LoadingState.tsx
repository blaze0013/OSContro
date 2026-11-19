import { useState, useEffect } from 'react';

const STAGES = [
  'Fetching repository context from GitHub...',
  'Reading key source files & manifests...',
  'Analyzing architecture with Gemma 4...',
  'Grounding starter contributions with verified evidence...'
];

interface LoadingStateProps {
  onCancel: () => void;
}

export function LoadingState({ onCancel }: LoadingStateProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 9000);
    return () => clearInterval(stageTimer);
  }, []);

  const progressPercent = Math.min(95, Math.round(((stageIndex + 0.6) / STAGES.length) * 100));

  return (
    <div className="mt-10 space-y-8 screen-enter-anim">
      {/* Staged progress banner */}
      <div className="rounded-[12px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[var(--shadow-warm-md)] p-6 text-center card-sweep">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
            <span className="uppercase tracking-wider">Step {stageIndex + 1} of {STAGES.length}</span>
            <span>Elapsed: {elapsed}s</span>
          </div>

          <h3 className="text-base font-bold text-[var(--color-text-primary)] transition-all duration-300">
            {STAGES[stageIndex]}
          </h3>

          <div className="w-full bg-[var(--color-page)] h-2 rounded-full overflow-hidden border border-[var(--color-border-soft)] relative">
            <div 
              className="bg-gradient-to-r from-[var(--color-accent)] to-[#B3743B] h-full transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={onCancel}
            className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-4 cursor-pointer btn-press hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Cancel Analysis
          </button>
        </div>
      </div>

      {/* Soft shimmer skeletons of result cards */}
      <div className="space-y-6 opacity-85 pointer-events-none select-none" aria-hidden="true">
        {/* Architecture skeleton */}
        <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-warm)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-48 h-6 rounded shimmer-bg" />
            <div className="w-20 h-5 rounded-full shimmer-bg" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 rounded shimmer-bg" />
            <div className="w-4/5 h-4 rounded shimmer-bg" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="w-16 h-6 rounded-full shimmer-bg" />
            <div className="w-20 h-6 rounded-full shimmer-bg" />
            <div className="w-24 h-6 rounded-full shimmer-bg" />
          </div>
        </div>

        {/* 3 Starter Contribution skeletons */}
        <div>
          <div className="w-40 h-5 rounded shimmer-bg mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-warm)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-24 h-5 rounded-full shimmer-bg" />
                  <div className="w-12 h-4 rounded shimmer-bg" />
                </div>
                <div className="w-3/4 h-5 rounded shimmer-bg" />
                <div className="space-y-2">
                  <div className="w-full h-3.5 rounded shimmer-bg" />
                  <div className="w-5/6 h-3.5 rounded shimmer-bg" />
                </div>
                <div className="w-1/2 h-4 rounded shimmer-bg" />
                <div className="h-16 rounded-[8px] shimmer-bg" />
              </div>
            ))}
          </div>
        </div>

        {/* Checklist skeleton */}
        <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-warm)] space-y-4">
          <div className="w-36 h-5 rounded shimmer-bg" />
          <div className="w-full h-2 rounded-full shimmer-bg" />
          <div className="space-y-3 pt-2">
            <div className="w-2/3 h-4 rounded shimmer-bg" />
            <div className="w-3/4 h-4 rounded shimmer-bg" />
            <div className="w-1/2 h-4 rounded shimmer-bg" />
          </div>
        </div>
      </div>
    </div>
  );
}
