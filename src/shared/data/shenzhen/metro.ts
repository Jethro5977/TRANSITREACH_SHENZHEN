/** Shenzhen Metro station snapshot generated from OSM route relations. */
import type { RailFeedMetadata, RailLine, RailStop } from '../adapters/gtfsAdapter';
import snapshot from './stations.generated.json';

export const SHENZHEN_DATA_SNAPSHOT_DATE = snapshot.generatedAt.slice(0, 10);
const [snapshotYear, snapshotMonth] = SHENZHEN_DATA_SNAPSHOT_DATE.split('-');
export const SHENZHEN_DATA_SNAPSHOT_LABEL = `${snapshotYear}年${Number(snapshotMonth)}月`;

export const SHENZHEN_CENTRE = { lat: 22.5431, lon: 114.0579 };
export const SHENZHEN_BOUNDS = { minLat: 22.43, maxLat: 22.82, minLon: 113.74, maxLon: 114.42 };

const lineDefinitions = [
  ['1', '1', '1号线', '#00a651'], ['2-8', '2/8', '2号线 / 8号线', '#f05a28'],
  ['3', '3', '3号线', '#00a3e0'], ['4', '4', '4号线', '#da1a32'],
  ['5', '5', '5号线', '#7b2b83'], ['6', '6', '6号线', '#00a79d'],
  ['7', '7', '7号线', '#25346f'], ['9', '9', '9号线', '#8b5a2b'],
  ['10', '10', '10号线', '#ee3e80'], ['11', '11', '11号线', '#6b3fa0'],
  ['14', '14', '14号线', '#f4b41a'],
] as const;

export const SHENZHEN_METRO_STOPS: RailStop[] = snapshot.stations.map(station => ({
  stopId: `osm-${station.osmIds[0]}`,
  name: station.name,
  lat: station.lat,
  lon: station.lon,
  lines: station.lines,
  platforms: station.osmIds.map(String),
}));

export const SHENZHEN_METRO_LINES: RailLine[] = lineDefinitions.map(([routeId, shortName, longName, color]) => ({
  routeId, shortName, longName, color, mode: 'SUBWAY',
  stopCount: SHENZHEN_METRO_STOPS.filter(stop => stop.lines.includes(routeId)).length,
}));

export const SHENZHEN_FEED_METADATA: RailFeedMetadata = {
  feeds: [{
    feedId: 'osm-shenzhen-generated-demo',
    feedName: '深圳轨道站点开放地图快照',
    agency: '深圳地铁（线路命名） / OpenStreetMap contributors（坐标与线路关系）',
    source: 'https://www.openstreetmap.org/copyright',
    licence: 'Open Database License (ODbL)',
    licenceStatus: 'OpenStreetMap attribution required',
    serviceDateRange: { start: '20260902', end: '20260902' },
    serviceCalendars: [],
    lines: SHENZHEN_METRO_LINES,
  }],
  epicLineCoverage: SHENZHEN_METRO_LINES.map(line => ({ label: line.longName, routeId: line.routeId, present: line.stopCount > 0 })),
  modesNotLoaded: ['公交、实时班次与道路拥堵'],
  studyAreaFeedExtent: SHENZHEN_BOUNDS,
  notes: [`静态快照包含 ${SHENZHEN_METRO_STOPS.length} 个去重站点，由 scripts/build-shenzhen-metro.mjs 生成。`],
  warnings: ['可达范围为启发式估算，不能用于实际导航。'],
};
