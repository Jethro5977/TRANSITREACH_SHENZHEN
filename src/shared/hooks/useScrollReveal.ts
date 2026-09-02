import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-triggered reveal.
 *
 * Callers hide the element until `visible` turns true, so anything that keeps this false
 * stays invisible with no error in the console — the page simply looks blank. Two
 * safeguards against that:
 *
 * - `threshold: 0` fires as soon as any part of the element enters the viewport. The
 *   previous 0.15 could never be met by an element taller than about 6.5x the viewport,
 *   because its maximum possible intersection ratio is viewportHeight / elementHeight.
 * - If IntersectionObserver is unavailable, reveal immediately rather than never.
 *
 * The bias is deliberate: failing to animate is a cosmetic problem, failing to show the
 * content is not.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
