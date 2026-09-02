import type { MapPoint } from './location';

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  type: 'bus' | 'lrt' | 'brt' | 'mrt';
  path: MapPoint[];
  stops: TransitStop[];
  frequency: number;
}

export interface TransitStop {
  id: string;
  name: string;
  pos: MapPoint;
  lines: string[];
}
