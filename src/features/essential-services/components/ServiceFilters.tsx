import { CATEGORY_META, CATEGORY_ORDER } from '@/shared/data';
import type { ServiceCategory } from '@/shared/types/service';

interface ServiceFiltersProps {
  selected: Set<ServiceCategory>;
  onToggle: (cat: ServiceCategory) => void;
  counts?: Partial<Record<ServiceCategory, number>>;
  compact?: boolean;
}

export function ServiceFilters({ selected, onToggle, counts, compact = false }: ServiceFiltersProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'gap-1.5' : ''}`}>
      {CATEGORY_ORDER.map((catId) => {
        const meta = CATEGORY_META[catId];
        const Icon = meta.icon;
        const isSelected = selected.has(catId);
        const count = counts?.[catId];
        return (
          <button
            key={catId}
            onClick={() => onToggle(catId)}
            className={`chip ${isSelected ? 'chip-selected' : 'chip-unselected'}`}
            style={compact ? { padding: '6px 10px', fontSize: 12 } : undefined}
          >
            <Icon size={compact ? 13 : 15} style={{ color: isSelected ? 'white' : meta.color }} />
            {meta.label}
            {count !== undefined && count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isSelected ? 'bg-white/25' : 'bg-slate-200/60 text-slate-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
