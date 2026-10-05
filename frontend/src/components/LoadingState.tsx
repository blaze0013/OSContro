import { useState, useEffect } from 'react';

const STAGES = [
  'Fetching repository context...',
  'Reading key files...',
  'Asking Gemma 4...',
  'Validating results...'
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
    // Progress stages every 8 seconds, up to the last stage
    const stageTimer = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 8000);
    return () => clearInterval(stageTimer);
  }, []);

  return (
    <div className="rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-[var(--shadow-warm-md)] p-8 text-center mt-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] transition-all duration-500">
            {STAGES[stageIndex]}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Elapsed time: {elapsed}s
          </p>
        </div>

        <div className="w-full max-w-xs bg-[var(--color-raised)] h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-[var(--color-accent)] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.max(10, ((stageIndex + 1) / STAGES.length) * 100)}%` }}
          />
        </div>

        <button
          onClick={onCancel}
          className="mt-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-4"
        >
          Cancel Analysis
        </button>
      </div>
    </div>
  );
}
