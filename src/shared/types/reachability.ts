import type { MapPoint, SearchResult } from './location';

export interface ReachabilityResult {
  location: SearchResult;
  origin: MapPoint;
  timeBudgetMinutes: number;
  polygon: MapPoint[];
  areaKm2: number;
}
