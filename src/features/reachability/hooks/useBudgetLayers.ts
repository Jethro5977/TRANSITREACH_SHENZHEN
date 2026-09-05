import { useEffect, useState } from 'react';
import { computeReachability, type IsochroneResult } from '@/shared/data/adapters/routingAdapter';
import type { DepartureProfileId } from '@/shared/data/shenzhen/timetable';
import type { Origin } from '../types';

export function useBudgetLayers(origin: Origin | null, profile: DepartureProfileId, enabled: boolean) {
  const key = origin ? `${origin.at.lat},${origin.at.lon},${profile}` : '';
  const [snapshot, setSnapshot] = useState<{ key: string; results: IsochroneResult[]; pending: boolean; error: boolean }>({ key: '', results: [], pending: false, error: false });
  useEffect(() => {
    if (!origin || !enabled) return;
    const controller = new AbortController();
    setSnapshot({ key, results: [], pending: true, error: false });
    void (async () => {
      const results: IsochroneResult[] = [];
      try {
        for (const budget of [60, 45, 30, 15]) {
          const { result } = await computeReachability(origin.at, budget, profile, controller.signal);
          if (controller.signal.aborted) return;
          results.push(result);
        }
        setSnapshot({ key, results, pending: false, error: false });
      } catch {
        if (!controller.signal.aborted) setSnapshot({ key, results: [], pending: false, error: true });
      }
    })();
    return () => controller.abort();
  }, [key, origin, profile, enabled]);
  return enabled && key && snapshot.key === key ? snapshot : { results: [], pending: false, error: false };
}
