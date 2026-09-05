import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polygon, ScaleControl, Tooltip as LeafletTooltip, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { IsochroneRegion, IsochroneResult, ReachableStation } from '@/shared/data/adapters/routingAdapter';
import type { LatLng, Origin } from '../types';
import { NETWORK_CENTRE } from '../reachabilityService';
import { SHENZHEN_METRO_LINES, SHENZHEN_METRO_STOPS } from '@/shared/data/shenzhen/metro';

/**
 * OpenStreetMap raster tiles.
 *
 * The attribution below is a licence obligation under the ODbL, not a design choice
 * (AC 1.3.3). Leaflet renders its attribution control on every view and offers the user
 * no way to dismiss it; do not pass `attributionControl={false}` or override this string.
 *
 * OSM's tile usage policy governs this endpoint. Student-scale traffic sits inside it
 * only while valid attribution is displayed. A heavier deployment needs its own tiles.
 */
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_ZOOM = 11;
const ORIGIN_ZOOM = 15;

/**
 * Fill opacity of the reachable area.
 *
 * AC 1.3.1's checkable requirement is that "street names and base map features remain
 * readable through it". The epic proposed 40% and left the value for the team to confirm;
 * the team settled on a restrained 20%, because stronger teal over raster tiles buries
 * small street labels. The thin dashed edge preserves the boundary without masking the
 * basemap underneath.
 */
const FILL_OPACITY = 0.2;
const AREA_COLOR = '#0d9488';
const LINE_COLORS = new Map(SHENZHEN_METRO_LINES.map(line => [line.routeId, line.color]));

/** Fixed rail stations reveal progressively; they are not random POIs to be clustered. */
function MetroStations({ reachableStopIds, stations }: { reachableStopIds?: ReadonlySet<string>; stations?: ReachableStation[] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: event => setZoom(event.target.getZoom()) });

  // At city scale, hide network detail; at district scale, preserve the route-colour pattern.
  if (zoom <= 10) return null;

  const radius = zoom <= 12 ? 3 : zoom <= 13 ? 4 : 5;
  const weight = zoom <= 12 ? 0.6 : 1.2;
  const baseOpacity = zoom <= 12 ? 0.82 : 0.92;
  const showTooltip = zoom >= 11;

  return (
    <>
      {SHENZHEN_METRO_STOPS.map(stop => {
        const isInterchange = stop.lines.length > 1;
        const journey = stations?.find(station => station.stop.stopId === stop.stopId);
        const isReachable = reachableStopIds?.has(stop.stopId) ?? false;
        const isMuted = reachableStopIds !== undefined && !isReachable;
        const lineColor = LINE_COLORS.get(stop.lines[0]) ?? '#0d9488';
        const strokeColor = isMuted
          ? '#64748b'
          : isInterchange
            ? '#0f766e'
            : (zoom <= 12 ? 'rgba(255,255,255,0.5)' : '#ffffff');
        const fillColor = isMuted
          ? '#94a3b8'
          : (isInterchange ? '#ffffff' : lineColor);

        return (
          <CircleMarker
            key={stop.stopId}
            center={[stop.lat, stop.lon]}
            radius={isReachable ? radius + 1.5 : (isInterchange ? radius + 1 : radius)}
            pathOptions={{
              color: strokeColor,
              weight: isInterchange ? 1.8 : weight,
              fillColor,
              fillOpacity: isReachable ? 1 : (isMuted ? 0.3 : baseOpacity),
            }}
          >
            {showTooltip && (
              <LeafletTooltip direction="top" offset={[0, -5]}>
                <span className="font-semibold">{stop.name}</span>
                <div className="flex gap-2 my-1">{stop.lines.map(line => <span key={line}><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: LINE_COLORS.get(line) }} />{line}号线</span>)}</div>
                {isInterchange && <div>换乘站</div>}
                {stations && <div>{journey ? `✓ 预算内 · 约 ${Math.ceil(journey.travelMinutes)} 分钟 · ${journey.transfers ? '1 次换乘' : '直达'}` : '当前预算外'}</div>}
              </LeafletTooltip>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}

interface BaseMapProps {
  origin: Origin | null;
  /** Disjoint reachable regions, or null when there is nothing to draw. */
  regions: IsochroneRegion[] | null;
  /** Station ids computed within the current time budget; omitted before a calculation. */
  reachableStopIds?: ReadonlySet<string>;
  stations?: ReachableStation[];
  layers?: IsochroneResult[];
  onMapClick: (at: LatLng) => void;
  theme: 'light' | 'dark';
}

/** Reports map clicks. AC 1.1.2 — a click sets or moves the single starting point. */
function ClickHandler({ onMapClick }: { onMapClick: (at: LatLng) => void }) {
  useMapEvents({
    click: e => onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng }),
  });
  return null;
}

/**
 * Keeps Leaflet's idea of the container size in step with the real one.
 *
 * The map mounts inside a page transition, so on the first frame the container can be a
 * fraction of its final height. Leaflet caches that size and converts screen clicks to
 * coordinates against it, which silently shifts every clicked point — by roughly 30 km
 * north-south here — until the size is invalidated.
 */
function ResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    map.invalidateSize();

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

/**
 * Follows the origin: eases to a stop chosen by name, and returns to the default view
 * when the origin is cleared (AC 1.1.5). A map click is deliberately not followed —
 * the user is already looking at the point they tapped.
 */
function ViewController({ origin }: { origin: Origin | null }) {
  const map = useMap();

  useEffect(() => {
    if (!origin) {
      map.setView([NETWORK_CENTRE.lat, NETWORK_CENTRE.lon], DEFAULT_ZOOM);
      return;
    }
    if (origin.source === 'map') return;
    map.setView([origin.at.lat, origin.at.lon], ORIGIN_ZOOM);
  }, [origin, map]);

  return null;
}

/** Fits the complete MultiPolygon after a calculation so the user can see its shape. */
function ReachabilityView({ regions }: { regions: IsochroneRegion[] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!regions?.length) return;
    const points = regions
      .flatMap(region => region.outer.map(([lon, lat]) => [lat, lon] as [number, number]))
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));
    if (points.length < 3) return;
    const lats = points.map(([lat]) => lat);
    const lons = points.map(([, lon]) => lon);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]],
      { padding: [48, 48], maxZoom: 13, animate: true },
    );
  }, [regions, map]);

  return null;
}

