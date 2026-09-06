import { computeReachability, RoutingTimeoutError } from './routingEstimator';
import type { DepartureProfileId } from '../shenzhen/timetable';

self.onmessage = async (event: MessageEvent<{
  origin: { lat: number; lon: number }; budgetMinutes: number; profile: DepartureProfileId;
}>) => {
  const { origin, budgetMinutes, profile } = event.data;
  try {
    const result = await computeReachability(origin, budgetMinutes, profile, new AbortController().signal);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof RoutingTimeoutError ? 'timeout' : 'unavailable' });
  }
};
