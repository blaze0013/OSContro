import { useEffect, useState } from 'react';

interface FloatingTilesProps {
  variant?: 'input' | 'results';
}

export function FloatingTiles({ variant = 'input' }: FloatingTilesProps) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check if mouse/hover is supported and user doesn't prefer reduced motion
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinePointer || prefersReducedMotion) return;

    let rafId: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      // Normalize from -1 to 1
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;

      if (rafId === null) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    const updateParallax = () => {
      // Gentle lerp for low-overhead smooth shift
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      // Max shift: 6px
      setParallax({
        x: Math.round(currentX * 6 * 10) / 10,
        y: Math.round(currentY * 6 * 10) / 10,
      });

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        rafId = requestAnimationFrame(updateParallax);
      } else {
        rafId = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  if (variant === 'results') {
    return (
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 hidden xl:block"
        aria-hidden="true"
        style={{
          transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)`,
          willChange: 'transform'
        }}
      >
        {/* Left gutter tile 1 */}
        <div 
          className="absolute -left-12 top-48 w-16 h-14 rounded-xl border border-[var(--color-border-soft)]/50 bg-[var(--color-surface)]/60 shadow-sm p-3 flex items-center justify-center text-[var(--color-text-secondary)] opacity-35 tile-drift-1"
        >
          <svg className="w-5 h-5 text-[var(--color-accent)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>

        {/* Left gutter tile 2 */}
        <div 
          className="absolute -left-8 top-[36rem] w-14 h-14 rounded-xl border border-[var(--color-border-soft)]/50 bg-[var(--color-raised)]/50 shadow-sm p-3 flex items-center justify-center text-[var(--color-text-secondary)] opacity-30 tile-drift-3"
        >
          <svg className="w-5 h-5 text-[var(--color-accent)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Right gutter tile 1 */}
        <div 
          className="absolute -right-10 top-64 w-16 h-12 rounded-xl border border-[var(--color-border-soft)]/50 bg-[var(--color-surface)]/60 shadow-sm p-3 flex items-center justify-center text-[var(--color-text-secondary)] opacity-35 tile-drift-2"
        >
          <svg className="w-5 h-5 text-[var(--color-accent)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10M7 11h7m-7 4h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        </div>

        {/* Right gutter tile 2 */}
        <div 
          className="absolute -right-8 top-[40rem] w-14 h-14 rounded-xl border border-[var(--color-border-soft)]/50 bg-[var(--color-raised)]/50 shadow-sm p-3 flex items-center justify-center text-[var(--color-text-secondary)] opacity-30 tile-drift-4"
        >
          <svg className="w-5 h-5 text-[var(--color-accent)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    );
  }

  // Input screen variant: 7-8 soft floating tiles
  return (
    <div 
      className="absolute -inset-10 sm:-inset-16 pointer-events-none select-none z-0 hidden sm:block"
      aria-hidden="true"
      style={{
        transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
        willChange: 'transform'
      }}
    >
      {/* Tile 1: Top-left code brackets */}
      <div 
        className="absolute -top-6 -left-6 sm:-left-10 w-16 h-14 rounded-2xl border border-[var(--color-border-soft)]/60 bg-[var(--color-surface)]/80 shadow-sm p-3 flex items-center justify-center text-[var(--color-accent)] opacity-70 tile-drift-1"
        style={{ animationDelay: '0s' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>

      {/* Tile 2: Top-right git branch */}
      <div 
        className="absolute -top-8 -right-4 sm:-right-8 w-14 h-14 rounded-2xl border border-[var(--color-border-soft)]/60 bg-[var(--color-raised)]/70 shadow-sm p-3 flex items-center justify-center text-[var(--color-accent)] opacity-65 tile-drift-2"
        style={{ animationDelay: '1.2s' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>

      {/* Tile 3: Mid-left verified checkmark */}
      <div 
        className="absolute top-1/3 -left-8 sm:-left-14 w-12 h-12 rounded-xl border border-[var(--color-border-soft)]/60 bg-[var(--color-surface)]/80 shadow-sm p-2.5 flex items-center justify-center text-[var(--color-badge-beginner-text)] opacity-60 tile-drift-3"
        style={{ animationDelay: '2.5s' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Tile 4: Mid-right file / document */}
      <div 
        className="absolute top-1/2 -right-6 sm:-right-12 w-14 h-16 rounded-2xl border border-[var(--color-border-soft)]/60 bg-[var(--color-surface)]/80 shadow-sm p-3 flex items-center justify-center text-[var(--color-text-secondary)] opacity-65 tile-drift-4"
        style={{ animationDelay: '0.8s' }}
      >
        <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      {/* Tile 5: Bottom-left terminal prompt */}
      <div 
        className="absolute -bottom-8 -left-4 sm:-left-8 w-14 h-12 rounded-xl border border-[var(--color-border-soft)]/60 bg-[var(--color-raised)]/70 shadow-sm p-2.5 flex items-center justify-center text-[var(--color-text-secondary)] opacity-60 tile-drift-1"
        style={{ animationDelay: '3.4s' }}
      >
        <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
        </svg>
      </div>

      {/* Tile 6: Bottom-right compass / explore */}
      <div 
        className="absolute -bottom-10 -right-6 sm:-right-10 w-16 h-14 rounded-2xl border border-[var(--color-border-soft)]/60 bg-[var(--color-surface)]/80 shadow-sm p-3 flex items-center justify-center text-[var(--color-accent)] opacity-70 tile-drift-2"
        style={{ animationDelay: '1.8s' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 8l-2.5 5.5L8 16l2.5-5.5L16 8z" />
        </svg>
      </div>

      {/* Tile 7: Top-center subtle badge */}
      <div 
        className="absolute -top-12 left-1/4 w-10 h-10 rounded-lg border border-[var(--color-border-soft)]/50 bg-[var(--color-raised)]/60 shadow-sm p-2 flex items-center justify-center text-[var(--color-text-secondary)] opacity-50 tile-drift-3"
        style={{ animationDelay: '4.1s' }}
      >
        <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
    </div>
  );
}

