import { useAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';

export function LoginScreen() {
  const { signInWithGoogle, signInWithGitHub, error, loading } = useAuth();
  const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-page)] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const showNotConfigured = !USE_MOCK && !isFirebaseConfigured;

  return (
    <div className="min-h-screen bg-[var(--color-page)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border-soft)] rounded-[12px] p-8 shadow-[var(--shadow-warm-md)] text-center">
        
        <div className="flex justify-center mb-6">
          <svg
            className="w-12 h-12 text-[var(--color-accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">OSContro</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">Find your first open-source contribution.</p>

        {showNotConfigured && (
          <div className="bg-[var(--color-notice-bg)] border border-[var(--color-notice-border)] text-[var(--color-notice-text)] text-sm p-4 rounded-lg mb-6">
            Firebase is not configured. Please set the VITE_FIREBASE_* environment variables or enable VITE_USE_MOCK=true.
          </div>
        )}

        {error && (
          <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error-text)] text-sm p-4 rounded-lg mb-6 text-left">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            disabled={showNotConfigured}
            className="w-full flex items-center justify-center px-4 py-3 border border-[var(--color-border-strong)] rounded-lg shadow-[var(--shadow-warm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={signInWithGitHub}
            disabled={showNotConfigured}
            className="w-full flex items-center justify-center px-4 py-3 border border-[var(--color-border-strong)] rounded-lg shadow-[var(--shadow-warm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <p className="mt-8 text-xs text-[var(--color-text-secondary)]">
          We only use your account to sign you in.
        </p>
      </div>
    </div>
  );
}
