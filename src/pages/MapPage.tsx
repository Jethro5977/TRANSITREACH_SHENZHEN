import { useEffect, useMemo, useRef, useState } from 'react';
import { useBudgetLayers } from '@/features/reachability/hooks/useBudgetLayers';
import { AlertTriangle, Clock, Crosshair, Footprints, Info, Loader2, MapPin, Maximize2, Minimize2, Moon, RotateCw, Sun, TrainFront, X } from 'lucide-react';
import { Tooltip } from '@/shared/ui';
import { BaseMap } from '@/features/reachability/components/BaseMap';
import { DepartureTimeSelector } from '@/features/reachability/components/DepartureTimeSelector';
import { LocationSearch, type LocationSearchResult } from '@/features/reachability/components/LocationSearch';
import { InfoModal } from '@/features/reachability/components/InfoModal';
import { NearbyStopsPanel, type NearbyStop } from '@/features/reachability/components/NearbyStopsPanel';
import { TimeBudgetSelector } from '@/features/reachability/components/TimeBudgetSelector';
import { useReachability, type ReachabilityState } from '@/features/reachability/hooks/useReachability';
import { isPlaceResult, type PlaceResult, type RailStop } from '@/features/reachability/types';
import {
  formatCoord,
} from '@/features/reachability/reachabilityService';
import { linesForStop } from '@/shared/data/adapters/gtfsAdapter';
import { loadRailStops } from '@/shared/data/adapters/gtfsAdapter';
import { useSearchParams } from 'react-router-dom';
import { DEPARTURE_PROFILES, getDepartureProfile } from '@/shared/data/shenzhen/timetable';

interface MapPageProps {
  onToast: (message: string, icon?: string) => void;
}

