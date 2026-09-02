import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm fade-in" onClick={onClose} />
      <div
        className="relative glass-strong p-6 max-w-md w-full fade-slide-up"
        style={{ animation: 'pageEnter 300ms ease-out, fadeIn 300ms ease-out' }}
      >
        {children}
      </div>
    </div>
  );
}
