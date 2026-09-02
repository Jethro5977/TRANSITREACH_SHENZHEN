import type { MapPoint } from '@/shared/types/location';
import { catmullRom } from '@/shared/lib/geometry';

// Prototype-only synthetic isochrone. Replace through routingAdapter later.
export function generateReachPolygon(
  center: MapPoint,
  timeBudget: number,
  seed: number,
  options?: { morning?: boolean; irregularity?: number },
): MapPoint[] {
  const morning = options?.morning ?? true;
  const irregularity = options?.irregularity ?? 0.25;
  const baseRadius = 60 + timeBudget * 1.8;
  const timeFactor = morning ? 1.0 : 0.82;
  const samples = 36;

  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const points: MapPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    const n1 = Math.sin(angle * 3 + seed * 0.1) * 0.5;
    const n2 = Math.sin(angle * 7 + seed * 0.3) * 0.3;
    const n3 = rand() * irregularity;
    const noise = (n1 + n2 + n3 - 0.5) * irregularity;
    const transitBias = 1 + Math.abs(Math.cos(angle)) * 0.15 + Math.abs(Math.sin(angle * 2)) * 0.08;
    const r = baseRadius * timeFactor * (1 + noise) * transitBias;
    points.push({
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r,
    });
  }

  return catmullRom(points, 10, true);
}

// Prototype-only arbitrary display conversion.
export function mapAreaToKm2(mapArea: number): number {
  return mapArea * 0.0004;
}
