/**
 * Local reachability estimator used by the TransitReach Shenzhen public beta.
 *
 * This pure-front-end Shenzhen Demo combines a walking catchment with egress catchments
 * around stations reachable directly or with at most one sampled-line transfer.
 * It is useful for product interaction testing, not journey planning.
 */

import polygonClipping, { type MultiPolygon, type Polygon as ClippingPolygon } from 'polygon-clipping';
import { getIntersectingBarrierPolygons, preloadBarrierData } from '../shenzhen/barriers';
import { SHENZHEN_PEAKS } from '../shenzhen/peaks.generated';
import {
  getDepartureProfile,
  getWaitMinutes,
  TIMETABLE_STATUS,
  type DepartureProfileId,
} from '../shenzhen/timetable';
import { loadRailStops, type RailStop } from './gtfsAdapter';
import { COMPUTATION_TIMEOUT_MS, WALK_SPEED_MS } from './routingConfig';

export interface IsochroneRegion {
  outer: [number, number][];
  holes: [number, number][][];
}
export interface IsochroneResult {
  budgetMinutes: number;
  regions: IsochroneRegion[];
  areaKm2: number;
  reachableStations: ReachableStation[];
  departureLabel: string;
  timetableStatus: 'verified' | 'demo-fallback';
}

export interface ReachableStation {
  stop: RailStop;
  travelMinutes: number;
  transfers: 0 | 1;
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

interface JourneyEstimate {
  minutes: number;
  transfers: 0 | 1;
}

const WALK_KMH = WALK_SPEED_MS * 3.6;
const METRO_KMH = 34;
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
 * by blocks, entrances, the street mesh and Shenzhen's terrain. Until an OSM pedestrian
 * graph is deployed, this applies only a directional terrain approximation and remains
 * explicitly labelled as a heuristic in the UI.
 */
function terrainFactor(origin: CircleCatchment, angle: number): number {
  const checkDistanceKm = Math.min(2, Math.max(0.9, origin.radiusKm * 1.5));
  let minimumFactor = 1;

  for (const peak of SHENZHEN_PEAKS) {
    const distanceToPeak = distanceKm(origin, peak);
    if (distanceToPeak > checkDistanceKm * 1.5) continue;

    const peakAngle = Math.atan2(
      (peak.lat - origin.lat) * EARTH_KM_PER_DEG_LAT,
      (peak.lon - origin.lon) * kmPerDegLon(origin.lat),
    );
    const rawDifference = Math.abs(angle - peakAngle);
    const angleDifference = Math.min(rawDifference, Math.PI * 2 - rawDifference);
    const halfCone = Math.PI / 4;
    if (angleDifference >= halfCone) continue;

    const proximity = Math.max(0.3, Math.min(1, distanceToPeak / checkDistanceKm));
    const directionOffset = angleDifference / halfCone;
    // Never infer elevation: an omitted OSM `ele` tag gets only a conservative peak penalty.
    const heightPenalty = peak.elevationM === undefined
      ? 0.12
      : Math.min(0.5, Math.max(0.1, (peak.elevationM - 50) / 800));
    const factor = proximity + directionOffset * 0.28 + (1 - heightPenalty) * 0.18;
    minimumFactor = Math.min(minimumFactor, factor);
  }

  return Math.max(0.25, Math.min(1, minimumFactor));
}

function catchmentRegion(circle: CircleCatchment, points = 24): IsochroneRegion {
  const ring: [number, number][] = [];
  const seed = Math.abs(Math.sin(circle.lat * 91.7 + circle.lon * 47.3));
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const blockBias = 0.82 + 0.13 * Math.abs(Math.cos(angle * 2 + seed));
    const streetVariation = 0.88 + 0.1 * Math.sin(angle * 5 + seed * 8) + 0.05 * Math.cos(angle * 3 - seed * 4);
    const terrain = terrainFactor(circle, angle);
    const radiusKm = circle.radiusKm * Math.max(0.2, Math.min(1.04, blockBias * streetVariation * terrain));
    const lat = circle.lat + Math.sin(angle) * radiusKm / EARTH_KM_PER_DEG_LAT;
    const lon = circle.lon + Math.cos(angle) * radiusKm / kmPerDegLon(circle.lat);
    ring.push([lon, lat]);
  }
  return { outer: ring, holes: [] };
}

type CatchmentStrategy = (circle: CircleCatchment) => IsochroneRegion;

/**
 * Replace this strategy with a walk-network Dijkstra/OTP implementation once a
 * pedestrian graph is deployed. The current strategy is intentionally heuristic.
 */
const heuristicCatchment: CatchmentStrategy = circle => catchmentRegion(circle);
const activeCatchment: CatchmentStrategy = heuristicCatchment;

