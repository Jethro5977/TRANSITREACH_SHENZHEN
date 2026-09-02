import { Accessibility, ChevronRight, Clock, Footprints, Star } from 'lucide-react';
import { CATEGORY_META } from '@/shared/data';
import type { ServiceLocation } from '@/shared/types/service';

interface ServiceListProps {
  services: ServiceLocation[];
  hoveredService: ServiceLocation | null;
  selectedService: ServiceLocation | null;
  onHover: (service: ServiceLocation | null) => void;
  onSelect: (service: ServiceLocation) => void;
}

export function ServiceList({ services, hoveredService, selectedService, onHover, onSelect }: ServiceListProps) {
  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
      {services.map((service, i) => {
        const meta = CATEGORY_META[service.category];
        const Icon = meta.icon;
        const isHovered = hoveredService?.id === service.id;
        const isSelected = selectedService?.id === service.id;
        return (
          <div
            key={service.id}
            className={`card p-3.5 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-teal-400' : isHovered ? 'shadow-md' : ''}`}
            style={{ animationDelay: `${i * 30}ms` }}
            onMouseEnter={() => onHover(service)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(service)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.colorLight }}>
                <Icon size={18} style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{service.name}</div>
                <div className="text-xs text-slate-500 truncate">{service.address}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-600"><Footprints size={11} className="text-teal-600" />{service.walkMin}m</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-600"><Star size={11} className="text-amber-400" />{service.rating}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock size={11} className="text-slate-400" />{service.waitingMin}m wait</span>
                  {service.accessible && <Accessibility size={12} className="text-teal-600" />}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 mt-1" />
            </div>
          </div>
        );
      })}
      {services.length === 0 && (
        <div className="glass p-8 text-center">
          <p className="text-sm text-slate-500">No services match your filters.</p>
        </div>
      )}
    </div>
  );
}
