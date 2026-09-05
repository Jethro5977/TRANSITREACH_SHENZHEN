import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Loader2, MapPin, Search, Train } from 'lucide-react';
import { loadRailStops, linesForStop } from '@/shared/data/adapters/gtfsAdapter';
import type { PlaceResult, RailStop } from '../types';
import { searchStops, MIN_QUERY_LENGTH } from '../reachabilityService';

const PLACEHOLDER = '搜索地点、小区或地铁站';
const NO_MATCH = '未找到匹配的地点或地铁站';
const HELPER = '输入至少两个字；站名优先，也可手动搜索地点。';
const NOMINATIM_ENDPOINT = import.meta.env.VITE_GEOCODER_ENDPOINT || 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_MIN_INTERVAL_MS = 1_000;

interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export type LocationSearchResult = RailStop | PlaceResult;

interface LocationSearchProps {
  onSelect: (result: LocationSearchResult) => void;
  selected?: RailStop | null;
  compact?: boolean;
  placeholder?: string;
}

// A session cache prevents repeated user queries from hitting the shared public service.
const placeCache = new Map<string, PlaceResult[]>();
let lastNominatimRequestAt = 0;

/**
 * Station-first search with an explicit, user-triggered Nominatim fallback.
 *
 * The public Nominatim policy forbids autocomplete. Therefore changing text never sends
 * a network request: the user must choose “搜索地点”. Requests are application-wide
 * throttled to one per second and cached for the browser session.
 */
export function LocationSearch({ onSelect, selected, compact = false, placeholder = PLACEHOLDER }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [placeState, setPlaceState] = useState<'idle' | 'searching' | 'empty' | 'error'>('idle');
  const requestController = useRef<AbortController | null>(null);

  const stops = useMemo(() => loadRailStops(), []);
  const stationResults = useMemo(() => searchStops(query, stops), [query, stops]);
  const searching = query.trim().length >= MIN_QUERY_LENGTH;
  const canSearchPlaces = searching && stationResults.length === 0;

  const resetPlaceSearch = () => {
    requestController.current?.abort();
    setPlaceResults([]);
    setPlaceState('idle');
  };

  const handleSelect = (result: LocationSearchResult) => {
    onSelect(result);
    setQuery(result.name);
    setFocused(false);
    setHighlightedIdx(-1);
    setPlaceResults([]);
    setPlaceState('idle');
  };

  const searchPlaces = async () => {
    const placeQuery = query.trim();
    if (!canSearchPlaces) return;
    const cacheKey = placeQuery.toLocaleLowerCase('zh-CN');
    const cached = placeCache.get(cacheKey);
    if (cached) {
      setPlaceResults(cached);
      setPlaceState(cached.length === 0 ? 'empty' : 'idle');
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setPlaceState('searching');

    try {
      const waitMs = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimRequestAt));
      if (waitMs) await new Promise(resolve => window.setTimeout(resolve, waitMs));
      if (controller.signal.aborted) return;

      const params = new URLSearchParams({
        q: `${placeQuery} 深圳`,
        format: 'jsonv2',
        limit: '5',
        viewbox: '113.74,22.82,114.42,22.43',
        bounded: '1',
        'accept-language': 'zh',
      });
      lastNominatimRequestAt = Date.now();
      const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        // Browsers cannot set User-Agent. The deployed origin is sent as the identifying
        // Referer required by Nominatim's public policy.
        referrerPolicy: 'origin',
      });
      if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);
      const data = await response.json() as NominatimResponse[];
      const places = data
        .map(item => ({
          name: item.display_name.split(',')[0]?.trim() || placeQuery,
          fullName: item.display_name,
          lat: Number.parseFloat(item.lat),
          lon: Number.parseFloat(item.lon),
          type: item.type,
        }))
        .filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lon));
      placeCache.set(cacheKey, places);
      if (!controller.signal.aborted) {
        setPlaceResults(places);
        setPlaceState(places.length === 0 ? 'empty' : 'idle');
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.warn('Place search unavailable', error);
      setPlaceResults([]);
      setPlaceState('error');
    }
  };

  return (
    <div className="relative">
      <div className={`glass-input flex items-center gap-2 px-3.5 py-3 ${focused ? 'ring-2 ring-teal-500/20' : ''} ${compact ? 'text-sm' : ''}`}>
        <Search size={compact ? 16 : 18} className={focused ? 'text-teal-600' : 'text-slate-400'} style={{ transition: 'color 200ms ease-out' }} />
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightedIdx(-1);
            resetPlaceSearch();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlightedIdx(previous => Math.min(previous + 1, stationResults.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlightedIdx(previous => Math.max(previous - 1, 0));
            } else if (event.key === 'Enter' && highlightedIdx >= 0) {
              handleSelect(stationResults[highlightedIdx]);
            } else if (event.key === 'Enter' && canSearchPlaces) {
              event.preventDefault();
              void searchPlaces();
            }
          }}
          placeholder={placeholder}
          aria-label={PLACEHOLDER}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
        {selected && <MapPin size={16} className="text-teal-600" />}
      </div>

      {focused && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-strong p-2 z-[1000] fade-slide-up max-h-64 overflow-y-auto scrollbar-thin">
          {stationResults.length > 0 && (
            <>
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold tracking-wide text-slate-500">地铁站</p>
              {stationResults.map((stop, idx) => (
                <button
                  key={stop.stopId}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  // Preserve input focus until click runs. This prevents the blur timeout
                  // from closing a result list while a station is being selected.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(stop)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${highlightedIdx === idx ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                >
                  <Train size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{highlightName(stop.name, query)}</div>
                    <div className="text-xs text-slate-500 truncate">{linesForStop(stop).map(line => line.longName).join(' · ')}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {canSearchPlaces && (
            <div>
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold tracking-wide text-slate-500">地点（OpenStreetMap）</p>
              {placeResults.map(place => (
                <button
                  key={`${place.lat},${place.lon},${place.fullName}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(place)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-50"
                >
                  <MapPin size={16} className="text-teal-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{place.name}</div>
                    <div className="text-xs text-slate-500 truncate">{place.fullName}</div>
                  </div>
                </button>
              ))}
              {placeState === 'searching' ? (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600"><Loader2 size={14} className="spinner" />正在搜索地点…</div>
              ) : placeResults.length === 0 && placeState !== 'empty' && placeState !== 'error' ? (
                <button onClick={() => void searchPlaces()} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-teal-700 hover:bg-teal-50">搜索地点“{query.trim()}”</button>
              ) : null}
              {placeState === 'empty' && <p className="px-3 py-2.5 text-sm text-slate-600">{NO_MATCH}</p>}
              {placeState === 'error' && <p className="px-3 py-2.5 text-sm text-slate-600">地点搜索暂不可用，请改为点击地图选点。</p>}
            </div>
          )}

          {!searching && <div className="px-3 py-2 text-xs text-slate-500">{HELPER}</div>}
        </div>
      )}
    </div>
  );
}

function highlightName(name: string, query: string): ReactNode {
  const needle = query.trim();
  if (!needle) return name;
  const idx = name.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return name;
  return <>{name.slice(0, idx)}<span className="text-teal-700 font-bold">{name.slice(idx, idx + needle.length)}</span>{name.slice(idx + needle.length)}</>;
}
