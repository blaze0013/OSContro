import { useState, useEffect, useRef } from 'react';
import type { AnalyzeResponse } from '../../types/api';
import { ArchitectureCard } from './ArchitectureCard';
import { ContributionsList } from './ContributionsList';
import { ScreenshotDiagnosisCard } from './ScreenshotDiagnosisCard';
import { PRChecklist } from './PRChecklist';
import { WarningsPanel } from './WarningsPanel';
import { FloatingTiles } from '../FloatingTiles';
import { EchoText } from '../EchoText';
import { useTheme } from '../../lib/theme';

interface ResultsUIProps {
  result: AnalyzeResponse;
  fileUrl?: string;
  onReset: () => void;
}

export function ResultsUI({ result, fileUrl, onReset }: ResultsUIProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('architecture');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [pulsingSection, setPulsingSection] = useState<string | null>(null);

  const sectionRefs = {
    architecture: useRef<HTMLDivElement>(null),
    diagnosis: useRef<HTMLDivElement>(null),
    contributions: useRef<HTMLDivElement>(null),
    checklist: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    // Reveal sections as they enter viewport with a subtle staggered fade-up
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) {
              setVisibleSections((prev) => new Set(prev).add(id));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Active section spy for jump nav
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) {
              setActiveSection(id);
            }
          }
        });
      },
      { rootMargin: '-20% 0px -55% 0px' }
    );

    const elements = [
      sectionRefs.architecture.current,
      sectionRefs.diagnosis.current,
      sectionRefs.contributions.current,
      sectionRefs.checklist.current,
    ].filter(Boolean) as HTMLElement[];

    elements.forEach((el) => {
      revealObserver.observe(el);
      spyObserver.observe(el);
    });

    return () => {
      revealObserver.disconnect();
      spyObserver.disconnect();
    };
  }, [result.screenshot_diagnosis.available]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setPulsingSection(id);
      setTimeout(() => setPulsingSection(null), 650);
    }
  };

  const navItems = [
    { id: 'architecture', label: 'Architecture' },
    ...(result.screenshot_diagnosis.available ? [{ id: 'diagnosis', label: 'Diagnosis' }] : []),
    { id: 'contributions', label: 'Contributions' },
    { id: 'checklist', label: 'PR Checklist' },
  ];

  const isMockData = import.meta.env.VITE_USE_MOCK === 'true' || result.meta?.source === 'fixture';

  return (
    <div className="w-full relative">
      {/* Decorative floating margin tiles behind content */}
      <FloatingTiles variant="results" />

      {/* Results Header: Button positioned TOP-LEFT, above title, left-aligned, stacked layout */}
      <div className="flex flex-col items-start gap-4 mb-8 relative z-10">
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--color-raised)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:ring-2 active:ring-[var(--color-accent)]/30 transition-all shadow-[var(--shadow-warm)] cursor-pointer btn-press"
        >
          <svg className="w-4 h-4 mr-2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Analyze another repo
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center">
              <EchoText
                text="Analysis Results"
                echoes={3}
                offset={10}
                blur={1}
                fontSize="1.5rem"
                fontWeight={700}
                color="var(--color-text-primary)"
                tint={isDark ? '#E5A866' : '#8C5A2B'}
                echoColors={isDark ? ['#3D322A', '#D48F4E'] : ['#DDD0BC', '#8C5A2B']}
                mode="entrance"
                clickBurst={false}
              />
            </h2>
            {isMockData && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-badge-intermediate-bg)] text-[var(--color-badge-intermediate-text)] border border-[var(--color-border-soft)]">
                Mock Data
              </span>
            )}
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Review the architecture and suggested contributions.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
        {/* Main Content Area with Staggered Viewport Reveal */}
        <div className="w-full lg:w-3/4 space-y-10 order-2 lg:order-1">
          <div 
            ref={sectionRefs.architecture}
            data-section-id="architecture"
            className={`reveal-item ${visibleSections.has('architecture') ? 'is-visible' : ''} ${
              pulsingSection === 'architecture' ? 'section-highlight-pulse' : ''
            }`}
            style={{ transitionDelay: '0ms' }}
          >
            <ArchitectureCard repository={result.repository} architecture={result.architecture} />
          </div>
          
          {result.screenshot_diagnosis.available && (
            <div 
              ref={sectionRefs.diagnosis}
              data-section-id="diagnosis"
              className={`reveal-item ${visibleSections.has('diagnosis') ? 'is-visible' : ''} ${
                pulsingSection === 'diagnosis' ? 'section-highlight-pulse' : ''
              }`}
              style={{ transitionDelay: '80ms' }}
            >
              <ScreenshotDiagnosisCard 
                diagnosis={result.screenshot_diagnosis} 
                fileUrl={fileUrl} 
              />
            </div>
          )}
          
          <div 
            ref={sectionRefs.contributions}
            data-section-id="contributions"
            className={`reveal-item ${visibleSections.has('contributions') ? 'is-visible' : ''} ${
              pulsingSection === 'contributions' ? 'section-highlight-pulse' : ''
            }`}
            style={{ transitionDelay: '160ms' }}
          >
            <ContributionsList contributions={result.contributions} />
          </div>
          
          <div 
            ref={sectionRefs.checklist}
            data-section-id="checklist"
            className={`reveal-item ${visibleSections.has('checklist') ? 'is-visible' : ''} ${
              pulsingSection === 'checklist' ? 'section-highlight-pulse' : ''
            }`}
            style={{ transitionDelay: '240ms' }}
          >
            <PRChecklist items={result.pr_checklist} />
          </div>
        </div>

        {/* Sidebar Area with Active Section Highlight */}
        <div className="w-full lg:w-1/4 sticky top-6 space-y-6 order-1 lg:order-2">
          {/* Section Nav */}
          <nav className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-soft)] p-4 shadow-[var(--shadow-warm)] hidden lg:block card-sweep">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Jump to</h3>
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left text-sm py-1.5 px-2 rounded-md transition-all flex items-center cursor-pointer btn-press hover:-translate-y-0.5 active:scale-[0.98] ${
                        isActive
                          ? 'text-[var(--color-accent)] font-semibold bg-[var(--color-raised)] shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-page)]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2.5 transition-all ${
                        isActive 
                          ? 'bg-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 scale-125' 
                          : 'bg-[var(--color-border-strong)]'
                      }`} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Warnings & Meta Info */}
          <WarningsPanel warnings={result.warnings} meta={result.meta} />
        </div>
      </div>
    </div>
  );
}
