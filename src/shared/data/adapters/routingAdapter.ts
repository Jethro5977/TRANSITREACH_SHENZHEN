import type { DepartureProfileId } from '../shenzhen/timetable';
import type { ReachabilityComputation } from './routingEstimator';
import { COMPUTATION_TIMEOUT_MS } from './routingConfig';

export type { IsochroneRegion, IsochroneResult, ReachableStation, ReachabilityComputation } from './routingEstimator';

export class RoutingTimeoutError extends Error {
  constructor(readonly limitMs: number) {
    super(`Reachability computation exceeded ${limitMs} ms.`);
    this.name = 'RoutingTimeoutError';
  }
}

// Each request owns a worker, allowing cancellation to stop CPU work immediately.
export function computeReachability(
  origin: { lat: number; lon: number }, budgetMinutes: number,
  profile: DepartureProfileId, signal: AbortSignal,
): Promise<ReachabilityComputation> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const worker = new Worker(new URL('./routing.worker.ts', import.meta.url), { type: 'module' });
    // The outer deadline also bounds cold loading of the barrier snapshot.
    const loadLimitMs = 20_000;
    const timer = setTimeout(() => { cleanup(); reject(new RoutingTimeoutError(loadLimitMs)); }, loadLimitMs);
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = event => {
      cleanup();
      if (event.data.error === 'timeout') reject(new RoutingTimeoutError(COMPUTATION_TIMEOUT_MS));
      else if (event.data.error) reject(new Error('无法计算可达范围'));
      else resolve(event.data.result);
    };
    worker.onerror = () => { cleanup(); reject(new Error('可达范围计算线程未能启动')); };
    worker.postMessage({ origin, budgetMinutes, profile });
  });
}
