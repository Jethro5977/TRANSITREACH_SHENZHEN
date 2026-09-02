import { useRef } from 'react';

// Generate unique ID
export function useId(prefix = 'id'): string {
  const ref = useRef(`${prefix}-${Math.random().toString(36).slice(2, 9)}`);
  return ref.current;
}
