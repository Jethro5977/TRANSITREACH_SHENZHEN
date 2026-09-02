import type { MapPoint } from '@/shared/types/location';
import { usePrefersReducedMotion } from '@/shared/hooks';

interface OriginMarkerProps {
  pos: MapPoint;
  animate?: boolean;
  showPulse?: boolean;
}

export function OriginMarker({ pos, animate = true, showPulse = false }: OriginMarkerProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      {showPulse && !reduced && (
        <>
          <circle r="8" fill="#14b8a6" opacity="0.3" className="pulse-ring" />
          <circle r="8" fill="#14b8a6" opacity="0.2" className="pulse-ring" style={{ animationDelay: '300ms' }} />
        </>
      )}
      <g className={animate && !reduced ? 'marker-drop' : ''}>
        <circle r="10" fill="white" stroke="#0d9488" strokeWidth="3" style={{ filter: 'drop-shadow(0 2px 6px rgba(13,148,136,0.4))' }} />
        <circle r="4" fill="#0d9488" />
      </g>
    </g>
  );
}
