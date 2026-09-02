import { Info } from 'lucide-react';

export function InfoBadge({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Info }) {
  return (
    <div className="glass-chip px-3 py-2 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-teal-600" />}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-sm font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
