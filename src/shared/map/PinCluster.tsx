import type { MapPoint } from '@/shared/types/location';

interface PinClusterProps {
  pos: MapPoint;
  count: number;
  color?: string;
  onClick?: () => void;
}

export function PinCluster({ pos, count, color = '#0d9488', onClick }: PinClusterProps) {
  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <circle
        r="18"
        fill={color}
        opacity="0.15"
        style={{ transition: 'r 200ms ease-out' }}
      />
      <circle
        r="14"
        fill="white"
        stroke={color}
        strokeWidth="2"
        opacity="0.9"
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill={color}
      >
        {count}
      </text>
    </g>
  );
}
