import type { RailStop } from '@/shared/data/adapters/gtfsAdapter';

/**
 * A real-world position. Distinct from the prototype's MapPoint {x, y}, which is a
 * pixel coordinate on the abstract SVG canvas the other pages still use.
 */
export interface LatLng {
  lat: number;
  lon: number;
}

/** A user-selected OSM Nominatim search result. It is intentionally not a transit stop. */
export interface PlaceResult extends LatLng {
  name: string;
  fullName: string;
  type: string;
}

/** How the user set the starting point. */
export type OriginSource = 'stop' | 'map' | 'device' | 'place';

/**
 * The starting point of a reachability query. Exactly one exists at a time
 * (AC 1.1.2) — selecting another moves it rather than adding a second.
 */
export interface Origin {
  at: LatLng;
  source: OriginSource;
  /** Present only when source === 'stop'. */
  stop?: RailStop;
  /** Present only when source === 'place'. */
  place?: PlaceResult;
}

export type { RailStop };

export function isPlaceResult(result: RailStop | PlaceResult): result is PlaceResult {
  return !('stopId' in result);
}
