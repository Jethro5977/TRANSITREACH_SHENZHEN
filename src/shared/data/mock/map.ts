import type { MapPoint, RoadSegment } from '@/shared/types/location';

export const MAP_W = 1000;
export const MAP_H = 700;
export const CITY_CENTER: MapPoint = { x: 500, y: 360 };

export const RIVER_PATH: MapPoint[] = [
  { x: -20, y: 120 }, { x: 180, y: 160 }, { x: 320, y: 140 }, { x: 420, y: 200 },
  { x: 480, y: 260 }, { x: 520, y: 340 }, { x: 560, y: 420 }, { x: 620, y: 480 },
  { x: 720, y: 500 }, { x: 840, y: 520 }, { x: 1020, y: 540 },
];

export const LAKE_POINTS: MapPoint[] = [
  { x: 820, y: 180 }, { x: 880, y: 170 }, { x: 930, y: 200 }, { x: 950, y: 250 },
  { x: 920, y: 290 }, { x: 860, y: 300 }, { x: 810, y: 260 }, { x: 800, y: 210 },
];

export const ROAD_NETWORK: RoadSegment[] = [
  { points: [{ x: -20, y: 360 }, { x: 1020, y: 360 }], class: 'highway' },
  { points: [{ x: 500, y: -20 }, { x: 500, y: 720 }], class: 'highway' },
  { points: [{ x: -20, y: 200 }, { x: 1020, y: 200 }], class: 'arterial' },
  { points: [{ x: -20, y: 500 }, { x: 1020, y: 500 }], class: 'arterial' },
  { points: [{ x: 250, y: -20 }, { x: 250, y: 720 }], class: 'arterial' },
  { points: [{ x: 700, y: -20 }, { x: 700, y: 720 }], class: 'arterial' },
  { points: [{ x: 100, y: 100 }, { x: 900, y: 100 }], class: 'local' },
  { points: [{ x: 100, y: 620 }, { x: 900, y: 620 }], class: 'local' },
  { points: [{ x: 100, y: -20 }, { x: 100, y: 720 }], class: 'local' },
  { points: [{ x: 900, y: -20 }, { x: 900, y: 720 }], class: 'local' },
  { points: [{ x: 380, y: 100 }, { x: 380, y: 620 }], class: 'local' },
  { points: [{ x: 600, y: 100 }, { x: 600, y: 620 }], class: 'local' },
  { points: [{ x: 820, y: 100 }, { x: 820, y: 620 }], class: 'local' },
  { points: [{ x: 160, y: 200 }, { x: 160, y: 500 }], class: 'local' },
];
