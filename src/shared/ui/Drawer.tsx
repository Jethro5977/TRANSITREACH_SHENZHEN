import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  width?: string;
}

export function Drawer({ open, onClose, children, title, width = '420px' }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="absolute top-0 right-0 bottom-0 glass-strong drawer-enter overflow-y-auto scrollbar-thin"
        style={{ width, maxWidth: '100vw' }}
      >
        {title && (
          <div className="sticky top-0 glass-strong px-6 py-4 flex items-center justify-between border-b border-slate-200/50 z-10">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="btn-icon" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
