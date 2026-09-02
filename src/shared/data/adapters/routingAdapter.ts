/**
 * Local reachability estimator used by the TransitReach Shenzhen public beta.
 *
 * This pure-front-end Shenzhen Demo combines a walking catchment with egress catchments
 * around stations reachable directly or with at most one sampled-line transfer.
 * It is useful for product interaction testing, not journey planning.
 */

import polygonClipping, { type MultiPolygon, type Polygon as ClippingPolygon } from 'polygon-clipping';
import { loadRailStops } from './gtfsAdapter';
import { WALK_SPEED_MS } from './routingConfig';

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

/**
 * Builds a deterministic, anisotropic walking envelope.
 *
 * This is intentionally not a perfect circle: real walking catchments are constrained
 * by blocks, entrances and the street mesh. Until an OSM pedestrian graph is deployed,
 * the alternating radii make that uncertainty visible instead of suggesting impossible
 * radial precision. It remains a heuristic and is labelled as such in the UI.
 */
function catchmentRegion(circle: CircleCatchment, points = 24): IsochroneRegion {
  const ring: [number, number][] = [];
  const seed = Math.abs(Math.sin(circle.lat * 91.7 + circle.lon * 47.3));
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const blockBias = 0.82 + 0.13 * Math.abs(Math.cos(angle * 2 + seed));
    const streetVariation = 0.88 + 0.1 * Math.sin(angle * 5 + seed * 8) + 0.05 * Math.cos(angle * 3 - seed * 4);
    const radiusKm = circle.radiusKm * Math.max(0.68, Math.min(1.04, blockBias * streetVariation));
    const lat = circle.lat + Math.sin(angle) * radiusKm / EARTH_KM_PER_DEG_LAT;
    const lon = circle.lon + Math.cos(angle) * radiusKm / kmPerDegLon(circle.lat);
    ring.push([lon, lat]);
  }
  return { outer: ring, holes: [] };
}

function mergeCatchments(circles: CircleCatchment[]): IsochroneRegion[] {
  if (circles.length === 0) return [];
  const polygons: ClippingPolygon[] = circles.map(circle => [catchmentRegion(circle).outer]);
  const merged: MultiPolygon = polygonClipping.union(polygons[0], ...polygons.slice(1));

  return merged.flatMap(polygon => {
    const [outer, ...holes] = polygon;
    if (!outer || outer.length < 4) return [];
    return [{
      outer: outer.map(([lon, lat]) => [lon, lat]),
      holes: holes
        .filter(ring => ring.length >= 4)
        .map(ring => ring.map(([lon, lat]) => [lon, lat])),
    } satisfies IsochroneRegion];
  });
}

function ringAreaKm2(ring: [number, number][], latitude: number): number {
  const kx = kmPerDegLon(latitude);
  let twiceArea = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lonA, latA] = ring[i];
    const [lonB, latB] = ring[i + 1];
    twiceArea += (lonA * kx) * (latB * EARTH_KM_PER_DEG_LAT)
      - (lonB * kx) * (latA * EARTH_KM_PER_DEG_LAT);
  }
  return Math.abs(twiceArea) / 2;
}

/** Exact polygon area after overlap union, including any unreachable holes. */
function regionsAreaKm2(regions: IsochroneRegion[]): number {
  return regions.reduce((sum, region) => {
    const latitude = region.outer.reduce((total, [, lat]) => total + lat, 0) / region.outer.length;
    const outerArea = ringAreaKm2(region.outer, latitude);
    const holesArea = region.holes.reduce((total, hole) => total + ringAreaKm2(hole, latitude), 0);
    return sum + Math.max(0, outerArea - holesArea);
  }, 0);
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
  const regions = mergeCatchments(displayCircles);
  const walkingOnly = displayCircles.length === 1;
  const durationMs = performance.now() - startedAt;
  if (import.meta.env.DEV) {
    console.info(`[TransitReach] 可达范围计算 ${durationMs.toFixed(1)}ms (${budgetMinutes}min, ${regions.length} merged regions)`);
  }
  return {
    walkingOnly,
    durationMs,
    result: {
      budgetMinutes,
      regions,
      areaKm2: regionsAreaKm2(regions),
    },
  };
}