/**
 * The origin marker.
 *
 * Drawn as a CircleMarker rather than Leaflet's default marker: the default icon
 * resolves its PNGs by relative URL, which Vite does not rewrite, so it renders broken
 * without shipping the images through a public/ folder. A vector marker sidesteps that
 * and stays crisp at every zoom.
 */
function OriginPin({ at }: { at: LatLng }) {
  return (
    <>
      <CircleMarker
        center={[at.lat, at.lon]}
        radius={13}
        // AC 1.3.1 — the marker must sit above the fill. Leaflet stacks vectors in the
        // order their layers mount, and the area arrives after the pin, so leaving both
        // in the default overlay pane buries the pin under the area. markerPane sits at
        // z-index 600 against overlayPane's 400, which makes the ordering independent of
        // mount order. Do not move these back to the default pane.
        pane="markerPane"
        pathOptions={{ className: 'origin-marker', color: '#0d9488', weight: 2, fillColor: '#0d9488', fillOpacity: 0.18 }}
        interactive={false}
      />
      <CircleMarker
        center={[at.lat, at.lon]}
        radius={6}
        pane="markerPane"
        pathOptions={{ className: 'origin-marker', color: '#ffffff', weight: 2.5, fillColor: '#0d9488', fillOpacity: 1 }}
        interactive={false}
      />
    </>
  );
}

/**
 * The reachable area.
 *
 * Each region is drawn as its own polygon. AC 1.3.1 forbids merging non-contiguous
 * areas — a pocket around a distant station stays a separate shape rather than being
 * absorbed into one enclosing hull. OTP returns them already disjoint; this just keeps
 * them that way. Holes are passed through as inner rings so enclosed unreachable ground
 * is not painted as reachable.
 */
function ReachabilityLayer({ regions, budget }: { regions: IsochroneRegion[]; budget?: number }) {
  const colors: Record<number, string> = { 15: '#0f766e', 30: '#14b8a6', 45: '#5eead4', 60: '#99f6e4' };
  const opacities: Record<number, number> = { 15: 0.35, 30: 0.25, 45: 0.15, 60: 0.08 };
  const color = budget ? colors[budget] : AREA_COLOR;
  return (
    <>
      {regions.map((region, i) => (
        <Polygon
          key={i}
          className={budget ? `reach-area budget-layer-${budget}` : 'reach-area reach-area-enter'}
          // GeoJSON is [lon, lat]; Leaflet wants [lat, lon].
          positions={[region.outer, ...region.holes].map(ring =>
            ring.map(([lon, lat]) => [lat, lon] as [number, number]),
          )}
          pathOptions={{
            color,
            weight: 2,
            opacity: 0.6,
            fillColor: color,
            fillOpacity: budget ? opacities[budget] : FILL_OPACITY,
            dashArray: '6 3',
          }}
          interactive={false}
        />
      ))}
    </>
  );
}

export function BaseMap({ origin, regions, reachableStopIds, stations, layers = [], onMapClick, theme }: BaseMapProps) {
  const [tilesReady, setTilesReady] = useState(false);

  useEffect(() => {
    const fallback = window.setTimeout(() => setTilesReady(true), 4_000);
    return () => window.clearTimeout(fallback);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-100">
      <MapContainer
        center={[NETWORK_CENTRE.lat, NETWORK_CENTRE.lon]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" metric imperial={false} />
        <TileLayer
          key={theme}
          url={theme === 'dark' ? DARK_TILE_URL : OSM_TILE_URL}
          attribution={theme === 'dark' ? DARK_ATTRIBUTION : OSM_ATTRIBUTION}
          maxZoom={19}
          crossOrigin="anonymous"
          eventHandlers={{ load: () => setTilesReady(true) }}
        />
        {/* Must precede ViewController so the container size is correct before the view is set. */}
        <ResizeHandler />
        <ClickHandler onMapClick={onMapClick} />
        <ViewController origin={origin} />
        <ReachabilityView regions={layers.length ? layers[0].regions : regions} />
        {/* The area is drawn first so the origin pin sits above the fill (AC 1.3.1). */}
        {layers.length ? layers.map(layer => <ReachabilityLayer key={layer.budgetMinutes} regions={layer.regions} budget={layer.budgetMinutes} />) : regions && <ReachabilityLayer regions={regions} />}
        <MetroStations reachableStopIds={reachableStopIds} stations={stations} />
        {origin && <OriginPin at={origin.at} />}
      </MapContainer>
      {!tilesReady && (
        <div className="absolute inset-0 z-[650] flex items-center justify-center bg-slate-50/92 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="glass px-6 py-5 flex flex-col items-center gap-3 text-center shadow-xl">
            <div className="w-9 h-9 rounded-full border-[3px] border-teal-100 border-t-teal-600 spinner" />
            <div>
              <p className="text-sm font-bold text-slate-800">正在加载深圳地图</p>
              <p className="text-xs text-slate-500 mt-1">准备站点与开放地图底图…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
