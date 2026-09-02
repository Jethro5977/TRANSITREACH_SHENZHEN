import type { MapPoint } from '@/shared/types/location';
import { usePrefersReducedMotion } from '@/shared/hooks';

interface AreaClusterProps {
  pos: MapPoint;
  radius: number;
  color: string;
  label: string;
  typology: string;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onHover?: (label: string | null) => void;
  animateIn?: boolean;
  index?: number;
}

export function AreaCluster({
  pos, radius, color, label, typology, selected = false, hovered = false,
  onClick, onHover, animateIn = false, index = 0,
}: AreaClusterProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={onClick}
      onMouseEnter={() => onHover?.(label)}
      onMouseLeave={() => onHover?.(null)}
      className={animateIn && !reduced ? 'fade-in' : ''}
      style={{ cursor: 'pointer', animationDelay: `${index * 80}ms` }}
    >
      <circle
        r={radius}
        fill={color}
        fillOpacity={selected ? 0.25 : hovered ? 0.18 : 0.1}
        stroke={color}
        strokeWidth={selected ? 2.5 : hovered ? 2 : 1.5}
        strokeOpacity={selected ? 0.8 : 0.5}
        strokeDasharray={typology === 'peri-urban' || typology === 'rural' ? '6 4' : undefined}
        style={{ transition: 'all 200ms ease-out' }}
      />
      <text
        y={radius + 14}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#0b243b"
        opacity={selected || hovered ? 1 : 0.7}
        style={{ transition: 'opacity 200ms ease-out' }}
      >
        {label}
      </text>
    </g>
  );
}
