import { MapPin, Building2, Train, type LucideIcon } from 'lucide-react';
import { useCountUp, usePrefersReducedMotion } from '@/shared/hooks';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  color?: string;
  delay?: number;
}

function MetricCard({ icon: Icon, label, value, unit, decimals = 0, color = '#0d9488', delay = 0 }: MetricCardProps) {
  const reduced = usePrefersReducedMotion();
  const animated = useCountUp(reduced ? value : value, 800, delay);
  return (
    <div className="glass p-4 card-hover fade-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {animated.toFixed(decimals)}
        <span className="text-sm font-semibold text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}

interface ReachabilitySummaryProps {
  areaKm2: number;
  serviceCount: number;
  stopCount: number;
}

export function ReachabilitySummary({ areaKm2, serviceCount, stopCount }: ReachabilitySummaryProps) {
  return (
    <div className="absolute top-20 right-4 sm:right-6 flex flex-col gap-3 w-[200px] sm:w-[220px]">
      <MetricCard icon={MapPin} label="Reachable Area" value={areaKm2} unit="km²" decimals={1} />
      <MetricCard icon={Building2} label="Services" value={serviceCount} unit="" delay={80} color="#e11d48" />
      <MetricCard icon={Train} label="Transit Stops" value={stopCount} unit="" delay={160} color="#2563eb" />
    </div>
  );
}
