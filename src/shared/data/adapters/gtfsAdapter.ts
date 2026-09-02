/**
 * Reads the static Shenzhen rail snapshot generated from OpenStreetMap route relations.
 *
 * `stations.generated.json` is produced by `node scripts/build-shenzhen-metro.mjs` and
 * committed. Nothing fetches over the network at runtime.
 *
 * Positions and line membership come from OSM nodes and subway route relations.
 */

import {
  SHENZHEN_FEED_METADATA,
  SHENZHEN_METRO_STOPS,
} from '../shenzhen/metro';

/** One station. Platform rows sharing a name and location are merged into a single entry. */
export interface RailStop {
  stopId: string;
  /** Exact feed stop_name, whitespace-normalised. */
  name: string;
  lat: number;
  lon: number;
  /** route_ids of every line serving this station. */
  lines: string[];
  /** The feed stop_ids merged into this station, one per line. */
  platforms: string[];
}

export interface RailLine {
  routeId: string;
  shortName: string;
  longName: string;
  mode: string;
  color: string;
  stopCount: number;
}

export interface ServiceCalendar {
  serviceId: string;
  days: string[];
  startDate: string;
  endDate: string;
  referencedByTrips: boolean;
  expired: boolean;
}

export interface RailFeed {
  feedId: string;
  feedName: string;
  agency: string;
  source: string;
  licence: string | null;
  licenceStatus: string;
  serviceDateRange: { start: string; end: string };
  serviceCalendars: ServiceCalendar[];
  lines: RailLine[];
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface RailFeedMetadata {
  feeds: RailFeed[];
  /** Each line Epic 1 names, and whether this feed actually contains it. */
  epicLineCoverage: { label: string; routeId: string; present: boolean }[];
  /** Modes absent from the computation, named verbatim for display (AC 1.3.3). */
  modesNotLoaded: string[];
  /** Extent of the loaded stops. The basis for the study area (AC 1.1.2). */
  studyAreaFeedExtent: BoundingBox;
  notes: string[];
  warnings: string[];
}

const STOPS = SHENZHEN_METRO_STOPS.slice();
const METADATA = SHENZHEN_FEED_METADATA;

/** Every station in the loaded feed. */
export function loadRailStops(): RailStop[] {
  return STOPS;
}

/** Feed provenance, service periods, line coverage and the modes left out. */
export function loadRailFeedMetadata(): RailFeedMetadata {
  return METADATA;
}

const LINES_BY_ROUTE_ID = new Map(
  METADATA.feeds.flatMap(feed => feed.lines).map(line => [line.routeId, line]),
);

/** Resolves a stop's route_ids to the lines serving it, for display. */
export function linesForStop(stop: RailStop): RailLine[] {
  return stop.lines
    .map(routeId => LINES_BY_ROUTE_ID.get(routeId))
    .filter((line): line is RailLine => line !== undefined);
}
