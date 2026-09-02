import type { MapPoint } from './location';

export interface AreaProfile {
  id: string;
  name: string;
  pos: MapPoint;
  radius: number;
  typology: 'urban-core' | 'suburban' | 'transit-oriented' | 'peri-urban' | 'rural';
  population: number;
  density: number;
  scores: {
    walkability: number;
    transit: number;
    serviceAccess: number;
    roadConnectivity: number;
    affordability: number;
  };
  features: { label: string; value: number }[];
  similarAreas: string[];
}
