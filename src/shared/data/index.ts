export { MAP_W, MAP_H, RIVER_PATH, LAKE_POINTS, ROAD_NETWORK } from './mock/map';
export { TRANSIT_LINES } from './mock/transit';
export { SERVICES, CATEGORY_META, CATEGORY_ORDER } from './mock/services';
export { METHODOLOGY_STEPS } from './mock/methodology';

import { TRANSIT_LINES } from './mock/transit';
import { SERVICES } from './mock/services';

export async function getTransitLines() {
  return TRANSIT_LINES;
}

export async function getServices() {
  return SERVICES;
}
