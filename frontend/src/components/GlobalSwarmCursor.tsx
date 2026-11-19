import { useEffect, useState } from 'react';
import SwarmCursor from './SwarmCursor';
import { useTheme } from '../lib/theme';

export function GlobalSwarmCursor() {
  const { theme } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkEligibility = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isSmallScreen = window.innerWidth < 768;
      setIsEnabled(!isTouch && !prefersReduced && !isSmallScreen);
    };

    checkEligibility();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: coarse)');

    const handleMotionChange = () => checkEligibility();
    const handlePointerChange = () => checkEligibility();
    const handleResize = () => checkEligibility();

    motionQuery.addEventListener('change', handleMotionChange);
    pointerQuery.addEventListener('change', handlePointerChange);
    window.addEventListener('resize', handleResize);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      pointerQuery.removeEventListener('change', handlePointerChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <SwarmCursor
        count={26}
        size={2.5}
        shape="dot"
        color={isDark ? '#E5A866' : '#8C5A2B'}
        accentColor={isDark ? '#F5D27E' : '#D48F4E'}
        spread={15}
        speed={1.1}
        idle="roam"
        clickEffect="burst"
        hideCursor={false}
        enabled={isEnabled}
        lightMode={!isDark}
        className="pointer-events-none h-full w-full"
      />
    </div>
  );
}
