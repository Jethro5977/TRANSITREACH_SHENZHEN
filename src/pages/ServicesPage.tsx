import { useMemo, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { CITY_CENTER } from '@/shared/data';
import { generateReachPolygon } from '@/shared/data/mock/reachability';
import { TransitMap, OriginMarker, ReachabilityLayer } from '@/shared/map';
import { usePrefersReducedMotion } from '@/shared/hooks';
import type { ServiceCategory } from '@/shared/types/service';
import {
  ServiceFilters,
  ServiceList,
  ServiceMarker,
  ServiceSummary,
  useEssentialServices,
} from '@/features/essential-services';

export function ServicesPage() {
  const reduced = usePrefersReducedMotion();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'walk' | 'rating' | 'wait'>('walk');
  const polygon = useMemo(() => generateReachPolygon(CITY_CENTER, 45, 42), []);
  const services = useEssentialServices(polygon, true);

  const filteredServices = useMemo(() => {
    let list = [...services.reachableServices];
    if (search) list = list.filter(service => service.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === 'walk') return a.walkMin - b.walkMin;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.waitingMin - b.waitingMin;
    });
    return list;
  }, [services.reachableServices, search, sortBy]);

  return (
    <div className="min-h-screen pt-16">
      <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 15% 20%, rgba(20,184,166,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(37,99,235,0.04) 0%, transparent 50%)' }} />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 fade-slide-up">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Essential Services</h1>
          <p className="text-slate-600">Browse all essential services reachable from the city centre within 45 minutes.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '10/7', minHeight: '400px' }}>
            <TransitMap showTransit={false} showRoads />
            <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
              <ReachabilityLayer points={polygon} color="#14b8a6" fillOpacity={0.12} animate={!reduced} />
              {filteredServices.map((service, i) => (
                <ServiceMarker
                  key={service.id}
                  service={service}
                  animateIn={!reduced}
                  index={i}
                  hovered={services.hoveredService?.id === service.id}
                  selected={services.selectedService?.id === service.id}
                  dimmed={services.selectedService !== null && services.selectedService.id !== service.id}
                  onClick={() => services.setSelectedService(service)}
                  onHover={services.setHoveredService}
                />
              ))}
              <OriginMarker pos={CITY_CENTER} animate={!reduced} showPulse />
            </svg>
            <div className="absolute top-4 left-4 glass-strong px-4 py-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Services in Reach</div>
              <ServiceSummary total={filteredServices.length} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass p-4 space-y-3">
              <div className="glass-input flex items-center gap-2 px-3 py-2.5">
                <Search size={16} className="text-slate-400" />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search services..." className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400" />
              </div>
              <div className="flex gap-2">
                {(['walk', 'rating', 'wait'] as const).map(value => (
                  <button key={value} onClick={() => setSortBy(value)} className={`chip ${sortBy === value ? 'chip-selected' : 'chip-unselected'}`} style={{ padding: '6px 12px', fontSize: 12 }}>
                    {value === 'walk' ? 'Nearest' : value === 'rating' ? 'Top Rated' : 'Shortest Wait'}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-3"><Filter size={14} className="text-teal-600" /><span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filter by Category</span></div>
              <ServiceFilters selected={services.selectedCategories} onToggle={services.toggleCategory} counts={services.categoryCounts} compact />
            </div>

            <ServiceList
              services={filteredServices}
              hoveredService={services.hoveredService}
              selectedService={services.selectedService}
              onHover={services.setHoveredService}
              onSelect={services.setSelectedService}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
