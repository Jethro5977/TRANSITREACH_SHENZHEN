import { useMemo } from 'react';
import { TRANSIT_LINES } from '@/shared/data';
import type { MapPoint } from '@/shared/types/location';
import { findNearbyStops, getStopsForModes } from '../firstMileService';

export function useFirstMile(origin: MapPoint, modes: Set<string>) {
  const allStops = useMemo(() => getStopsForModes(TRANSIT_LINES, modes), [modes]);
  const nearbyStops = useMemo(() => findNearbyStops(origin, allStops, 80), [origin, allStops]);
  return { allStops, nearbyStops };
}
