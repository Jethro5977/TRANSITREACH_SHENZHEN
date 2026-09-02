import { useCountUp } from '@/shared/hooks';

export function ServiceSummary({ total }: { total: number }) {
  const count = useCountUp(total, 600, 0);
  return <div className="text-2xl font-bold text-slate-900">{Math.round(count)}</div>;
}
