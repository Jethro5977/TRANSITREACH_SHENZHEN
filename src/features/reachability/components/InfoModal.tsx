import { Clock3, Database, MapPin, X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import {
  BUDGET_ASSUMPTIONS,
  BUDGET_COMPONENTS,
  getDataBasis,
  STUDY_AREA_BUFFER_KM,
} from '../reachabilityService';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  departureLabel: string;
  timetableStatus: 'verified' | 'demo-fallback';
}

/** Keeps model disclosures reachable without consuming the map configuration panel. */
export function InfoModal({ open, onClose, departureLabel, timetableStatus }: InfoModalProps) {
  const basis = getDataBasis();
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-teal-700">INFO</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">数据来源与模型说明</h2>
        </div>
        <button onClick={onClose} className="btn-icon shrink-0" aria-label="关闭说明"><X size={17} /></button>
      </div>

      <div className="mt-4 max-h-[min(66vh,520px)] space-y-5 overflow-y-auto pr-1 scrollbar-thin">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Database size={15} className="text-teal-700" />数据来源</h3>
          <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600">
            <p><strong className="text-slate-700">{basis.feedName}</strong>：{basis.lineCount} 条线路静态快照与 OSM 障碍物裁剪包络。</p>
            <p>出发设置：{departureLabel}。</p>
            <p>候车：{timetableStatus === 'verified' ? '根据授权时刻表以半个发车间隔估算。' : '官方时刻表尚未授权导入，固定按 4 分钟 Demo 估算。'}</p>
            <p>{basis.modesNotLoaded}</p>
            <p>{basis.realtimeNote}</p>
            <p>底图与站点坐标：OpenStreetMap（ODbL）；地图右下角持续显示署名。</p>
            <p className="text-slate-500">数据许可：{basis.licence ?? basis.licenceStatus}</p>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Clock3 size={15} className="text-teal-700" />时间预算如何估算</h3>
          <ul className="mt-2 space-y-2">
            {BUDGET_COMPONENTS.map(component => (
              <li key={component.label} className="text-xs leading-relaxed">
                <span className="font-semibold text-slate-700">{component.label}</span>
                {component.estimate && <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-800">Demo 估算</span>}
                <div className="text-slate-500">{component.status}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
            {BUDGET_ASSUMPTIONS.map(assumption => (
              <p key={assumption.label} className="text-xs leading-relaxed text-slate-600"><strong className="text-slate-700">{assumption.label}：</strong>{assumption.status}</p>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><MapPin size={15} className="text-teal-700" />覆盖范围</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">深圳市域 Demo 边界按静态站点数据范围外扩 {STUDY_AREA_BUFFER_KM} km。公交、授权时刻表、实时班次及真实步行路网尚未参与当前计算。</p>
        </section>
      </div>
    </Modal>
  );
}
