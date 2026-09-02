import { useMemo, useState, type ReactNode } from 'react';
import { Search, MapPin, Train } from 'lucide-react';
import { loadRailStops, linesForStop } from '@/shared/data/adapters/gtfsAdapter';
import type { RailStop } from '../types';
import { searchStops, MIN_QUERY_LENGTH } from '../reachabilityService';

/**
 * Station and stop search.
 *
 * AC 1.1.3 — this component performs no geocoding of any kind and issues no network
 * request. A string that looks like an address ("Jalan ...", a postcode, a unit number)
 * is an ordinary non-match and gets no special handling. Do not add an address lookup,
 * a "did you mean" hint, or a geocoding fallback here.
 */

const PLACEHOLDER = '搜索深圳地铁站';
const NO_MATCH = '未找到匹配的地铁站';
const HELPER = '输入至少两个字，或直接点击地图选择起点。';

interface LocationSearchProps {
  onSelect: (stop: RailStop) => void;
  selected?: RailStop | null;
  compact?: boolean;
}

export function LocationSearch({ onSelect, selected, compact = false }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  const stops = useMemo(() => loadRailStops(), []);
  const results = useMemo(() => searchStops(query, stops), [query, stops]);

  // Below the minimum query length the field is inert: no results, no "no match".
  const searching = query.trim().length >= MIN_QUERY_LENGTH;

  const handleSelect = (stop: RailStop) => {
    onSelect(stop);
    // AC 1.1.1 — the exact feed stop name is written into the field.
    setQuery(stop.name);
    setFocused(false);
    setHighlightedIdx(-1);
  };

  return (
    <div className="relative">
      <div className={`glass-input flex items-center gap-2 px-3.5 py-3 ${focused ? 'ring-2 ring-teal-500/20' : ''} ${compact ? 'text-sm' : ''}`}>
        <Search size={compact ? 16 : 18} className={focused ? 'text-teal-600' : 'text-slate-400'} style={{ transition: 'color 200ms ease-out' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlightedIdx(-1); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIdx(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIdx(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && highlightedIdx >= 0) {
              handleSelect(results[highlightedIdx]);
            }
          }}
          placeholder={PLACEHOLDER}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
        {selected && <MapPin size={16} className="text-teal-600" />}
      </div>

      {focused && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-strong p-2 z-[1000] fade-slide-up max-h-64 overflow-y-auto scrollbar-thin">
          {results.map((stop, idx) => (
            <button
              key={stop.stopId}
              onMouseEnter={() => setHighlightedIdx(idx)}
              onClick={() => handleSelect(stop)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                highlightedIdx === idx ? 'bg-teal-50' : 'hover:bg-slate-50'
              }`}
            >
              <Train size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {highlightName(stop.name, query)}
                </div>
                {/* AC 1.1.1 — each row shows the line or lines serving the stop. */}
                <div className="text-xs text-slate-500 truncate">
                  {linesForStop(stop).map(line => line.longName).join(' · ')}
                </div>
              </div>
            </button>
          ))}

          {searching && results.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-slate-600">{NO_MATCH}</div>
          )}

          {results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">{HELPER}</div>
          )}
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
  return (
    <>
      {name.slice(0, idx)}
      <span className="text-teal-700 font-bold">{name.slice(idx, idx + needle.length)}</span>
      {name.slice(idx + needle.length)}
    </>
  );
}
