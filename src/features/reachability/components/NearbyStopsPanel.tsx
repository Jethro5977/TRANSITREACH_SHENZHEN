import { MapPin, TrainFront } from 'lucide-react';
import type { PlaceResult, RailStop } from '../types';

export interface NearbyStop {
  stop: RailStop;
  distanceKm: number;
}

interface NearbyStopsPanelProps {
  place: PlaceResult;
  stops: NearbyStop[];
  onSelectStop: (stop: RailStop) => void;
}

/** Shows the nearby rail choices without pretending that a place search is itself a stop. */
export function NearbyStopsPanel({ place, stops, onSelectStop }: NearbyStopsPanelProps) {
  return (
    <section className="rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-3" aria-label="附近地铁站">
      <div className="flex gap-2">
        <MapPin size={15} className="text-teal-700 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-teal-800">你搜索的地点：{place.name}</p>
          {stops.length > 0 ? (
            <>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">
                1.5 km 内的地铁站。可直接使用该地点作为起点，或点选一个站点查看其可达范围。
              </p>
              <div className="mt-2 space-y-1.5">
                {stops.map(({ stop, distanceKm }) => (
                  <button
                    key={stop.stopId}
                    onClick={() => onSelectStop(stop)}
                    className="w-full flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <TrainFront size={13} className="text-teal-700 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700">{stop.name}</span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{distanceKm.toFixed(1)} km</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-[11px] leading-snug text-slate-600">
              在当前静态轨道站点快照的 1.5 km 范围内未找到地铁站，仍可使用该地点坐标估算步行与轨道可达范围。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
