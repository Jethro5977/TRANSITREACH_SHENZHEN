import type { MapPoint } from '@/shared/types/location';
import { usePrefersReducedMotion } from '@/shared/hooks';

interface WalkingRouteLayerProps {
  origin: MapPoint;
  stops: MapPoint[];
  animate?: boolean;
}

export function WalkingRouteLayer({ origin, stops, animate = true }: WalkingRouteLayerProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <g>
      {stops.map((stop, i) => {
        const d = `M ${origin.x} ${origin.y} L ${stop.x} ${stop.y}`;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.4"
            strokeLinecap="round"
            className={animate && !reduced ? 'draw-route' : ''}
            style={{ animationDelay: `${i * 80}ms` }}
          />
        );
      })}
    </g>
  );
}
