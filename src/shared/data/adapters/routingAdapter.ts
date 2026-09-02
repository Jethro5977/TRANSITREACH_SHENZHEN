/**
 * Local reachability estimator used by the TransitReach Shenzhen public beta.
 *
 * This pure-front-end Shenzhen Demo combines a walking catchment with egress catchments
 * around stations reachable directly or with at most one sampled-line transfer.
 * It is useful for product interaction testing, not journey planning.
 */

import { loadRailStops } from './gtfsAdapter';

export const DEPARTURE_TIME = '2026-09-02T08:00:00+08:00';
export const DEPARTURE_TIME_LABEL = '工作日 08:00（Demo 假设）';
export const DEPARTURE_TIME_IS_PROVISIONAL = true;
export const WALK_SPEED_MS = 1.33;
export const COMPUTATION_TIMEOUT_MS = 2_000;

export interface IsochroneRegion {
  outer: [number, number][];
  holes: [number, number][][];
}
export interface IsochroneResult {
  budgetMinutes: number;
  regions: IsochroneRegion[];
  areaKm2: number;
}

export interface ReachabilityComputation {
  result: IsochroneResult;
  walkingOnly: boolean;
  /** Algorithm time only, excluding the one-frame UI yield. */
  durationMs: number;
}

export class RoutingUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'RoutingUnavailableError';
  }
}

export class RoutingTimeoutError extends Error {
  constructor(readonly limitMs: number) {
    super(`Reachability computation exceeded ${limitMs} ms.`);
    this.name = 'RoutingTimeoutError';
  }
}

interface CircleCatchment {
  lat: number;
  lon: number;
  radiusKm: number;
}

const WALK_KMH = WALK_SPEED_MS * 3.6;
const METRO_KMH = 34;
const WAIT_MINUTES = 4;
const TRANSFER_MINUTES = 4;
const MAX_ACCESS_KM = 1.35;
const MAX_EGRESS_KM = 1.2;
const EARTH_KM_PER_DEG_LAT = 110.574;

function kmPerDegLon(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180);
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dy = (a.lat - b.lat) * EARTH_KM_PER_DEG_LAT;
  const dx = (a.lon - b.lon) * kmPerDegLon((a.lat + b.lat) / 2);
  return Math.hypot(dx, dy);
}

function circleRegion(circle: CircleCatchment, points = 40): IsochroneRegion {
  const ring: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const lat = circle.lat + Math.sin(angle) * circle.radiusKm / EARTH_KM_PER_DEG_LAT;
    const lon = circle.lon + Math.cos(angle) * circle.radiusKm / kmPerDegLon(circle.lat);
    ring.push([lon, lat]);
  }
  return { outer: ring, holes: [] };
}

/** Grid-based union estimate so overlapping station circles are not double-counted. */
function unionAreaKm2(circles: CircleCatchment[]): number {
  if (circles.length === 0) return 0;
  const lat0 = circles.reduce((sum, circle) => sum + circle.lat, 0) / circles.length;
  const kx = kmPerDegLon(lat0);
  const projected = circles.map(circle => ({
    x: circle.lon * kx,
    y: circle.lat * EARTH_KM_PER_DEG_LAT,
    r: circle.radiusKm,
  }));
  const minX = Math.min(...projected.map(c => c.x - c.r));
  const maxX = Math.max(...projected.map(c => c.x + c.r));
  const minY = Math.min(...projected.map(c => c.y - c.r));
  const maxY = Math.max(...projected.map(c => c.y + c.r));
  const step = 0.2;
  let cells = 0;
  for (let y = minY + step / 2; y < maxY; y += step) {
    for (let x = minX + step / 2; x < maxX; x += step) {
      if (projected.some(c => Math.hypot(x - c.x, y - c.y) <= c.r)) cells++;
    }
  }
  return cells * step * step;
}

function uniqueCircles(circles: CircleCatchment[]): CircleCatchment[] {
  const result: CircleCatchment[] = [];
  for (const circle of circles.sort((a, b) => b.radiusKm - a.radiusKm)) {
    const covered = result.some(existing =>
      distanceKm(circle, existing) + circle.radiusKm <= existing.radiusKm,
    );
    if (!covered) result.push(circle);
  }
  return result;
}

export async function computeReachability(
  origin: { lat: number; lon: number },
  budgetMinutes: number,
  signal: AbortSignal,
): Promise<ReachabilityComputation> {
  // Yield one frame so React can paint its computing state before synchronous geometry.
  await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const startedAt = performance.now();

  const walkRadiusKm = (budgetMinutes / 60) * WALK_KMH;
  const circles: CircleCatchment[] = [{ ...origin, radiusKm: walkRadiusKm }];
  const stops = loadRailStops();
  const accessStops = stops
    .map(stop => ({ stop, distance: distanceKm(origin, stop) }))
    .filter(item => item.distance <= MAX_ACCESS_KM);
  const interchangeStops = stops.filter(stop => stop.lines.length >= 2);

  for (const access of accessStops) {
    const accessMinutes = (access.distance / WALK_KMH) * 60;
    const journeyMinutes = new Map<string, number>();

    for (const destination of stops) {
      if (!access.stop.lines.some(line => destination.lines.includes(line))) continue;
      journeyMinutes.set(destination.stopId, WAIT_MINUTES + (distanceKm(access.stop, destination) / METRO_KMH) * 60);
    }

    for (const interchange of interchangeStops) {
      const firstLines = access.stop.lines.filter(line => interchange.lines.includes(line));
      if (firstLines.length === 0 || interchange.lines.length < 2) continue;
      const firstLegMinutes = WAIT_MINUTES + (distanceKm(access.stop, interchange) / METRO_KMH) * 60;
      const onwardLines = interchange.lines.filter(line => !firstLines.includes(line));
      for (const destination of stops) {
        if (!destination.lines.some(line => onwardLines.includes(line))) continue;
        const total = firstLegMinutes + TRANSFER_MINUTES + (distanceKm(interchange, destination) / METRO_KMH) * 60;
        const previous = journeyMinutes.get(destination.stopId);
        if (previous === undefined || total < previous) journeyMinutes.set(destination.stopId, total);
      }
    }

    for (const stop of stops) {
      const metroMinutes = journeyMinutes.get(stop.stopId);
      if (metroMinutes === undefined) continue;
      const remaining = budgetMinutes - accessMinutes - metroMinutes;
      if (remaining < 2) continue;
      const radiusKm = Math.min(MAX_EGRESS_KM, (remaining / 60) * WALK_KMH);
      circles.push({ lat: stop.lat, lon: stop.lon, radiusKm });
    }
  }

  const displayCircles = uniqueCircles(circles);
  const walkingOnly = displayCircles.length === 1;
  const durationMs = performance.now() - startedAt;
  if (import.meta.env.DEV) {
    console.info(`[TransitReach] 可达范围计算 ${durationMs.toFixed(1)}ms (${budgetMinutes}min, ${displayCircles.length} regions)`);
  }
  return {
    walkingOnly,
    durationMs,
    result: {
      budgetMinutes,
      regions: displayCircles.map(circle => circleRegion(circle)),
      areaKm2: unionAreaKm2(displayCircles),
    },
  };
}
