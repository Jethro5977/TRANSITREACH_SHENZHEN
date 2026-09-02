export { MAP_W, MAP_H, CITY_CENTER, RIVER_PATH, LAKE_POINTS, ROAD_NETWORK } from './mock/map';
export { TRANSIT_LINES } from './mock/transit';
export { SERVICES, CATEGORY_META, CATEGORY_ORDER } from './mock/services';
export { SEARCH_RESULTS } from './mock/locations';
export { AREA_PROFILES } from './mock/areas';
export { SCENARIO_ROUTES } from './mock/scenarios';
export { METHODOLOGY_STEPS } from './mock/methodology';

import { TRANSIT_LINES } from './mock/transit';
import { SERVICES } from './mock/services';
import { SEARCH_RESULTS } from './mock/locations';

export async function getTransitLines() {
  return TRANSIT_LINES;
}

export async function getServices() {
  return SERVICES;
}

export async function getSearchResults() {
  return SEARCH_RESULTS;
}
