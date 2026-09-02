import type { AreaProfile } from '@/shared/types/area';

const emptyScores = { walkability: 0, transit: 0, serviceAccess: 0, roadConnectivity: 0, affordability: 0 };
const district = (id: string, name: string, x: number, y: number): AreaProfile => ({ id, name, pos: { x, y }, radius: 38, typology: 'urban-core', population: 0, density: 0, scores: { ...emptyScores }, features: [], similarAreas: [] });

/** 行政区位置仅用于画布定位；量化画像尚无可信数据，故全部留为 0/空数组。 */
export const AREA_PROFILES: AreaProfile[] = [
  district('futian', '福田区', 470, 420), district('luohu', '罗湖区', 570, 420),
  district('nanshan', '南山区', 300, 450), district('baoan', '宝安区', 210, 350),
  district('longhua', '龙华区', 430, 260), district('longgang', '龙岗区', 680, 300),
  district('yantian', '盐田区', 720, 440), district('pingshan', '坪山区', 820, 300),
  district('guangming', '光明区', 300, 180), district('dapeng', '大鹏新区', 900, 460),
];
