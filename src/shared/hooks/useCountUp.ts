import { useEffect, useRef, useState } from 'react';


// Count-up animation hook
export function useCountUp(target: number, duration = 800, delay = 0): number {
  const [value, setValue] = useState(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReduced.current) {
      setValue(target);
      return;
    }
    let raf: number;
    let start: number | null = null;
    const startTime = performance.now() + delay;

    const animate = (now: number) => {
      if (now < startTime) {
        raf = requestAnimationFrame(animate);
        return;
      }
      if (start === null) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}
