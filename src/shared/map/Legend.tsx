import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface LegendProps {
  items: { label: string; color: string; type?: 'solid' | 'dashed' | 'fill' }[];
  title?: string;
  collapsible?: boolean;
}

export function Legend({ items, title = 'Legend', collapsible = true }: LegendProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass p-3.5">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className="flex items-center justify-between w-full mb-2"
        disabled={!collapsible}
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
        {collapsible && (
          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
        )}
      </button>
      {open && (
        <div className="space-y-2 fade-in">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {item.type === 'fill' ? (
                <div className="w-5 h-5 rounded-md" style={{ background: item.color, opacity: 0.3, border: `1.5px solid ${item.color}` }} />
              ) : item.type === 'dashed' ? (
                <div className="w-5 h-0.5" style={{ background: `repeating-linear-gradient(90deg, ${item.color} 0 4px, transparent 4px 7px)` }} />
              ) : (
                <div className="w-5 h-1 rounded-full" style={{ background: item.color }} />
              )}
              <span className="text-xs font-medium text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