function regionsFromMultiPolygon(geometry: MultiPolygon): IsochroneRegion[] {
  return geometry.flatMap(polygon => {
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

function mergeCatchments(circles: CircleCatchment[]): IsochroneRegion[] {
  if (circles.length === 0) return [];
  const polygons: ClippingPolygon[] = circles.map(circle => [activeCatchment(circle).outer]);
  const merged: MultiPolygon = polygonClipping.union(polygons[0], ...polygons.slice(1));
  return regionsFromMultiPolygon(merged);
}

/**
 * OSM water, controlled-access roads, railways, cliffs and military buffers remove
 * clearly non-walkable ground from each local envelope. This is a barrier-clipped
 * heuristic, not a substitute for a pedestrian routing graph; each region only
 * considers barriers overlapping its own bounds.
 */
async function clipRegionsByBarriers(regions: IsochroneRegion[]): Promise<IsochroneRegion[]> {
  const clipped = await Promise.all(regions.map(async region => {
    const lons = region.outer.map(([lon]) => lon);
    const lats = region.outer.map(([, lat]) => lat);
    const barriers = await getIntersectingBarrierPolygons({
      minLon: Math.min(...lons), maxLon: Math.max(...lons),
      minLat: Math.min(...lats), maxLat: Math.max(...lats),
    });
    if (barriers.length === 0) return [region];
    try {
      return regionsFromMultiPolygon(polygonClipping.difference([region.outer, ...region.holes], ...barriers));
    } catch {
      // OSM geometry may occasionally be topologically invalid after simplification.
      // Keeping the uncut heuristic is safer than dropping a valid reachability result.
      return [region];
    }
  }));
  return clipped.flat();
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

function setShortestJourney(
  journeys: Map<string, JourneyEstimate>,
  stopId: string,
  candidate: JourneyEstimate,
) {
  const previous = journeys.get(stopId);
  if (!previous || candidate.minutes < previous.minutes) journeys.set(stopId, candidate);
}

export async function computeReachability(
  origin: { lat: number; lon: number },
  budgetMinutes: number,
  departureProfileId: DepartureProfileId,
  signal: AbortSignal,
): Promise<ReachabilityComputation> {
  // Yield one frame so React can paint its computing state before synchronous geometry.
  await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  // The city-wide OSM snapshot is a one-time cold-start cost.  Initialise it before
  // beginning the one-second computation budget so a first use is not treated as a timeout.
  await preloadBarrierData();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const startedAt = performance.now();

  const walkRadiusKm = (budgetMinutes / 60) * WALK_KMH;
  const circles: CircleCatchment[] = [{ ...origin, radiusKm: walkRadiusKm }];
  const stops = loadRailStops();
  const accessStops = stops
    .map(stop => ({ stop, distance: distanceKm(origin, stop) }))
    .filter(item => item.distance <= MAX_ACCESS_KM);
  const interchangeStops = stops.filter(stop => stop.lines.length >= 2);
  const reachableByStop = new Map<string, ReachableStation>();

  for (const access of accessStops) {
    const accessMinutes = (access.distance / WALK_KMH) * 60;
    const journeyMinutes = new Map<string, JourneyEstimate>();

    for (const destination of stops) {
      const sharedLines = access.stop.lines.filter(line => destination.lines.includes(line));
      if (sharedLines.length === 0) continue;
      setShortestJourney(journeyMinutes, destination.stopId, {
        minutes: getWaitMinutes(sharedLines, departureProfileId).minutes + (distanceKm(access.stop, destination) / METRO_KMH) * 60,
        transfers: 0,
      });
    }

    for (const interchange of interchangeStops) {
      const firstLines = access.stop.lines.filter(line => interchange.lines.includes(line));
      if (firstLines.length === 0 || interchange.lines.length < 2) continue;
      const firstLegMinutes = getWaitMinutes(firstLines, departureProfileId).minutes + (distanceKm(access.stop, interchange) / METRO_KMH) * 60;
      const onwardLines = interchange.lines.filter(line => !firstLines.includes(line));
      for (const destination of stops) {
        const destinationLines = destination.lines.filter(line => onwardLines.includes(line));
        if (destinationLines.length === 0) continue;
        setShortestJourney(journeyMinutes, destination.stopId, {
          minutes: firstLegMinutes + TRANSFER_MINUTES + getWaitMinutes(destinationLines, departureProfileId).minutes + (distanceKm(interchange, destination) / METRO_KMH) * 60,
          transfers: 1,
        });
      }
    }

    for (const stop of stops) {
      const journey = journeyMinutes.get(stop.stopId);
      if (!journey) continue;
      const totalMinutes = accessMinutes + journey.minutes;
      if (totalMinutes <= budgetMinutes) {
        const previous = reachableByStop.get(stop.stopId);
        if (!previous || totalMinutes < previous.travelMinutes) {
          reachableByStop.set(stop.stopId, { stop, travelMinutes: totalMinutes, transfers: journey.transfers });
        }
      }
      const remaining = budgetMinutes - totalMinutes;
      if (remaining < 2) continue;
      const radiusKm = Math.min(MAX_EGRESS_KM, (remaining / 60) * WALK_KMH);
      circles.push({ lat: stop.lat, lon: stop.lon, radiusKm });
    }
  }

  const displayCircles = uniqueCircles(circles);
  const regions = await clipRegionsByBarriers(mergeCatchments(displayCircles));
  const walkingOnly = displayCircles.length === 1;
  const departureProfile = getDepartureProfile(departureProfileId);
  const reachableStations = [...reachableByStop.values()].sort((a, b) =>
    a.travelMinutes - b.travelMinutes || a.stop.name.localeCompare(b.stop.name, 'zh-CN'),
  );
  const durationMs = performance.now() - startedAt;
  if (durationMs > COMPUTATION_TIMEOUT_MS) {
    throw new RoutingTimeoutError(COMPUTATION_TIMEOUT_MS);
  }
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
      reachableStations,
      departureLabel: departureProfile.label,
      timetableStatus: TIMETABLE_STATUS.available ? 'verified' : 'demo-fallback',
    },
  };
}
