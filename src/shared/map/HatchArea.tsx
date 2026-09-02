import { useMemo } from 'react';
import type { MapPoint } from '@/shared/types/location';
import { usePrefersReducedMotion } from '@/shared/hooks';

interface HatchAreaProps {
  points: MapPoint[];
  type: 'lost' | 'gained';
  animate?: boolean;
}

export function HatchArea({ points, type, animate = true }: HatchAreaProps) {
  const reduced = usePrefersReducedMotion();
  const pathData = useMemo(() => {
    if (points.length < 3) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ' Z';
    return d;
  }, [points]);

  if (!pathData) return null;

  const color = type === 'lost' ? '#f43f5e' : '#22c55e';
  const patternId = `hatch-${type}`;

  return (
    <g
      style={{
        animation: animate && !reduced ? 'fadeIn 600ms ease-out' : undefined,
      }}
    >
      <defs>
        <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="2" opacity="0.4" />
        </pattern>
      </defs>
      <path
        d={pathData}
        fill={`url(#${patternId})`}
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeDasharray="6 3"
      />
    </g>
  );
}
