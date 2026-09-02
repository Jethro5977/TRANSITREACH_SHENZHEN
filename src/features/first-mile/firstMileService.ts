import type { MapPoint } from '@/shared/types/location';
import type { TransitLine } from '@/shared/types/transit';

export function getStopsForModes(lines: TransitLine[], modes: Set<string>): MapPoint[] {
  const stops: MapPoint[] = [];
  lines.forEach(line => {
    if (modes.has(line.type)) line.stops.forEach(stop => stops.push(stop.pos));
  });
  return stops;
}

// Prototype-only Euclidean search. Epic 3 should replace this with pedestrian-network routing.
export function findNearbyStops(origin: MapPoint, stops: MapPoint[], radius = 80): MapPoint[] {
  return stops.filter(stop => Math.hypot(stop.x - origin.x, stop.y - origin.y) <= radius);
}
