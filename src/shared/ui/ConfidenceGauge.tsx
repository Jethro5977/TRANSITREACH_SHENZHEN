export function ConfidenceGauge({ grade, score }: { grade: string; score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="w-10 h-10">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 94.2} 94.2`}
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 600ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {grade}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase">Confidence</div>
        <div className="text-sm font-bold text-slate-700">{score}%</div>
      </div>
    </div>
  );
}
