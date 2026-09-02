import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900/92 text-white text-xs font-semibold whitespace-nowrap z-50 fade-in`}
          style={{ animationDuration: '150ms' }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
