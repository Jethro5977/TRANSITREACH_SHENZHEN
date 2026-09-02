/**
 * Shenzhen Metro demo snapshot.
 *
 * Coordinates are a curated subset of OpenStreetMap subway stations fetched through
 * Overpass on 2026-09-02. The subset favours interchanges and geographic coverage so the
 * local demo stays small; it is not a complete operational timetable or station list.
 */

import type { RailFeedMetadata, RailLine, RailStop } from '../adapters/gtfsAdapter';

export const SHENZHEN_CENTRE = { lat: 22.5431, lon: 114.0579 };

export const SHENZHEN_BOUNDS = {
  minLat: 22.43,
  maxLat: 22.82,
  minLon: 113.74,
  maxLon: 114.42,
};

const LINES: RailLine[] = [
  ['1', '1', '1号线', '#00a651'],
  ['2-8', '2/8', '2号线 / 8号线', '#f05a28'],
  ['3', '3', '3号线', '#00a3e0'],
  ['4', '4', '4号线', '#da1a32'],
  ['5', '5', '5号线', '#7b2b83'],
  ['6', '6', '6号线', '#00a79d'],
  ['7', '7', '7号线', '#25346f'],
  ['9', '9', '9号线', '#8b5a2b'],
  ['10', '10', '10号线', '#ee3e80'],
  ['11', '11', '11号线', '#6b3fa0'],
  ['14', '14', '14号线', '#f4b41a'],
].map(([routeId, shortName, longName, color]) => ({
  routeId,
  shortName,
  longName,
  color,
  mode: 'SUBWAY',
  stopCount: 0,
}));

type StopTuple = [name: string, lat: number, lon: number, lines: string[]];

const STOPS: StopTuple[] = [
  ['机场北', 22.6541954, 113.7932431, ['11']],
  ['机场', 22.6263870, 113.8089739, ['11']],
  ['松岗', 22.7751914, 113.8246153, ['6', '11']],
  ['碧海湾', 22.5787973, 113.8502805, ['11']],
  ['西乡', 22.5790602, 113.8569798, ['1']],
  ['宝安中心', 22.5576373, 113.8823152, ['1', '5']],
  ['前海湾', 22.5403059, 113.8927681, ['1', '5', '11']],
  ['蛇口港', 22.4797136, 113.9073872, ['2-8']],
  ['海上世界', 22.4881293, 113.9101589, ['2-8']],
  ['后海', 22.5212832, 113.9382020, ['2-8', '11']],
  ['深大', 22.5411039, 113.9389034, ['1']],
  ['高新园', 22.5432309, 113.9491278, ['1']],
  ['大学城', 22.5850344, 113.9602375, ['5']],
  ['红树湾南', 22.5261040, 113.9664581, ['9', '11']],
  ['世界之窗', 22.5398540, 113.9693070, ['1', '2-8']],
  ['华侨城', 22.5364467, 113.9804886, ['1']],
  ['深圳湾公园', 22.5244887, 113.9879978, ['9']],
  ['深圳北站', 22.6134699, 114.0256839, ['4', '5', '6']],
  ['车公庙', 22.5388378, 114.0226605, ['1', '7', '9', '11']],
  ['香蜜湖', 22.5416550, 114.0336141, ['1']],
  ['景田', 22.5561853, 114.0385546, ['2-8', '9']],
  ['民治', 22.6203757, 114.0360964, ['5']],
  ['购物公园', 22.5373797, 114.0496547, ['1', '3']],
  ['福田', 22.5427538, 114.0482367, ['2-8', '3', '11']],
  ['会展中心', 22.5375043, 114.0562535, ['1', '4']],
  ['市民中心', 22.5433288, 114.0567044, ['2-8', '4']],
  ['莲花村', 22.5513659, 114.0626684, ['3', '10']],
  ['岗厦北', 22.5434393, 114.0642711, ['2-8', '10', '11', '14']],
  ['五和', 22.6289355, 114.0556458, ['5', '10']],
  ['华强北', 22.5470120, 114.0802516, ['2-8', '7']],
  ['科学馆', 22.5433100, 114.0897584, ['1', '6']],
  ['大剧院', 22.5440073, 114.1028580, ['1', '2-8']],
  ['老街', 22.5472942, 114.1108594, ['1', '3']],
  ['国贸', 22.5424182, 114.1139070, ['1']],
  ['罗湖', 22.5333117, 114.1131787, ['1']],
  ['布吉', 22.6044178, 114.1165075, ['3', '5', '14']],
  ['文锦', 22.5450815, 114.1259145, ['9']],
  ['黄贝岭', 22.5488036, 114.1313834, ['2-8', '5']],
  ['塘坑', 22.6423791, 114.1877011, ['3']],
  ['沙头角', 22.5572091, 114.2181995, ['2-8']],
  ['海山', 22.5583269, 114.2328208, ['2-8']],
  ['大运', 22.6885420, 114.2233087, ['3', '14']],
  ['盐田路', 22.5912403, 114.2503375, ['2-8']],
  ['龙城广场', 22.7197393, 114.2498000, ['3']],
  ['双龙', 22.7316172, 114.2726386, ['3']],
  ['坪山中心', 22.7114263, 114.3472175, ['14']],
  ['光明大街', 22.7650404, 113.9379399, ['6']],
];

export const SHENZHEN_METRO_STOPS: RailStop[] = STOPS.map(([name, lat, lon, lines], index) => ({
  stopId: `sz-${index + 1}`,
  name,
  lat,
  lon,
  lines,
  platforms: [],
}));

for (const line of LINES) {
  line.stopCount = SHENZHEN_METRO_STOPS.filter(stop => stop.lines.includes(line.routeId)).length;
}

export const SHENZHEN_METRO_LINES = LINES;

export const SHENZHEN_FEED_METADATA: RailFeedMetadata = {
  feeds: [{
    feedId: 'osm-shenzhen-curated-demo',
    feedName: '深圳轨道站点开放地图快照',
    agency: '深圳地铁（线路命名） / OpenStreetMap contributors（坐标）',
    source: 'https://www.openstreetmap.org/copyright',
    licence: 'Open Database License (ODbL)',
    licenceStatus: 'OpenStreetMap attribution required',
    serviceDateRange: { start: '20260902', end: '20260902' },
    serviceCalendars: [],
    lines: LINES,
  }],
  epicLineCoverage: LINES.map(line => ({ label: line.longName, routeId: line.routeId, present: true })),
  modesNotLoaded: ['公交、实时班次与道路拥堵'],
  studyAreaFeedExtent: SHENZHEN_BOUNDS,
  notes: ['本地 Demo 仅使用精选站点，不代表完整运营数据。'],
  warnings: ['可达范围为启发式估算，不能用于实际导航。'],
};

