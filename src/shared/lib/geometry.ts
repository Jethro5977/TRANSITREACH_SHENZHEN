import type { MapPoint } from '@/shared/types/location';

export function dist(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: MapPoint, b: MapPoint, t: number): MapPoint {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function midpoint(a: MapPoint, b: MapPoint): MapPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function catmullRom(points: MapPoint[], segments = 12, closed = true): MapPoint[] {
  if (points.length < 3) return points;
  const result: MapPoint[] = [];
  const n = points.length;
  const pts = closed ? [points[n - 1], ...points, points[0], points[1]] : points;

  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    for (let j = 0; j < segments; j++) {
      const t = j / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      result.push({ x, y });
    }
  }
  if (!closed) result.push(points[points.length - 1]);
  return result;
}

export function smoothPath(points: MapPoint[], segments = 8): MapPoint[] {
  if (points.length < 3) return points;
  return catmullRom(points, segments, false);
}

export function pointsToPath(points: MapPoint[], close = false): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  if (close) d += ' Z';
  return d;
}

export function pointsToSmoothPath(points: MapPoint[], close = false): string {
  if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const mid = midpoint(points[i], points[i + 1]);
    d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
  }
  if (close) {
    const mid = midpoint(points[points.length - 1], points[0]);
    d += ` Q ${points[points.length - 1].x} ${points[points.length - 1].y} ${mid.x} ${mid.y}`;
    d += ` Q ${points[0].x} ${points[0].y} ${points[0].x} ${points[0].y}`;
    d += ' Z';
  } else {
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  }
  return d;
}

export function interpolatePolygons(p1: MapPoint[], p2: MapPoint[], t: number): MapPoint[] {
  const n = Math.max(p1.length, p2.length);
  const result: MapPoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = p1[Math.floor((i / n) * p1.length)] ?? p1[p1.length - 1];
    const b = p2[Math.floor((i / n) * p2.length)] ?? p2[p2.length - 1];
    result.push(lerpPoint(a, b, t));
  }
  return result;
}
