import type { MapPoint } from '@/shared/types/location';
import type { ServiceLocation } from '@/shared/types/service';

export function polygonArea(points: MapPoint[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonDifference(p1: MapPoint[], p2: MapPoint[]): MapPoint[] {
  return p2.filter(pt => !pointInPolygon(pt, p1));
}

export function servicesInPolygon(services: ServiceLocation[], polygon: MapPoint[]): ServiceLocation[] {
  return services.filter(service => pointInPolygon(service.pos, polygon));
}
