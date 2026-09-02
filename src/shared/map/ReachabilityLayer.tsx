import { useMemo } from 'react';
import type { MapPoint } from '@/shared/types/location';
import { usePrefersReducedMotion } from '@/shared/hooks';

interface ReachabilityLayerProps {
  points: MapPoint[];
  color?: string;
  fillOpacity?: number;
  animate?: boolean;
  band?: string;
  hovered?: boolean;
}

export function ReachabilityLayer({
  points,
  color = '#14b8a6',
  fillOpacity = 0.18,
  animate = true,
  band,
  hovered = false,
}: ReachabilityLayerProps) {
  const reduced = usePrefersReducedMotion();
  const pathData = useMemo(() => {
    if (points.length < 3) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
    return `${d} Z`;
  }, [points]);

  if (!pathData) return null;

  return (
    <g style={{ opacity: hovered ? 1 : 0.95, transition: 'opacity 200ms ease-out' }}>
      <defs>
        <clipPath id={`reach-clip-${band ?? 'default'}`}><path d={pathData} /></clipPath>
        <radialGradient id={`reach-grad-${band ?? 'default'}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 1.5} />
          <stop offset="100%" stopColor={color} stopOpacity={fillOpacity * 0.6} />
        </radialGradient>
      </defs>
      <path
        d={pathData}
        fill={`url(#reach-grad-${band ?? 'default'})`}
        stroke={color}
        strokeWidth={hovered ? 2.5 : 1.5}
        strokeOpacity={hovered ? 0.8 : 0.5}
        style={{
          transformOrigin: 'center',
          animation: animate && !reduced ? 'fadeIn 500ms ease-out, scaleIn 700ms ease-out' : undefined,
        }}
      />
      <style>{`@keyframes scaleIn { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </g>
  );
}
