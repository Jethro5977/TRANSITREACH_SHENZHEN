import { Loader2 } from 'lucide-react';

interface CalculateButtonProps {
  onClick: () => void;
  calculating: boolean;
  disabled?: boolean;
  label?: string;
  calculatingLabel?: string;
}

export function CalculateButton({
  onClick, calculating, disabled = false,
  label = 'Calculate Reach', calculatingLabel = 'Calculating reach...',
}: CalculateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || calculating}
      className="btn-primary w-full flex items-center justify-center gap-2"
    >
      {calculating ? (
        <>
          <Loader2 size={18} className="spinner" />
          <span>{calculatingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
