import { useState } from 'react';
import { AlertTriangle, ChevronDown, Clock, Crosshair, Database, Footprints, Loader2, Maximize2, Minimize2, RotateCw, X } from 'lucide-react';
import { Tooltip } from '@/shared/ui';
import {
  BaseMap,
  LocationSearch,
  TimeBudgetSelector,
  useReachability,
  type RailStop,
  type ReachabilityState,
} from '@/features/reachability';
import {
  formatCoord,
  STUDY_AREA_BUFFER_KM,
  BUDGET_COMPONENTS,
  BUDGET_ASSUMPTIONS,
  getDataBasis,
} from '@/features/reachability/reachabilityService';
import { linesForStop } from '@/shared/data/adapters/gtfsAdapter';
import { loadRailStops } from '@/shared/data/adapters/gtfsAdapter';
import { useSearchParams } from 'react-router-dom';

interface MapPageProps {
  onToast: (message: string, icon?: string) => void;
}

export function MapPage({ onToast }: MapPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const stopId = searchParams.get('stop');
  const initialLocation = loadRailStops().find(stop => stop.stopId === stopId) ?? null;
  const [configOpen, setConfigOpen] = useState(true);
  const reach = useReachability(initialLocation, onToast);

  const selectStop = (stop: RailStop) => {
    reach.selectStop(stop);
    setSearchParams({ stop: stop.stopId }, { replace: true });
  };

  const selectPoint = (at: { lat: number; lon: number }) => {
    reach.selectPoint(at);
    setSearchParams({}, { replace: true });
  };

  return (
    // top-16 rather than pt-16: an absolutely positioned child resolves inset-0 against
    // the padding box, so padding here would let the map slide under the navbar.
    <div className="fixed left-0 right-0 bottom-0 top-16 overflow-hidden">
      <div className="absolute inset-0">
        <BaseMap
          origin={reach.origin}
          regions={reach.state.status === 'ready' ? reach.state.result.regions : null}
          onMapClick={selectPoint}
        />
      </div>

      <ResultPanel state={reach.state} onRetry={reach.retry} />

      {/* The budget composition note makes the panel tall enough to overflow a short
          viewport, so it scrolls internally rather than running off the bottom — the
          note has to stay reachable to satisfy AC 1.2.3. */}
      <div className={`absolute top-4 left-4 sm:left-6 z-[500] max-h-[calc(100%-2rem)] transition-all duration-300 ease-out ${configOpen ? 'w-[340px] max-w-[calc(100vw-2rem)]' : 'w-12'}`}>
        <div className="glass p-4 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className="flex items-center justify-between mb-3">
            {configOpen && <h2 className="text-sm font-bold text-slate-800 tracking-wide">深圳出发点</h2>}
            <Tooltip content={configOpen ? '收起' : '展开'}>
              <button onClick={() => setConfigOpen(prev => !prev)} className="btn-icon ml-auto" style={{ width: 32, height: 32 }}>
                {configOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </Tooltip>
          </div>

          {configOpen && (
            <div className="space-y-4 fade-in">
              <LocationSearch
                onSelect={selectStop}
                selected={reach.origin?.stop ?? null}
                compact
              />

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
                    onClick={reach.clearOrigin}
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
                  搜索深圳地铁站，或直接点击地图选择出发点。
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">时间预算</label>
                <TimeBudgetSelector value={reach.timeBudget} onChange={reach.changeTimeBudget} />
              </div>

              <BudgetCompositionNote />

              <div className="pt-2 border-t border-slate-200/70">
                <CoveredAreaNote />
              </div>
            </div>
          )}
        </div>
      </div>
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
        <div className="text-sm font-mono text-slate-700">{formatCoord(origin.at)}</div>
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
}: {
  state: ReachabilityState;
  onRetry: () => void;
}) {
  const [dismissed, setDismissed] = useState<number | null>(null);

  if (state.status === 'idle') return null;

  return (
    <div className="absolute top-4 right-4 sm:right-6 z-[500] w-[300px] max-w-[calc(100vw-2rem)]">
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
            {state.budgetMinutes} 分钟 Demo 可达范围
          </div>
          <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {state.result.areaKm2.toFixed(1)}
            <span className="text-sm font-semibold text-slate-400 ml-1">km²</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {state.result.regions.length === 1
              ? '1 个连续区域'
              : `${state.result.regions.length} 个可达区域`}
          </div>

          {/* AC 1.3.1 — the boundary is modelled, not a surveyed line. */}
          <p className="text-[11px] text-slate-400 leading-snug mt-2 pt-2 border-t border-slate-200/70">
            启发式模型边界，并非精确导航结果；边界内外的细小差异不具统计意义。
          </p>

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

      {/* AC 1.3.3 — the data basis accompanies a displayed result, and only a result. */}
      {state.status === 'ready' && <DataBasisNote />}
    </div>
  );
}

/**
 * AC 1.3.3 — what the displayed result was computed from.
 *
 * Shown only alongside a drawn area, since it describes that result. Every value is read
 * from the feed metadata rather than written by hand, so it cannot drift from the data the
 * engine was actually built on. The OpenStreetMap attribution required by the same
 * criterion is Leaflet's own control on the map, which is not dismissible.
 */
function DataBasisNote() {
  const [open, setOpen] = useState(false);
  const basis = getDataBasis();

  return (
    <div className="glass p-3.5 mt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 text-left"
        aria-expanded={open}
      >
        <Database size={13} className="text-slate-500 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide flex-1">
          数据与模型说明
        </span>
        <ChevronDown
          size={14}
          className="text-slate-400 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 200ms ease-out' }}
        />
      </button>

      {/* Always visible, expanded or not: the scope of the result and its basis in time. */}
      <div className="mt-2 space-y-1 text-[11px] leading-snug">
        <div>
          <span className="font-semibold text-slate-700">{basis.feedName}</span>
          <span className="text-slate-500"> — {basis.lineCount} 条线路的静态站点快照</span>
        </div>
        <div className="text-slate-600">
          出发假设：{basis.dayLabel}
          {basis.activeCalendars.length > 0 && (
            <span className="text-slate-400"> (calendar {basis.activeCalendars.join(', ')})</span>
          )}
        </div>
        <div className="text-slate-600">{basis.modesNotLoaded}</div>
      </div>

      {open && (
        <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1.5 text-[11px] leading-snug fade-in">
          <p className="text-slate-600">{basis.realtimeNote}</p>

          {basis.expiredCalendars.length > 0 && (
            <p className="text-slate-600">
              <span className="font-semibold text-slate-700">Expired service excluded:</span>{' '}
              the feed also contains{' '}
              {basis.expiredCalendars.map(c => `${c.serviceId} (ended ${c.endDate})`).join(' and ')}.
              No trip references {basis.expiredCalendars.length > 1 ? 'them' : 'it'}, and the graph
              build bounds the service period, so no result is drawn from expired service.
            </p>
          )}

          <p className="text-slate-600">
            <span className="font-semibold text-slate-700">底图与站点坐标：</span> OpenStreetMap（ODbL）。
            地图右下角持续显示署名。
          </p>

          <p className="text-slate-500">
            <span className="font-semibold text-slate-600">数据许可：</span>{' '}
            {basis.licence ?? basis.licenceStatus}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * AC 1.2.3 — what the travel time budget is spent on.
 *
 * Collapsed by default. The criterion is triggered by the user "viewing how the travel
 * time was arrived at", so putting it behind a labelled control is faithful to that and
 * keeps the panel readable — but everything it must disclose is still here, and no
 * component is dropped for being unmodelled.
 *
 * The wording is deliberately a rider's, not the project's: what counts against the
 * budget and what is missing from it, with no epic names or internal owners. Honesty
 * about the model is required; internal process vocabulary is not, and reads as an
 * unfinished note to anyone outside the team.
 */
function BudgetCompositionNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-chip rounded-xl px-3 py-2.5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex-1">
          这段时间如何估算
        </span>
        <ChevronDown
          size={14}
          className="text-slate-400 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 200ms ease-out' }}
        />
      </button>

      {open && (
        <div className="fade-in">
          <ul className="space-y-1.5 mt-2">
            {BUDGET_COMPONENTS.map(component => (
              <li key={component.label} className="text-[11px] leading-snug">
                <span className="font-semibold text-slate-700">{component.label}</span>
                {component.estimate && (
                  <span className="ml-1.5 px-1 py-px rounded bg-amber-100 text-amber-800 font-semibold text-[10px] uppercase tracking-wide">
                    Demo 估算
                  </span>
                )}
                <div className="text-slate-500">{component.status}</div>
              </li>
            ))}
          </ul>

          <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1">
            {BUDGET_ASSUMPTIONS.map(assumption => (
              <div key={assumption.label} className="text-[11px] leading-snug">
                <span className="font-semibold text-slate-700">{assumption.label}:</span>{' '}
                <span className="text-slate-500">{assumption.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * What "covered area" means — the bound a map click is rejected against.
 *
 * The study-area boundary is not yet agreed: it depends on the extent of the bus feed,
 * which is not loaded. Rather than invent a boundary, it is derived from the rail network
 * actually loaded, and that basis is stated here so the reader can see what the limit is.
 *
 * Lives inside the configuration panel rather than floating over the map. As a separate
 * bottom-left box it collided with the panel above it once the travel-time disclosure was
 * expanded — two independently positioned overlays sharing one column will always be one
 * content change away from overlapping. Keeping it in the panel's flow removes the class
 * of bug rather than re-tuning heights.
 */
function CoveredAreaNote() {
  return (
    <p className="text-[11px] text-slate-500 leading-relaxed">
      <span className="font-semibold text-slate-600">可选范围：</span>
      深圳市域 Demo 边界（按静态站点数据范围，外扩 {STUDY_AREA_BUFFER_KM} km）。公交、实时班次及真实步行路网尚未接入。
    </p>
  );
}
