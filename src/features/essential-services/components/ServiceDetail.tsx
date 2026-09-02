import { Accessibility, Footprints, Navigation, Star, Timer, Train } from 'lucide-react';
import { CATEGORY_META } from '@/shared/data';
import type { ServiceLocation } from '@/shared/types/service';

export function ServiceDetail({ service }: { service: ServiceLocation }) {
  const meta = CATEGORY_META[service.category];
  const Icon = meta.icon;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: meta.colorLight }}>
          <Icon size={28} style={{ color: meta.color }} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-sm text-slate-500">{service.address}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1"><Footprints size={14} className="text-teal-600" /><span className="text-[10px] font-bold text-slate-400 uppercase">Walk Time</span></div>
          <div className="text-lg font-bold text-slate-900">{service.walkMin} min</div>
        </div>
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1"><Train size={14} className="text-blue-500" /><span className="text-[10px] font-bold text-slate-400 uppercase">Transit Time</span></div>
          <div className="text-lg font-bold text-slate-900">{service.transitMin} min</div>
        </div>
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1"><Timer size={14} className="text-amber-500" /><span className="text-[10px] font-bold text-slate-400 uppercase">Wait Time</span></div>
          <div className="text-lg font-bold text-slate-900">{service.waitingMin} min</div>
        </div>
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1"><Star size={14} className="text-amber-400" /><span className="text-[10px] font-bold text-slate-400 uppercase">Rating</span></div>
          <div className="text-lg font-bold text-slate-900">{service.rating} / 5</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Opening Hours</div>
        <div className="glass-chip px-3 py-2 text-sm font-semibold text-slate-700">{service.hours}</div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Accessibility</div>
        <div className="flex items-center gap-2 glass-chip px-3 py-2">
          <Accessibility size={16} className={service.accessible ? 'text-teal-600' : 'text-slate-400'} />
          <span className="text-sm font-semibold text-slate-700">
            {service.accessible ? 'Wheelchair accessible' : 'Limited accessibility'}
          </span>
        </div>
      </div>

      <button className="btn-primary w-full flex items-center justify-center gap-2">
        <Navigation size={16} />
        Get Directions
      </button>
    </div>
  );
}
