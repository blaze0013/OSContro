import { BackendStatus } from './BackendStatus';
import { useAuth } from '../lib/auth';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Simple inline SVG logo */}
        <svg
          className="w-8 h-8 text-[var(--color-accent)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">OSContro</h1>
          <p className="text-xs text-[var(--color-text-secondary)] font-medium tracking-wide hidden sm:block">Find your first open-source contribution</p>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <BackendStatus />
        
        {user && (
          <div className="flex items-center space-x-4 border-l border-[var(--color-border-strong)] pl-6">
            <div className="flex items-center space-x-2 hidden sm:flex">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full bg-[var(--color-raised)]" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-[var(--color-accent-text)]">
                  {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
