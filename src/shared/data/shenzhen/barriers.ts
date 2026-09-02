export type BarrierKind = 'water' | 'waterway' | 'motorway';
export type BarrierRing = [number, number][];

interface BarrierSnapshot {
  generatedAt: string;
  source: string;
  licence: string;
  notes: string;
  barriers: Record<BarrierKind, BarrierRing[][]>;
}

interface BoundedBarrier {
  polygon: BarrierRing[];
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

let cachedBarriers: BoundedBarrier[] | null = null;
let loadingBarriers: Promise<BoundedBarrier[]> | null = null;

async function loadBarrierBounds(): Promise<BoundedBarrier[]> {
  if (cachedBarriers) return cachedBarriers;
  if (loadingBarriers) return loadingBarriers;
  // Kept out of the map route's initial chunk: this 943 KB OSM snapshot is only needed
  // after the user actually requests an isochrone.
  loadingBarriers = import('./barriers.generated.json').then(module => {
    const snapshot = module.default as unknown as BarrierSnapshot;
    cachedBarriers = Object.values(snapshot.barriers).flat().map(polygon => {
      const outer = polygon[0] ?? [];
      const lons = outer.map(([lon]) => lon);
      const lats = outer.map(([, lat]) => lat);
      return {
        polygon,
        minLon: Math.min(...lons),
        maxLon: Math.max(...lons),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      };
    });
    return cachedBarriers;
  });
  return loadingBarriers;
}

/** Avoid sending the full city-wide snapshot to each Polygon difference operation. */
export async function getIntersectingBarrierPolygons(bounds: {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}) {
  const barriers = await loadBarrierBounds();
  return barriers
    .filter(barrier =>
      barrier.maxLon >= bounds.minLon && barrier.minLon <= bounds.maxLon
      && barrier.maxLat >= bounds.minLat && barrier.minLat <= bounds.maxLat,
    )
    .map(barrier => barrier.polygon);
}
