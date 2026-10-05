import { EXAMPLE_REPOS } from '../lib/constants';

interface RepoInputProps {
  url: string;
  onChange: (url: string) => void;
  error: string | null;
  disabled?: boolean;
}

export function RepoInput({ url, onChange, error, disabled }: RepoInputProps) {
  return (
    <div className="space-y-3">
      <label htmlFor="repo-url" className="block text-sm font-semibold text-[var(--color-text-primary)]">
        GitHub Repository URL
      </label>
      <div className="relative">
        <input
          id="repo-url"
          type="text"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://github.com/owner/repo"
          className={`block w-full rounded-md border-0 py-3 px-4 bg-[var(--color-page)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
            error
              ? 'ring-[var(--color-error-border)] focus:ring-[var(--color-error-border)] placeholder:text-[var(--color-error-text)]'
              : 'ring-[var(--color-border-soft)] focus:ring-[var(--color-accent)] placeholder:text-[var(--color-text-secondary)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--color-error-text)]" id="repo-url-error">
            {error}
          </p>
        )}
      </div>

      <div className="pt-2">
        <p className="text-xs text-[var(--color-text-secondary)] mb-2 font-medium">Try an example repository:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_REPOS.map((exampleUrl) => {
            const shortName = exampleUrl.replace('https://github.com/', '');
            return (
              <button
                key={exampleUrl}
                type="button"
                disabled={disabled}
                onClick={() => onChange(exampleUrl)}
                className="inline-flex items-center rounded-full bg-[var(--color-page)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)] ring-1 ring-inset ring-[var(--color-border-soft)] hover:bg-[var(--color-raised)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {shortName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
