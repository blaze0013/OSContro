import { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { RepoInput } from './RepoInput';
import { ScreenshotUpload } from './ScreenshotUpload';
import { LoadingState } from './LoadingState';
import { FloatingTiles } from './FloatingTiles';
import { EchoText } from './EchoText';
import { Topography } from './Topography';
import { useTheme } from '../lib/theme';
import { validateGithubUrl } from '../lib/validation';
import { analyze, ApiRequestError, API_BASE_URL } from '../lib/api';
import { ResultsUI } from './results/ResultsUI';
import { useAuth } from '../lib/auth';
import type { AnalyzeResponse } from '../types/api';

const getFriendlyErrorMessage = (code: string, message: string): string => {
  switch (code) {
    case 'INVALID_URL':
      return 'The URL provided does not look like a valid GitHub repository. Please provide a URL like https://github.com/owner/repo.';
    case 'REPO_NOT_FOUND':
      return 'We could not find that repository. It might be private, misspelled, or deleted.';
    case 'GITHUB_RATE_LIMIT':
      return 'GitHub API rate limit exceeded. Please wait a few minutes and try again.';
    case 'IMAGE_INVALID':
      return 'The screenshot file type is not supported. Please use PNG, JPEG, or WEBP.';
    case 'IMAGE_TOO_LARGE':
      return 'The screenshot is too large. Please upload an image smaller than 5MB.';
    case 'MODEL_ERROR':
      return message || 'The AI model encountered an unexpected error while analyzing the repository. Please try again.';
    case 'MODEL_INVALID_OUTPUT':
      return message || 'The AI model returned an invalid response format. Please try analyzing the repository again.';
    case 'UNAUTHENTICATED':
      return 'Your session expired. Please sign in again.';
    case 'INTERNAL':
    default:
      return message || 'An unexpected server error occurred. Please try again later.';
  }
};

interface ErrorState {
  code: string;
  message: string;
  detail?: string;
  status?: number;
  timestamp?: string;
}

export function MainScreen() {
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  const [isExitingResults, setIsExitingResults] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setFileUrl(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    } else {
      setFileUrl(undefined);
    }
  }, [file]);

  const urlError = validateGithubUrl(url);
  const isFormValid = url.trim() !== '' && !urlError;

  const handleAnalyze = async () => {
    if (!isFormValid) return;

    const newReqId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setRequestId(newReqId);
    setIsLoading(true);
    setError(null);
    setShowErrorDetails(false);
    setResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await analyze(url, file || undefined, {
        signal: abortControllerRef.current.signal
      });
      setResult(response);
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err.name === 'AbortError') {
        // User cancelled
      } else if (err instanceof ApiRequestError) {
        setError({
          code: err.code,
          message: getFriendlyErrorMessage(err.code, err.message),
          detail: err.detail,
          status: err.status,
          timestamp: err.timestamp
        });
        if (err.code === 'UNAUTHENTICATED') {
          signOut();
        }
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError({ 
          code: 'NETWORK_ERROR', 
          message: 'Cannot reach backend. Check the backend is running, both laptops are on the same network, and the URL is correct.',
          timestamp: new Date().toISOString()
        });
      } else {
        setError({ 
          code: 'UNKNOWN', 
          message: 'An unexpected error occurred. Please try again.',
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const reset = () => {
    setUrl('');
    setFile(null);
    setResult(null);
    setError(null);
    setShowErrorDetails(false);
    setRequestId('');
  };

  const handleReset = () => {
    setIsExitingResults(true);
    setTimeout(() => {
      reset();
      setIsExitingResults(false);
    }, 240);
  };

  const copyErrorDetails = () => {
    if (!error) return;
    const text = `Code: ${error.code}\nStatus: ${error.status || 'N/A'}\nMessage: ${error.message}\nDetail: ${error.detail || 'None'}\nTimestamp: ${error.timestamp}\nBackend URL: ${API_BASE_URL}`;
    navigator.clipboard.writeText(text);
    setCopiedDetails(true);
    setTimeout(() => setCopiedDetails(false), 2000);
  };

  if (result) {
    return (
      <div className={`min-h-screen flex flex-col ${isExitingResults ? 'screen-exit-anim' : 'screen-enter-anim'}`}>
        <Header metaSource={result.meta?.source} />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <ResultsUI
            key={`${result.repository.url}-${requestId}`}
            result={result}
            fileUrl={fileUrl}
            onReset={handleReset}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col screen-enter-anim relative overflow-hidden bg-[var(--color-page)]">
      {/* Topography animated background - kept subtle so text and inputs stay completely readable */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 dark:opacity-35 -z-0" aria-hidden="true">
        <Topography
          color={isDark ? '#D48F4E' : '#8C5A2B'}
          lineCount={22}
          lineWidth={1}
          speed={0.2}
          elevation={1.3}
          tilt={0.25}
          opacity={isDark ? 0.35 : 0.25}
          mouseInteraction={true}
          mouseRadius={130}
          lightMode={!isDark}
          className="w-full h-full"
        />
      </div>

      <Header />
      
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col pt-10 sm:pt-16 relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-2">
            <EchoText
              text="Ready to contribute?"
              echoes={4}
              offset={14}
              blur={1.5}
              fontSize="clamp(2rem, 5vw, 2.75rem)"
              fontWeight={800}
              color="var(--color-text-primary)"
              tint={isDark ? '#E5A866' : '#8C5A2B'}
              echoColors={isDark ? ['#3D322A', '#D48F4E'] : ['#DDD0BC', '#8C5A2B']}
              mode="entrance"
              clickBurst={false}
              className="tracking-tight"
            />
          </div>
          <p className="mt-2 text-base sm:text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Paste a public GitHub repository and we'll analyze it to find the perfect beginner-friendly contribution for you.
          </p>
        </div>

        <div className="relative">
          {/* Background layer of soft decorative floating tiles */}
          <FloatingTiles variant="input" />

          {/* Subtle floating amber dots behind card */}
          <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-[var(--color-accent)] opacity-[0.06] blur-xl pointer-events-none dot-drift-1" />
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-[var(--color-accent)] opacity-[0.08] blur-xl pointer-events-none dot-drift-2" />
          <div className="absolute top-1/2 -right-5 w-3 h-3 rounded-full bg-[#E5A866] opacity-35 blur-[1px] pointer-events-none dot-orbit" />
          <div className="absolute top-1/4 -left-4 w-2.5 h-2.5 rounded-full bg-[#D48F4E] opacity-30 blur-[1px] pointer-events-none dot-drift-1" />
          <div className="absolute -bottom-3 left-1/3 w-2 h-2 rounded-full bg-[#B3743B] opacity-25 pointer-events-none dot-drift-2" />

          <div className="relative bg-[var(--color-surface)] border border-[var(--color-border-soft)] rounded-[12px] p-6 sm:p-8 space-y-8 shadow-[var(--shadow-warm-md)] card-sweep">
            <RepoInput 
              url={url} 
              onChange={setUrl} 
              error={url !== '' ? urlError : null} 
              disabled={isLoading}
            />

            <div className="h-px bg-[var(--color-border-soft)]" />

            <ScreenshotUpload 
              file={file} 
              onChange={setFile} 
              disabled={isLoading}
            />

            {error && (
              <div className="rounded-[12px] bg-[var(--color-error-bg)] p-4 border border-[var(--color-error-border)] error-card-anim">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-[var(--color-error-text)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--color-error-text)]">Analysis failed (Code: {error.code})</h3>
                    <div className="mt-2 text-sm text-[var(--color-error-text)] opacity-90 leading-relaxed">
                      <p>{error.message}</p>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <button
                        onClick={handleAnalyze}
                        className="text-sm font-semibold text-[var(--color-error-text)] hover:opacity-80 underline underline-offset-2 transition-opacity"
                      >
                        Try again
                      </button>
                      <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="text-sm font-medium text-[var(--color-error-text)] opacity-75 hover:opacity-100 flex items-center transition-opacity"
                      >
                        {showErrorDetails ? 'Hide details' : 'Technical details'}
                        <svg className={`ml-1 w-4 h-4 transform transition-transform ${showErrorDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {showErrorDetails && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-error-border)] animate-in fade-in slide-in-from-top-2">
                        <div className="bg-[var(--color-surface)] rounded-[8px] p-3 text-xs font-mono text-[var(--color-text-primary)] border border-[var(--color-border-soft)] overflow-x-auto relative shadow-[var(--shadow-warm)]">
                          <button
                            onClick={copyErrorDetails}
                            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-[var(--color-page)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-soft)] shadow-sm bg-[var(--color-surface)]"
                            title="Copy details"
                          >
                            {copiedDetails ? (
                              <svg className="w-3.5 h-3.5 text-[var(--color-badge-beginner-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                          <div className="space-y-1.5 pr-8">
                            <div><span className="font-semibold text-[var(--color-text-secondary)]">Code:</span> {error.code}</div>
                            {error.status && <div><span className="font-semibold text-[var(--color-text-secondary)]">HTTP Status:</span> {error.status}</div>}
                            <div><span className="font-semibold text-[var(--color-text-secondary)]">Message:</span> {error.message}</div>
                            {error.detail && <div><span className="font-semibold text-[var(--color-text-secondary)]">Detail:</span> <span className="text-[var(--color-error-text)]">{error.detail}</span></div>}
                            {error.timestamp && <div><span className="font-semibold text-[var(--color-text-secondary)]">Timestamp:</span> {error.timestamp}</div>}
                            <div><span className="font-semibold text-[var(--color-text-secondary)]">Backend API:</span> {API_BASE_URL}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleAnalyze}
                disabled={!isFormValid || isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-[8px] shadow-[var(--shadow-warm)] text-sm font-bold text-[var(--color-accent-text)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm-md)] active:translate-y-0 active:scale-[0.98] active:ring-2 active:ring-[var(--color-accent)]/30 disabled:bg-[var(--color-raised)] disabled:text-[var(--color-text-secondary)] disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none transition-all duration-150 cursor-pointer btn-press"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Repository'}
              </button>
            </div>
          </div>
        </div>

        {isLoading && <LoadingState onCancel={handleCancel} />}
      </main>
    </div>
  );
}
