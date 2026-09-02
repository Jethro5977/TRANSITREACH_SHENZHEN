import type { LucideIcon } from 'lucide-react';

interface ModeSelectorProps {
  modes: { id: string; label: string; icon: LucideIcon }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function ModeSelector({ modes, selected, onToggle }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selected.has(mode.id);
        return (
          <button
            key={mode.id}
            onClick={() => onToggle(mode.id)}
            className={`chip ${isSelected ? 'chip-selected' : 'chip-unselected'}`}
          >
            <span className="relative w-4 h-4 flex items-center justify-center">
              {isSelected && (
                <svg width="16" height="16" viewBox="0 0 16 16" className="check-draw">
                  <path d="M3 8 L7 12 L13 4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {!isSelected && <Icon size={14} />}
            </span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