function parsePlaceSearchParams(searchParams: URLSearchParams): PlaceResult | null {
  const lat = Number.parseFloat(searchParams.get('lat') ?? '');
  const lon = Number.parseFloat(searchParams.get('lon') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const name = searchParams.get('name')?.trim() || '地图选点';
  return { lat, lon, name, fullName: name, type: 'place' };
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const latScale = 110.574;
  const lonScale = 111.32 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.hypot((a.lat - b.lat) * latScale, (a.lon - b.lon) * lonScale);
}

export function MapPage({ onToast }: MapPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const stopId = searchParams.get('stop');
  const initialLocation = loadRailStops().find(stop => stop.stopId === stopId) ?? null;
  const initialPlace = useMemo(() => initialLocation ? null : parsePlaceSearchParams(searchParams), [initialLocation, searchParams]);
  const [configOpen, setConfigOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  const [nearbyPlace, setNearbyPlace] = useState<PlaceResult | null>(initialPlace);
  const [mode, setMode] = useState(searchParams.get('mode') === 'reverse' ? 'reverse' : 'forward');
  const [overlayMode, setOverlayMode] = useState(searchParams.get('overlay') === '1');
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef(0);
  const didDrag = useRef(false);
  const initialBudget = Number(searchParams.get('budget'));
  const initialProfile = DEPARTURE_PROFILES.find(p => p.id === searchParams.get('departure'))?.id;
  const reach = useReachability(initialLocation, initialPlace, onToast, [15, 30, 45, 60].includes(initialBudget) ? initialBudget : 30, initialProfile);
  const layers = useBudgetLayers(reach.origin, reach.departureProfile, overlayMode);

  useEffect(() => {
    const params = new URLSearchParams();
    const origin = reach.origin;
    if (origin?.stop) params.set('stop', origin.stop.stopId);
    else if (origin) {
      params.set('lat', String(origin.at.lat));
      params.set('lon', String(origin.at.lon));
      if (origin.place) params.set('name', origin.place.name);
    }
    params.set('budget', String(reach.timeBudget));
    params.set('mode', mode);
    params.set('departure', reach.departureProfile);
    if (overlayMode) params.set('overlay', '1');
    setSearchParams(params, { replace: true });
  }, [reach.origin, reach.timeBudget, reach.departureProfile, mode, overlayMode, setSearchParams]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onToast('查询链接已复制，包含地点、方向和时间设置', '✓');
    } catch { onToast('复制未成功，请复制浏览器地址栏链接', '!'); }
  };
  const exportImage = async () => {
    if (!captureRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      await document.fonts.ready;
      const images = [...captureRef.current.querySelectorAll<HTMLImageElement>('.leaflet-tile')];
      await Promise.race([
        Promise.all(images.map(image => image.decode())),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error('底图加载超时')), 10000)),
      ]);
      const url = await toPng(captureRef.current, {
        pixelRatio: 2, skipFonts: true, backgroundColor: '#f8fafc',
        style: { position: 'relative', top: '0', left: '0', right: 'auto', bottom: 'auto', margin: '0' },
        filter: node => !(node instanceof HTMLElement && node.dataset.exportExclude === 'true'),
      });
      const link = document.createElement('a');
      link.download = `触达深圳-${mode}-${reach.timeBudget}分钟.png`;
      link.href = url;
      link.click();
      onToast('通勤地图已保存为 PNG', '✓');
    } catch { onToast('截图失败，请等待底图加载完成后重试', '!'); }
    finally { setExporting(false); }
  };
  const reachableStopIds = useMemo(() => (
    reach.state.status === 'ready'
      ? new Set(reach.state.result.reachableStations.map(({ stop }) => stop.stopId))
      : undefined
  ), [reach.state]);

  const nearbyStops = useMemo<NearbyStop[]>(() => {
    if (!nearbyPlace) return [];
    return loadRailStops()
      .map(stop => ({ stop, distanceKm: distanceKm(nearbyPlace, stop) }))
      .filter(item => item.distanceKm <= 1.5)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [nearbyPlace]);

  const selectStop = (stop: RailStop) => {
    reach.selectStop(stop);
    setNearbyPlace(null);
  };

  const selectPoint = (at: { lat: number; lon: number }) => {
    reach.selectPoint(at);
    setNearbyPlace(null);
    setMobileExpanded(false);
  };

  const selectSearchResult = (result: LocationSearchResult) => {
    if (!isPlaceResult(result)) {
      selectStop(result);
      return;
    }
    reach.selectPlace(result);
    setNearbyPlace(result);
  };

  const resultMetadata = reach.state.status === 'ready'
    ? reach.state.result
    : { departureLabel: getDepartureProfile(reach.departureProfile).label, timetableStatus: 'demo-fallback' as const };

  return (
    // top-16 rather than pt-16: an absolutely positioned child resolves inset-0 against
    // the padding box, so padding here would let the map slide under the navbar.
    <div ref={captureRef} className="commute-map fixed left-0 right-0 bottom-0 top-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <BaseMap
          origin={reach.origin}
          regions={reach.state.status === 'ready' ? reach.state.result.regions : null}
          reachableStopIds={reachableStopIds}
          stations={reach.state.status === 'ready' ? reach.state.result.reachableStations : undefined}
          layers={layers.results}
          onMapClick={selectPoint}
          theme={mapTheme}
        />
      </div>

      <ResultPanel state={reach.state} onRetry={reach.retry} mode={mode} onExample={name => { const stop = loadRailStops().find(s => s.name === name); if (stop) selectStop(stop); }} />
      <div className="map-actions absolute bottom-12 right-4 z-[600] flex gap-2" data-export-exclude="true">
        <button className="btn-secondary text-xs px-3 py-2" onClick={share}>复制分享链接</button>
        <button className="btn-secondary text-xs px-3 py-2" disabled={exporting || reach.state.status !== 'ready' || layers.pending} onClick={exportImage}>{exporting ? '正在保存…' : '保存截图'}</button>
      </div>
      {overlayMode && <div className="budget-legend absolute bottom-24 right-4 z-[600] glass p-3 text-xs" aria-live="polite">
        {layers.pending ? '正在生成四档通勤圈…' : layers.error ? '叠加计算未完成，请关闭后重试' : '时间预算对比'}
        <div className="flex gap-3 mt-2">{[15,30,45,60].map((n,i) => <span key={n}><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: ['#0f766e','#14b8a6','#5eead4','#99f6e4'][i] }} />{n}分</span>)}</div>
      </div>}

      {/* The budget composition note makes the panel tall enough to overflow a short
          viewport, so it scrolls internally rather than running off the bottom — the
          note has to stay reachable to satisfy AC 1.2.3. */}
      <div className={`map-config-panel ${mobileExpanded ? 'mobile-expanded' : 'mobile-collapsed'} absolute top-4 left-4 sm:left-6 z-[500] max-h-[calc(100%-2rem)] transition-all duration-300 ease-out ${configOpen ? 'w-[340px] max-w-[calc(100vw-2rem)]' : 'w-12'}`}>
        <div className="map-config-card glass p-4 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden scrollbar-thin">
          <button className="drawer-handle sm:hidden w-full text-xs text-slate-500 pb-2" aria-expanded={mobileExpanded}
            onClick={() => { if (!didDrag.current) setMobileExpanded(v => !v); setConfigOpen(true); }}
            onPointerDown={e => { didDrag.current = false; dragStart.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerUp={e => { if (Math.abs(e.clientY - dragStart.current) > 20) { didDrag.current = true; setMobileExpanded(e.clientY < dragStart.current); setConfigOpen(true); } }}
          >━ {mobileExpanded ? '收起配置' : '展开配置'}</button>
          <div className="config-heading flex items-center justify-between mb-3">
            {configOpen && <h2 className="text-sm font-bold text-slate-800 tracking-wide">{mode === 'reverse' ? '我的工作地点' : '深圳出发点'}</h2>}
            {configOpen && (
              <Tooltip content={mapTheme === 'light' ? '切换暗色底图' : '切换浅色底图'}>
                <button onClick={() => setMapTheme(theme => theme === 'light' ? 'dark' : 'light')} className="btn-icon mr-1" style={{ width: 32, height: 32 }} aria-label={mapTheme === 'light' ? '切换暗色底图' : '切换浅色底图'} title={mapTheme === 'light' ? '切换暗色地图' : '切换亮色地图'}>
                  {mapTheme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                </button>
              </Tooltip>
            )}
            <Tooltip content={configOpen ? '收起' : '展开'}>
              <button onClick={() => setConfigOpen(prev => !prev)} className="btn-icon ml-auto" style={{ width: 32, height: 32 }}>
                {configOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </Tooltip>
          </div>

          {configOpen && (
            <div className="space-y-4 fade-in">
              <LocationSearch
                onSelect={selectSearchResult}
                selected={reach.origin?.stop ?? null}
                compact
                placeholder={mode === 'reverse' ? '输入工作地点或目的地' : '搜索地点、小区或地铁站'}
              />

              <div className="mobile-budget sm:hidden"><TimeBudgetSelector value={reach.timeBudget} onChange={reach.changeTimeBudget} /></div>
              <div className="config-details space-y-4">
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs" role="group" aria-label="通勤方向">
                {(['forward', 'reverse'] as const).map(value => <button key={value} aria-pressed={mode === value} className={`flex-1 py-2 ${mode === value ? 'bg-teal-600 text-white' : 'text-slate-600'}`} onClick={() => setMode(value)}>{value === 'forward' ? '📍 从这里出发' : '🏢 到达这里'}</button>)}
              </div>

              <div className="flex items-center gap-2">
                {/* AC 1.1.4 — the permission is requested on this tap and nowhere else. */}
                <button
                  onClick={reach.requestDeviceLocation}
                  className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
                >
                  <Crosshair size={14} />
                  使用我的位置
                </button>
                {reach.origin && (
                  <button
                    onClick={() => { reach.clearOrigin(); setNearbyPlace(null); }}
                    className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3"
                  >
                    <X size={14} />
                    清除
                  </button>
                )}
              </div>

              {reach.origin && <OriginReadout origin={reach.origin} />}

              {!reach.origin && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  搜索地点、小区或地铁站，或直接点击地图选择出发点。
                </p>
              )}

              {nearbyPlace && <NearbyStopsPanel place={nearbyPlace} stops={nearbyStops} onSelectStop={selectStop} />}

              <div className="desktop-budget hidden sm:block">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">时间预算</label>
                <TimeBudgetSelector value={reach.timeBudget} onChange={reach.changeTimeBudget} />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={overlayMode} onChange={e => setOverlayMode(e.target.checked)} />叠加显示 15 / 30 / 45 / 60 分钟</label>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">出发时间</label>
                <DepartureTimeSelector value={reach.departureProfile} onChange={reach.changeDepartureProfile} />
              </div>

              <button onClick={() => setInfoOpen(true)} className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-xs py-2.5">
                <Info size={14} />
                数据来源与模型说明
              </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        departureLabel={resultMetadata.departureLabel}
        timetableStatus={resultMetadata.timetableStatus}
      />
    </div>
  );
}

/**
 * AC 1.1.2 — a map-selected point shows its coordinate to 5 decimal places. A stop shows
 * the exact feed name and the lines serving it. No walking distance, walking time or
 * nearest stop is produced here; those belong to the First-Mile Walking Access epic.
 */
function OriginReadout({ origin }: { origin: NonNullable<ReturnType<typeof useReachability>['origin']> }) {
  const label =
    origin.source === 'stop' ? '已选地铁站'
    : origin.source === 'device' ? '我的位置'
    : origin.source === 'place' ? '搜索地点'
    : '地图选点';

  return (
    <div className="glass-chip rounded-xl px-3 py-2.5">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      {origin.stop ? (
        <>
          <div className="text-sm font-semibold text-slate-800">{origin.stop.name}</div>
          <div className="text-xs text-slate-500">
            {linesForStop(origin.stop).map(line => line.longName).join(' · ')}
          </div>
        </>
      ) : (
        <>
          {origin.place && <div className="text-sm font-semibold text-slate-800">{origin.place.name}</div>}
          <div className="text-sm font-mono text-slate-700">{formatCoord(origin.at)}</div>
        </>
      )}
    </div>
  );
}

/**
 * The result, and the states that are not a result.
 *
 * AC 1.3.2 requires computing, failure and valid-result states to be visually distinct
 * and never confused with one another. AC 1.2.4's walking-only outcome is a *valid
 * finding*, so it deliberately carries no error styling and no retry control — only the
 * failure state does.
 */
function ResultPanel({
  state,
  onRetry,
  mode,
  onExample,
}: {
  state: ReachabilityState;
  onRetry: () => void;
  mode: string;
  onExample: (name: string) => void;
}) {
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [expandedStations, setExpandedStations] = useState(false);

  if (state.status === 'idle') return <div className="result-panel absolute top-4 right-4 z-[500] w-[320px] max-w-[calc(100vw-2rem)] glass p-4"><h2 className="font-bold text-sm">📍 {mode === 'reverse' ? '选择工作地点' : '选择起点'}</h2><p className="text-xs text-slate-500 my-3">搜索地点或地铁站，或点击地图开始分析通勤范围。</p><div className="flex gap-2">{['福田','深圳北','车公庙'].map(name => <button className="chip chip-unselected" key={name} onClick={() => onExample(name)}>{name}</button>)}</div></div>;

  return (
    <div className="result-panel absolute top-4 right-4 sm:right-6 z-[500] w-[320px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
      {state.status === 'computing' && (
        <div className="glass p-3.5 flex items-center gap-2.5">
          <Loader2 size={16} className="spinner text-teal-600 shrink-0" />
          <span className="text-sm font-medium text-slate-700">
            正在估算 {state.budgetMinutes} 分钟可达范围…
          </span>
        </div>
      )}

      {state.status === 'failed' && (
        <div className="glass p-3.5 border border-rose-200" style={{ background: 'rgba(255,241,242,0.92)' }}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900">
                无法生成可达范围，请重试。
              </p>
              <button
                onClick={onRetry}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-2.5 mt-2"
              >
                <RotateCw size={13} />
                重试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AC 1.3.2 — a timeout reads distinctly from a failure: it names the limit that was
          exceeded, rather than implying the computation went wrong. Amber, not rose. */}
      {state.status === 'timedout' && (
        <div className="glass p-3.5 border border-amber-200" style={{ background: 'rgba(255,251,235,0.92)' }}>
          <div className="flex items-start gap-2.5">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                计算超过 {Math.round(state.limitMs / 1000)} 秒，未能生成 {state.budgetMinutes} 分钟范围。
              </p>
              <button
                onClick={onRetry}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-2.5 mt-2"
              >
                <RotateCw size={13} />
                重试
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === 'ready' && (
        <div className="glass p-3.5">
          {/* AC 1.2.2 — this label comes from the state the area was computed with, never
              from the selector, so the two cannot disagree. */}
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {state.budgetMinutes} 分钟{mode === 'reverse' ? '通勤圈 · 居住选区参考' : '可达范围'}
          </div>
          <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {state.result.areaKm2.toFixed(1)}
            <span className="text-sm font-semibold text-slate-400 ml-1">km²</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {state.result.regions.length === 1
              ? '1 个融合后的不规则区域'
              : `${state.result.regions.length} 个不连续区域块`}
          </div>
          {/* AC 1.3.1 — the boundary is modelled, not a surveyed line. */}
          <p className="text-[11px] text-amber-700 mt-2">启发式模型近似值 · Demo{mode === 'reverse' ? '；反向模式沿用出发估算，实际通勤需核验。' : ''}</p>
          <p className="text-[11px] text-slate-400 leading-snug mt-2 pt-2 border-t border-slate-200/70">
            重叠站点包络会避开 OSM 水域、快速路、铁路与封闭区，并对山峰方向作近似衰减；仍未使用完整步行道路图，并非精确导航结果。
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/70">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <MapPin size={13} className="text-teal-700" />
              {mode === 'reverse' ? '可通勤地铁站' : '可达地铁站'}（{state.result.reachableStations.length} / 266）
            </div>
            <div className="mt-2 space-y-1.5">
              {state.result.reachableStations.slice(0, expandedStations ? undefined : 6).map(station => (
                <div key={station.stop.stopId} className="rounded-lg bg-slate-50/80 px-2 py-1.5 flex items-center gap-2">
                  <TrainFront size={12} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-700 min-w-0 flex-1 truncate">{station.stop.name}</span>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{Math.ceil(station.travelMinutes)} min</span>
                  <span className={`text-[9px] whitespace-nowrap ${station.transfers === 0 ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {station.transfers === 0 ? '直达' : '1 次换乘'}
                  </span>
                </div>
              ))}
              {state.result.reachableStations.length === 0 && (
                <p className="text-[11px] text-slate-500">当前预算内没有满足模型条件的地铁站。</p>
              )}
            </div>
            {state.result.reachableStations.length > 6 && (
              <button
                onClick={() => setExpandedStations(value => !value)}
                className="mt-2 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
              >
                {expandedStations ? '收起站点列表' : `展开全部 ${state.result.reachableStations.length} 个站点`}
              </button>
            )}
            <p className="text-[10px] text-slate-400 leading-snug mt-2">
              到达时间含起点步行、模型候车、车内与最多一次换乘估算；不代表运营方行程建议。
            </p>
          </div>

          {/* AC 1.2.4 — a valid finding, not an error. Dismissible, and it does not block
              interaction with the map. */}
          {state.walkingOnly && dismissed !== state.budgetMinutes && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 flex items-start gap-2">
              <Footprints size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-snug flex-1">
                该点在 Demo 接驳阈值内没有地铁站，因此当前仅显示步行估算范围。
              </p>
              <button
                onClick={() => setDismissed(state.budgetMinutes)}
                className="text-slate-400 hover:text-slate-600 shrink-0"
                aria-label="关闭"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
