import { X } from 'lucide-react';
import type { Toast } from '@/shared/hooks/useToasts';

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-strong px-4 py-3 flex items-center gap-3 toast-enter pointer-events-auto"
          style={{ borderRadius: 12 }}
        >
          {toast.icon && <span className="text-teal-600 font-bold">{toast.icon}</span>}
          <span className="text-sm font-semibold text-slate-700">{toast.message}</span>
          <button
            onClick={() => onClose(toast.id)}
            className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
