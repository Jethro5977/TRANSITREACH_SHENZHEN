import type { ReactNode } from 'react';

export function PageTransition({ children, pageKey }: { children: ReactNode; pageKey: string }) {
  return (
    <div key={pageKey} className="page-enter">
      {children}
    </div>
  );
}
