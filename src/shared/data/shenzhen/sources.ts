export type TransitSourceStatus = 'active' | 'integration-ready' | 'not-public';

export interface TransitDataSource {
  id: string;
  title: string;
  provider: string;
  status: TransitSourceStatus;
  statusLabel: string;
  coverage: string;
  licence: string;
  url: string;
  note: string;
}

/**
 * Audited source registry for Shenzhen transit data.
 *
 * "Integration-ready" means the product has identified the official export needed for
 * a future GTFS/OTP build. It does not mean the data has been copied into this public
 * repository: Shenzhen's platform requires registration, source attribution and forbids
 * redistributing its raw resources to another party.
 */
export const SHENZHEN_TRANSIT_DATA_SOURCES: TransitDataSource[] = [
  {
    id: 'osm-metro-snapshot',
    title: '深圳轨道站点与线路关系',
    provider: 'OpenStreetMap contributors / Overpass',
    status: 'active',
    statusLabel: '已用于当前计算',
    coverage: '266 个去重地铁站、11 条线路关系与坐标',
    licence: 'ODbL，必须署名 OpenStreetMap contributors',
    url: 'https://www.openstreetmap.org/copyright',
    note: '构建时生成静态快照；浏览器运行时不依赖 Overpass。',
  },
  {
    id: 'sz-open-bus-network',
    title: '深圳公交站点、线路、站点关系与线路轨迹',
    provider: '深圳市政府数据开放平台',
    status: 'integration-ready',
    statusLabel: '已确认来源，待授权导入',
    coverage: '公交网络拓扑、站序及线路几何',
    licence: '平台非排他使用条款；成果必须注明来源，原始数据不得转让',
    url: 'https://opendata.sz.gov.cn/data/dataSet/toDataSet',
    note: '不能直接提交原始文件到公开 GitHub；应由获授权账户导出后在私有构建流程中转换为 GTFS。',
  },
  {
    id: 'sz-open-metro-timetable',
    title: '地铁运营时刻表与站点换乘信息',
    provider: '深圳市政府数据开放平台',
    status: 'integration-ready',
    statusLabel: '已确认来源，待授权导入',
    coverage: '首末班、运营时刻与换乘数据',
    licence: '平台服务条款及具体数据集开放条件',
    url: 'https://opendata.sz.gov.cn/',
    note: '导入后可替换固定候车、车速和换乘假设；当前公开包未包含这些受平台条款约束的原始记录。',
  },
  {
    id: 'shenzhen-realtime',
    title: '车辆位置、到站预测与临时运营状态',
    provider: '尚无已核验的公开 GTFS-Realtime 来源',
    status: 'not-public',
    statusLabel: '未接入',
    coverage: 'GTFS-RT TripUpdates、VehiclePositions、ServiceAlerts',
    licence: '需要运营方公开接口、授权及稳定服务承诺',
    url: 'https://gtfs.org/documentation/realtime/reference/',
    note: '不得使用逆向接口或把历史研究数据标为即时数据；取得官方 feed 后可由 OTP 直接应用更新。',
  },
];

