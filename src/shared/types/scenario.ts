import type { MapPoint } from './location';

export interface ScenarioRoute {
  id: string;
  name: string;
  type: 'proposed' | 'suspended';
  color: string;
  path: MapPoint[];
  stops: { name: string; pos: MapPoint }[];
}
