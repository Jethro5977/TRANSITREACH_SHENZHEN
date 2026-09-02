import { loadRailFeedMetadata } from '@/shared/data/adapters/gtfsAdapter';
import {
  WALK_SPEED_MS,
  DEPARTURE_TIME,
  DEPARTURE_TIME_LABEL,
  DEPARTURE_TIME_IS_PROVISIONAL,
} from '@/shared/data/adapters/routingConfig';
import type { LatLng, RailStop } from './types';
import { SHENZHEN_CENTRE } from '@/shared/data/shenzhen/metro';

/** AC 1.1.1 — the search field stays inert below this length. */
export const MIN_QUERY_LENGTH = 2;

/** AC 1.1.1 — at most this many results are shown at once. */
export const MAX_RESULTS = 10;

/**
 * Matches stops for the search field.
 *
 * Case-insensitive substring on the stop name only — no fuzzy matching, no phonetic
 * matching, and deliberately not on any other field. Results are ordered by match
 * position (earliest first), then alphabetically, and capped at MAX_RESULTS.
 */
export function searchStops(query: string, stops: RailStop[]): RailStop[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return [];

  return stops
    .map(stop => ({ stop, at: stop.name.toLowerCase().indexOf(needle) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at || a.stop.name.localeCompare(b.stop.name))
    .slice(0, MAX_RESULTS)
    .map(({ stop }) => stop);
}

/**
 * How far beyond the loaded rail network still counts as inside the study area.
 *
 * AC 1.1.2 leaves the study-area bounding box undefined, blocked on the mode-scope
 * decision and the bus feed extent. Rather than invent coordinates, the box is derived
 * from the extent of the stops actually loaded plus this buffer, and that basis is
 * stated in the interface. Revisit once the bus and feeder feeds are inspected.
 */
export const STUDY_AREA_BUFFER_KM = 0;

const KM_PER_DEGREE_LAT = 110.574;
/** At ~22.5°N, near enough for a study-area buffer. */
const KM_PER_DEGREE_LON = 111.32 * Math.cos((22.5 * Math.PI) / 180);

const FEED_EXTENT = loadRailFeedMetadata().studyAreaFeedExtent;

export const STUDY_AREA = {
  minLat: FEED_EXTENT.minLat - STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LAT,
  maxLat: FEED_EXTENT.maxLat + STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LAT,
  minLon: FEED_EXTENT.minLon - STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LON,
  maxLon: FEED_EXTENT.maxLon + STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LON,
};

/** AC 1.1.2 — a click outside the covered area is rejected. */
export function isInStudyArea(p: LatLng): boolean {
  return (
    p.lat >= STUDY_AREA.minLat &&
    p.lat <= STUDY_AREA.maxLat &&
    p.lon >= STUDY_AREA.minLon &&
    p.lon <= STUDY_AREA.maxLon
  );
}

/** The centre of the loaded network, used as the map's default view. */
export const NETWORK_CENTRE: LatLng = SHENZHEN_CENTRE;

/** AC 1.1.2 — coordinates are shown to 5 decimal places. */
export function formatCoord(p: LatLng): string {
  return `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
}

/**
 * AC 1.2.3 — the five components the travel time budget is spent on.
 *
 * Every component the budget covers is listed whether or not it is modelled yet. A
 * component that is not yet modelled says so; none is silently excluded, and no blocked
 * value is filled in with a plausible-looking number. `owner` names the epic or decision
 * that has to resolve the component before it can be modelled.
 */
/** The configured walking speed, in km/h, for display. */
export const WALK_SPEED_KMH = Math.round(WALK_SPEED_MS * 3.6 * 10) / 10;

/**
 * AC 1.3.3 / AC 1.2.3 — modes absent from the computation, named rather than passed over
 * in silence. The wording is the epic's own.
 */
export const MODES_NOT_LOADED = '公交、授权时刻表、实时班次、拥堵和完整 OSM 步行路网尚未参与当前计算。';

/** AC 1.3.3 — the static OSM snapshot and local estimator contain no realtime feed. */
export const REALTIME_NOTE =
  '本地结果由静态地铁站快照和不规则启发式包络生成，不反映当前运营、施工、拥堵、车辆位置或临时封站情况。深圳尚无本项目已核验可公开使用的 GTFS-Realtime feed。';

// ---------------------------------------------------------------- data basis

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** "20261231" -> "31 Dec 2026" */
function formatFeedDate(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${month} ${y}`;
}

export interface DataBasis {
  feedName: string;
  serviceStart: string;
  serviceEnd: string;
  licence: string | null;
  licenceStatus: string;
  /** Weekday or weekend — reachability differs between them, so it must be stated. */
  dayType: 'weekday' | 'weekend';
  dayLabel: string;
  /** Calendars in the feed that actually serve the departure day. */
  activeCalendars: string[];
  /** Expired calendars present in the feed and excluded from the computation. */
  expiredCalendars: { serviceId: string; endDate: string }[];
  modesNotLoaded: string;
  realtimeNote: string;
  lineCount: number;
}

/**
 * Describes what the displayed result was computed from.
 *
 * The day type is derived from the configured departure time rather than assumed, so it
 * cannot drift if that time changes. Expired calendars are reported from the feed itself:
 * they are present in calendar.txt but referenced by no trip, and the graph build bounds
 * the service period besides, so no result can be drawn from them.
 */
export function getDataBasis(): DataBasis {
  const meta = loadRailFeedMetadata();
  const feed = meta.feeds[0];

  const [datePart] = DEPARTURE_TIME.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dayName = DAY_NAMES[dow];
  const dayType = dow === 0 || dow === 6 ? 'weekend' : 'weekday';

  return {
    feedName: feed.feedName,
    serviceStart: formatFeedDate(feed.serviceDateRange.start),
    serviceEnd: formatFeedDate(feed.serviceDateRange.end),
    licence: feed.licence,
    licenceStatus: feed.licenceStatus,
    dayType,
    dayLabel: DEPARTURE_TIME_LABEL,
    activeCalendars: feed.serviceCalendars
      .filter(c => c.referencedByTrips && !c.expired && c.days.includes(dayName))
      .map(c => c.serviceId),
    expiredCalendars: feed.serviceCalendars
      .filter(c => c.expired)
      .map(c => ({ serviceId: c.serviceId, endDate: formatFeedDate(c.endDate) })),
    modesNotLoaded: MODES_NOT_LOADED,
    realtimeNote: REALTIME_NOTE,
    lineCount: feed.lines.length,
  };
}

export interface BudgetComponent {
  label: string;
  /** Marks a component whose value is inferred rather than published. */
  estimate?: boolean;
  modelled: boolean;
  /** What the component currently contributes, in plain words. */
  status: string;
  /** Who resolves it. Absent once the component is modelled. */
  owner?: string;
}

export const BUDGET_COMPONENTS: BudgetComponent[] = [
  {
    label: '步行到首个地铁站',
    modelled: true,
    status: `按 ${WALK_SPEED_KMH} km/h 估算；使用方向性包络，并避开 OSM 水域与高速缓冲区；尚未接入完整步行路网。`,
  },
  {
    label: '候车时间',
    modelled: true,
    estimate: true,
    status: '固定按 4 分钟估算，并非真实时刻表。',
  },
  {
    label: '地铁车内时间',
    modelled: true,
    estimate: true,
    status: '抽样线路上的站间距离按平均 34 km/h 估算。',
  },
  {
    label: '换乘时间',
    estimate: true,
    modelled: true,
    status: '最多模拟一次跨线换乘，统一计入 4 分钟；并非真实站内步行或候车时间。',
  },
  {
    label: '出站后步行',
    modelled: true,
    status: `按剩余时间和 ${WALK_SPEED_KMH} km/h 生成单站不规则包络，最大尺度 1.2 km；重叠区域会合并。`,
  },
];

/**
 * Assumptions the result rests on that are not themselves components of the budget.
 * Stated rather than omitted — a reachable area means little without them.
 */
export const BUDGET_ASSUMPTIONS = [
  {
    label: '步行速度',
    status: `${WALK_SPEED_KMH} km/h`,
  },
  {
    label: '出发时间',
    status: DEPARTURE_TIME_IS_PROVISIONAL
      ? `${DEPARTURE_TIME_LABEL} 是默认值；地图中的出发时间选择器会在授权时刻表接入后改变候车时间。`
      : DEPARTURE_TIME_LABEL,
  },
  {
    label: '交通方式',
    status: `静态地铁站快照 + 步行估算。${MODES_NOT_LOADED}`,
  },
];
