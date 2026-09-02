import { useState } from 'react';
import { CATEGORY_META } from '@/shared/data';
import type { ServiceLocation } from '@/shared/types/service';
import { usePrefersReducedMotion } from '@/shared/hooks';

interface ServiceMarkerProps {
  service: ServiceLocation;
  scale?: number;
  hovered?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  onHover?: (service: ServiceLocation | null) => void;
  animateIn?: boolean;
  index?: number;
}

export function ServiceMarker({
  service,
  scale = 1,
  hovered = false,
  selected = false,
  dimmed = false,
  onClick,
  onHover,
  animateIn = false,
  index = 0,
}: ServiceMarkerProps) {
  const reduced = usePrefersReducedMotion();
  const meta = CATEGORY_META[service.category];
  const Icon = meta.icon;
  const [pressing, setPressing] = useState(false);

  const pinSize = 28 * scale * (hovered ? 1.08 : 1);
  const haloOpacity = hovered ? 0.25 : selected ? 0.2 : 0;

  return (
    <g
      transform={`translate(${service.pos.x}, ${service.pos.y})`}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.35 : 1,
        transition: 'opacity 250ms ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        setPressing(true);
        setTimeout(() => setPressing(false), 150);
        onClick?.();
      }}
      onMouseEnter={() => onHover?.(service)}
      onMouseLeave={() => onHover?.(null)}
    >
      {animateIn && !reduced && (
        <g style={{ animation: `pinEnter 400ms ease-out ${Math.min(index * 40, 400)}ms both` }}>
          {/* Halo */}
          {haloOpacity > 0 && (
            <circle
              r={pinSize * 0.9}
              fill={meta.color}
              opacity={haloOpacity}
              style={{ transition: 'r 200ms ease-out, opacity 200ms ease-out' }}
            />
          )}
          {/* Pin shadow */}
          <ellipse cx="0" cy="2" rx={pinSize * 0.35} ry={pinSize * 0.12} fill="rgba(11,36,59,0.15)" />
          {/* Pin body */}
          <g transform={`scale(${pressing ? 0.9 : 1})`} style={{ transition: 'transform 140ms ease-out' }}>
            <circle
              r={pinSize / 2}
              fill="white"
              stroke={meta.color}
              strokeWidth="2.5"
              style={{
                filter: selected ? `drop-shadow(0 2px 6px ${meta.color}40)` : 'drop-shadow(0 1px 3px rgba(11,36,59,0.15))',
                transition: 'r 200ms ease-out',
              }}
            />
            <foreignObject
              x={-pinSize / 2 + 4}
              y={-pinSize / 2 + 4}
              width={pinSize - 8}
              height={pinSize - 8}
              style={{ pointerEvents: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Icon size={pinSize * 0.5} color={meta.color} strokeWidth={2.2} />
              </div>
            </foreignObject>
          </g>
        </g>
      )}
      {(!animateIn || reduced) && (
        <>
          {haloOpacity > 0 && (
            <circle
              r={pinSize * 0.9}
              fill={meta.color}
              opacity={haloOpacity}
              style={{ transition: 'r 200ms ease-out, opacity 200ms ease-out' }}
            />
          )}
          <ellipse cx="0" cy="2" rx={pinSize * 0.35} ry={pinSize * 0.12} fill="rgba(11,36,59,0.15)" />
          <g transform={`scale(${pressing ? 0.9 : 1})`} style={{ transition: 'transform 140ms ease-out' }}>
            <circle
              r={pinSize / 2}
              fill="white"
              stroke={meta.color}
              strokeWidth="2.5"
              style={{
                filter: selected ? `drop-shadow(0 2px 6px ${meta.color}40)` : 'drop-shadow(0 1px 3px rgba(11,36,59,0.15))',
              }}
            />
            <foreignObject
              x={-pinSize / 2 + 4}
              y={-pinSize / 2 + 4}
              width={pinSize - 8}
              height={pinSize - 8}
              style={{ pointerEvents: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Icon size={pinSize * 0.5} color={meta.color} strokeWidth={2.2} />
              </div>
            </foreignObject>
          </g>
        </>
      )}
    </g>
  );
}
