import type { TransitLine } from '@/shared/types/transit';
import { SHENZHEN_BOUNDS, SHENZHEN_METRO_LINES, SHENZHEN_METRO_STOPS } from '../shenzhen/metro';

function project(lat: number, lon: number) {
  return {
    x: ((lon - SHENZHEN_BOUNDS.minLon) / (SHENZHEN_BOUNDS.maxLon - SHENZHEN_BOUNDS.minLon)) * 1000,
    y: ((SHENZHEN_BOUNDS.maxLat - lat) / (SHENZHEN_BOUNDS.maxLat - SHENZHEN_BOUNDS.minLat)) * 700,
  };
}

export const TRANSIT_LINES: TransitLine[] = SHENZHEN_METRO_LINES.map(line => {
  const stops = SHENZHEN_METRO_STOPS.filter(stop => stop.lines.includes(line.routeId)).map(stop => ({ id: stop.stopId, name: stop.name, pos: project(stop.lat, stop.lon), lines: stop.lines }));
  return { id: line.routeId, name: line.longName, color: line.color, type: 'mrt', frequency: 0, path: stops.map(stop => stop.pos), stops };
});
