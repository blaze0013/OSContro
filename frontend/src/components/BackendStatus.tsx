import { useState, useEffect } from 'react';
import { health, modelHealth } from '../lib/api';
import type { HealthResponse, ModelHealthResponse } from '../types/api';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [data, setData] = useState<HealthResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelHealthResponse | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await health();
        setData(res);
        setStatus('online');
        
        try {
          const mHealth = await modelHealth();
          setModelStatus(mHealth);
        } catch (e) {
          // If it fails (e.g. 404 if not implemented yet), we just hide model details silently
          setModelStatus(null);
        }

      } catch (err) {
        setStatus('offline');
        setModelStatus(null);
      }
    };

    checkHealth();
    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-xs font-mono">
      {status === 'checking' && (
        <span className="flex items-center text-[var(--color-text-secondary)]">
          <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Checking backend...
        </span>
      )}
      {status === 'offline' && (
        <span className="flex items-center text-[var(--color-error-text)]" title="Cannot reach backend. Check if it's running.">
          <span className="w-2 h-2 rounded-full bg-[var(--color-error-border)] mr-1.5 animate-pulse"></span>
          Backend Offline
        </span>
      )}
      {status === 'online' && data && (
        <div className="flex items-center text-[var(--color-text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-badge-beginner-text)] mr-1.5"></span>
          <span className="mr-3">API Online</span>
          
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-code-bg)] text-[var(--color-code-text)]">
            {data.model}
            {modelStatus && (
              <span className={`ml-2 inline-flex items-center ${modelStatus.ok ? 'text-[var(--color-badge-beginner-text)]' : 'text-[var(--color-error-text)]'}`}>
                {modelStatus.ok ? ' (Model OK)' : ` (Model error${modelStatus.detail ? `: ${modelStatus.detail}` : ''})`}
              </span>
            )}
          </span>
          {data.fixture_mode && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-[var(--color-badge-intermediate-bg)] text-[var(--color-badge-intermediate-text)] border border-[var(--color-border-soft)]">
              Mock Data
            </span>
          )}
        </div>
      )}
    </div>
  );
}
