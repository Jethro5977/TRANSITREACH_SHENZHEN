import { Clock3 } from 'lucide-react';
import {
  DEPARTURE_PROFILES,
  getDepartureProfile,
  TIMETABLE_STATUS,
  type DepartureProfileId,
} from '@/shared/data/shenzhen/timetable';

interface DepartureTimeSelectorProps {
  value: DepartureProfileId;
  onChange: (value: DepartureProfileId) => void;
}

/** A real timetable will make this selector change headways; until then it names the fallback. */
export function DepartureTimeSelector({ value, onChange }: DepartureTimeSelectorProps) {
  const profile = getDepartureProfile(value);
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          value={profile.id}
          onChange={event => onChange(event.target.value as DepartureProfileId)}
          aria-label="Departure time"
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          {DEPARTURE_PROFILES.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </div>
      <p className={`text-[10px] leading-snug ${TIMETABLE_STATUS.available ? 'text-emerald-700' : 'text-amber-700'}`}>
        {TIMETABLE_STATUS.available
          ? `已载入 ${TIMETABLE_STATUS.lineCount} 条线路的授权时刻表；候车时间按半个发车间隔估算。`
          : '官方时刻表待授权导入；当前所有时段均使用已声明的固定 4 分钟候车估算。'}
      </p>
    </div>
  );
}
