import type { AreaProfile } from '@/shared/types/area';

export const AREA_PROFILES: AreaProfile[] = [
  {
    id: 'a1', name: 'Bandar Utama', pos: { x: 620, y: 240 }, radius: 45,
    typology: 'transit-oriented', population: 42000, density: 9300,
    scores: { walkability: 72, transit: 85, serviceAccess: 78, roadConnectivity: 80, affordability: 45 },
    features: [
      { label: 'Street density', value: 82 },
      { label: 'Junction density', value: 75 },
      { label: 'Land-use mix', value: 68 },
      { label: 'Pedestrian infrastructure', value: 70 },
      { label: 'Transit stop density', value: 88 },
    ],
    similarAreas: ['a2', 'a3'],
  },
  {
    id: 'a2', name: 'TTDI', pos: { x: 680, y: 200 }, radius: 40,
    typology: 'urban-core', population: 38000, density: 8800,
    scores: { walkability: 78, transit: 80, serviceAccess: 82, roadConnectivity: 76, affordability: 42 },
    features: [
      { label: 'Street density', value: 85 },
      { label: 'Junction density', value: 80 },
      { label: 'Land-use mix', value: 74 },
      { label: 'Pedestrian infrastructure', value: 76 },
      { label: 'Transit stop density', value: 82 },
    ],
    similarAreas: ['a1', 'a4'],
  },
  {
    id: 'a3', name: 'Subang Jaya SS15', pos: { x: 200, y: 530 }, radius: 42,
    typology: 'transit-oriented', population: 35000, density: 7900,
    scores: { walkability: 70, transit: 82, serviceAccess: 75, roadConnectivity: 78, affordability: 52 },
    features: [
      { label: 'Street density', value: 78 },
      { label: 'Junction density', value: 72 },
      { label: 'Land-use mix', value: 70 },
      { label: 'Pedestrian infrastructure', value: 65 },
      { label: 'Transit stop density', value: 85 },
    ],
    similarAreas: ['a1', 'a5'],
  },
  {
    id: 'a4', name: 'Section 17', pos: { x: 250, y: 320 }, radius: 38,
    typology: 'urban-core', population: 28000, density: 7200,
    scores: { walkability: 76, transit: 72, serviceAccess: 80, roadConnectivity: 74, affordability: 55 },
    features: [
      { label: 'Street density', value: 80 },
      { label: 'Junction density', value: 78 },
      { label: 'Land-use mix', value: 76 },
      { label: 'Pedestrian infrastructure', value: 72 },
      { label: 'Transit stop density', value: 70 },
    ],
    similarAreas: ['a2', 'a3'],
  },
  {
    id: 'a5', name: 'Ara Damansara', pos: { x: 450, y: 430 }, radius: 44,
    typology: 'suburban', population: 22000, density: 5100,
    scores: { walkability: 52, transit: 58, serviceAccess: 48, roadConnectivity: 65, affordability: 62 },
    features: [
      { label: 'Street density', value: 55 },
      { label: 'Junction density', value: 50 },
      { label: 'Land-use mix', value: 42 },
      { label: 'Pedestrian infrastructure', value: 48 },
      { label: 'Transit stop density', value: 60 },
    ],
    similarAreas: ['a3', 'a6'],
  },
  {
    id: 'a6', name: 'PJD Outskirts', pos: { x: 380, y: 180 }, radius: 50,
    typology: 'peri-urban', population: 15000, density: 3200,
    scores: { walkability: 38, transit: 42, serviceAccess: 35, roadConnectivity: 50, affordability: 70 },
    features: [
      { label: 'Street density', value: 40 },
      { label: 'Junction density', value: 35 },
      { label: 'Land-use mix', value: 30 },
      { label: 'Pedestrian infrastructure', value: 32 },
      { label: 'Transit stop density', value: 45 },
    ],
    similarAreas: ['a5'],
  },
];
