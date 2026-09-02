import { useState, useMemo } from 'react';
import { Sunrise, Sunset, GitCompare, ArrowRight, ArrowLeft, Train, Building2, Clock } from 'lucide-react';
import { TransitMap, ReachabilityLayer, OriginMarker, HatchArea } from '@/shared/map';
import { ServiceMarker } from '@/features/essential-services';
import { servicesInPolygon, polygonArea, pointInPolygon } from '@/shared/lib/spatial';
import { usePrefersReducedMotion, useCountUp, useStaggeredReveal } from '@/shared/hooks';
import { generateReachPolygon, mapAreaToKm2 } from '@/shared/data/mock/reachability';
import type { MapPoint } from '@/shared/types/location';
import { SERVICES, CITY_CENTER, CATEGORY_META, CATEGORY_ORDER } from '@/shared/data';
import type { ServiceCategory } from '@/shared/types/service';

type ViewMode = 'morning' | 'evening' | 'difference';

export function TimeComparisonPage() {
  const reduced = usePrefersReducedMotion();
  const [mode, setMode] = useState<ViewMode>('morning');
  const [selectedCat, setSelectedCat] = useState<ServiceCategory>('hospital');
  const [dividerPos, setDividerPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const morningPoly = useMemo(() => generateReachPolygon(CITY_CENTER, 45, 42, { morning: true }), []);
  const eveningPoly = useMemo(() => generateReachPolygon(CITY_CENTER, 45, 42, { morning: false }), []);

  const morningArea = useMemo(() => mapAreaToKm2(polygonArea(morningPoly)), [morningPoly]);
  const eveningArea = useMemo(() => mapAreaToKm2(polygonArea(eveningPoly)), [eveningPoly]);

  const morningServices = useMemo(() => servicesInPolygon(SERVICES, morningPoly), [morningPoly]);
  const eveningServices = useMemo(() => servicesInPolygon(SERVICES, eveningPoly), [eveningPoly]);

  const morningCatServices = morningServices.filter(s => s.category === selectedCat);
  const eveningCatServices = eveningServices.filter(s => s.category === selectedCat);

  // Difference: points in morning but not evening (lost), and vice versa (gained)
  const lostPoints = useMemo(() => morningPoly.filter(p => !pointInPolygon(p, eveningPoly)), [morningPoly, eveningPoly]);
  const gainedPoints = useMemo(() => eveningPoly.filter(p => !pointInPolygon(p, morningPoly)), [eveningPoly, morningPoly]);

  const handleDividerDrag = (clientX: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setDividerPos(Math.max(10, Math.min(90, pct)));
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 15% 20%, rgba(20,184,166,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(37,99,235,0.04) 0%, transparent 50%)' }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 fade-slide-up">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Time-of-Day Comparison</h1>
          <p className="text-slate-600">See how reachability changes between morning and evening schedules.</p>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="glass-chip p-1 flex gap-1 rounded-xl">
            {([
              { id: 'morning' as ViewMode, label: 'Morning', icon: Sunrise, color: '#f59e0b' },
              { id: 'evening' as ViewMode, label: 'Evening', icon: Sunset, color: '#6366f1' },
              { id: 'difference' as ViewMode, label: 'Difference', icon: GitCompare, color: '#0d9488' },
            ]).map(tab => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`chip ${active ? 'chip-selected' : 'chip-unselected'}`}
                  style={active ? { background: tab.color, borderColor: tab.color } : undefined}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map comparison */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Morning map */}
          <ComparisonMap
            label="Morning (8 AM)"
            icon={Sunrise}
            color="#f59e0b"
            polygon={morningPoly}
            showPolygon={mode === 'morning' || mode === 'difference'}
            services={mode !== 'evening' ? morningCatServices : []}
            reduced={reduced}
            category={selectedCat}
          />
          {/* Evening map */}
          <ComparisonMap
            label="Evening (6 PM)"
            icon={Sunset}
            color="#6366f1"
            polygon={eveningPoly}
            showPolygon={mode === 'evening' || mode === 'difference'}
            services={mode === 'evening' ? eveningCatServices : []}
            reduced={reduced}
            category={selectedCat}
            showDifference={mode === 'difference'}
            lostPoints={lostPoints}
            gainedPoints={gainedPoints}
          />
        </div>

        {/* Swipe comparison for difference mode */}
        {mode === 'difference' && (
          <div className="mb-6">
            <SwipeComparison
              morningPoly={morningPoly}
              eveningPoly={eveningPoly}
              dividerPos={dividerPos}
              setDragging={setDragging}
              onDrag={handleDividerDrag}
              dragging={dragging}
              reduced={reduced}
            />
          </div>
        )}

        {/* Category selector */}
        <div className="glass p-4 mb-6">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Compare by Category</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map(cat => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const active = selectedCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`chip ${active ? 'chip-selected' : 'chip-unselected'}`}
                  style={active ? { background: meta.color, borderColor: meta.color } : undefined}
                >
                  <Icon size={14} style={{ color: active ? 'white' : meta.color }} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComparisonMetric
            label="Reachable Area"
            morningValue={morningArea}
            eveningValue={eveningArea}
            unit="km²"
            decimals={1}
            icon={Building2}
            color="#0d9488"
          />
          <ComparisonMetric
            label={`${CATEGORY_META[selectedCat].label} (AM)`}
            morningValue={morningCatServices.length}
            eveningValue={morningCatServices.length}
            unit=""
            icon={CATEGORY_META[selectedCat].icon}
            color={CATEGORY_META[selectedCat].color}
          />
          <ComparisonMetric
            label={`${CATEGORY_META[selectedCat].label} (PM)`}
            morningValue={eveningCatServices.length}
            eveningValue={eveningCatServices.length}
            unit=""
            icon={CATEGORY_META[selectedCat].icon}
            color={CATEGORY_META[selectedCat].color}
          />
          <ComparisonMetric
            label="Total Services"
            morningValue={morningServices.length}
            eveningValue={eveningServices.length}
            unit=""
            icon={Train}
            color="#2563eb"
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonMap({
  label, icon: Icon, color, polygon, showPolygon, services, reduced, category, showDifference, lostPoints, gainedPoints,
}: {
  label: string;
  icon: typeof Sunrise;
  color: string;
  polygon: MapPoint[];
  showPolygon: boolean;
  services: typeof SERVICES;
  reduced: boolean;
  category: ServiceCategory;
  showDifference?: boolean;
  lostPoints?: MapPoint[];
  gainedPoints?: MapPoint[];
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '10/7' }}>
      <TransitMap showTransit showRoads />
      <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
        {showPolygon && <ReachabilityLayer points={polygon} color={color} fillOpacity={0.15} animate={!reduced} />}
        {showDifference && lostPoints && lostPoints.length > 0 && (
          <HatchArea points={lostPoints} type="lost" animate={!reduced} />
        )}
        {showDifference && gainedPoints && gainedPoints.length > 0 && (
          <HatchArea points={gainedPoints} type="gained" animate={!reduced} />
        )}
        {services.map((s, i) => (
          <ServiceMarker key={s.id} service={s} animateIn={!reduced} index={i} />
        ))}
        <OriginMarker pos={CITY_CENTER} animate={!reduced} showPulse={showPolygon} />
      </svg>
      <div className="absolute top-3 left-3 glass-strong px-3 py-2 flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
    </div>
  );
}

function SwipeComparison({
  morningPoly, eveningPoly, dividerPos, setDragging, onDrag, dragging, reduced,
}: {
  morningPoly: MapPoint[];
  eveningPoly: MapPoint[];
  dividerPos: number;
  setDragging: (v: boolean) => void;
  onDrag: (clientX: number, container: HTMLElement) => void;
  dragging: boolean;
  reduced: boolean;
}) {
  const containerRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-lg select-none"
      style={{ aspectRatio: '10/5', cursor: dragging ? 'grabbing' : 'grab' }}
      ref={(el) => { containerRef.current = el; }}
      onMouseMove={(e) => { if (dragging && containerRef.current) onDrag(e.clientX, containerRef.current); }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      {/* Evening (full) */}
      <div className="absolute inset-0">
        <TransitMap showTransit showRoads />
        <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
          <ReachabilityLayer points={eveningPoly} color="#6366f1" fillOpacity={0.15} animate={!reduced} />
        </svg>
      </div>
      {/* Morning (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${dividerPos}%` }}>
        <div style={{ width: `${100 / (dividerPos / 100)}%`, height: '100%' }}>
          <TransitMap showTransit showRoads />
          <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
            <ReachabilityLayer points={morningPoly} color="#f59e0b" fillOpacity={0.15} animate={!reduced} />
          </svg>
        </div>
      </div>
      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
        style={{ left: `${dividerPos}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => setDragging(true)}
      >
        <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <ArrowLeft size={12} className="text-slate-600" />
            <ArrowRight size={12} className="text-slate-600" />
          </div>
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 glass-strong px-3 py-1.5">
        <span className="text-xs font-bold text-amber-600">Morning</span>
      </div>
      <div className="absolute top-3 right-3 glass-strong px-3 py-1.5">
        <span className="text-xs font-bold text-indigo-600">Evening</span>
      </div>
    </div>
  );
}

function ComparisonMetric({
  label, morningValue, eveningValue, unit, decimals = 0, icon: Icon, color,
}: {
  label: string;
  morningValue: number;
  eveningValue: number;
  unit: string;
  decimals?: number;
  icon: typeof Clock;
  color: string;
}) {
  const diff = eveningValue - morningValue;
  const diffPct = morningValue > 0 ? (diff / morningValue) * 100 : 0;
  const morningCount = useCountUp(morningValue, 600, 0);
  const eveningCount = useCountUp(eveningValue, 600, 100);
  return (
    <div className="glass p-4 card-hover fade-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-600">AM</span>
          <span className="text-lg font-bold text-slate-900">{morningCount.toFixed(decimals)}{unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-600">PM</span>
          <span className="text-lg font-bold text-slate-900">{eveningCount.toFixed(decimals)}{unit}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
          <div className="h-full bg-amber-400 rounded-l-full anim-bar" style={{ width: `${(morningValue / Math.max(morningValue, eveningValue)) * 50}%` }} />
          <div className="h-full bg-indigo-400 rounded-r-full anim-bar" style={{ width: `${(eveningValue / Math.max(morningValue, eveningValue)) * 50}%` }} />
        </div>
        <div className="text-xs font-semibold" style={{ color: diff >= 0 ? '#22c55e' : '#f43f5e' }}>
          {diff >= 0 ? '+' : ''}{diff.toFixed(decimals)}{unit} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(0)}%)
        </div>
      </div>
    </div>
  );
}
