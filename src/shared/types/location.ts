export interface MapPoint {
  x: number;
  y: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'area' | 'station' | 'landmark';
  pos: MapPoint;
  subtitle: string;
}

export interface RoadSegment {
  points: MapPoint[];
  class: 'highway' | 'arterial' | 'local';
}
