import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

// Staggered reveal helper
export function useStaggeredReveal(count: number, interval = 60, startDelay = 0) {
  const [visibleCount, setVisibleCount] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setVisibleCount(count);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= count) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [count, interval, prefersReduced]);

  return visibleCount;
}
