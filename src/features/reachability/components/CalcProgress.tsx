import { Loader2, Check } from 'lucide-react';

interface CalcProgressProps {
  step: number;
  steps: string[];
}

export function CalcProgress({ step, steps }: CalcProgressProps) {
  return (
    <div className="space-y-2 fade-in">
      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors duration-200 ${
              i < step ? 'text-teal-600' : i === step ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            {i < step ? (
              <Check size={12} className="text-teal-600" />
            ) : i === step ? (
              <Loader2 size={12} className="spinner" />
            ) : (
              <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
            )}
            <span className="hidden sm:inline">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
