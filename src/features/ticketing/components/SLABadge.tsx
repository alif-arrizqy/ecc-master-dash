/**
 * SLABadge Component
 * Display SLA value with conditional colors
 * Green (>=95.5%), Yellow (>=70%), Red (<70%)
 */

import { cn } from '@/shared/lib/utils';

interface SLABadgeProps {
  value?: number | null;
  showPercentage?: boolean;
}

const getSLAClass = (value?: number | null): string => {
  if (value === null || value === undefined || value === 0) {
    return 'bg-status-danger/10 text-status-danger';
  }
  if (value >= 95.5) return 'bg-status-good/10 text-status-good';
  if (value >= 70) return 'bg-status-warning/10 text-status-warning';
  return 'bg-status-danger/10 text-status-danger';
};

export const SLABadge = ({ value, showPercentage = true }: SLABadgeProps) => {
  const displayValue =
    value === null || value === undefined
      ? 'N/A'
      : `${typeof value === 'number' ? value.toFixed(2) : value}${showPercentage ? '%' : ''}`;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold whitespace-nowrap min-h-[24px]',
        getSLAClass(value)
      )}
    >
      {displayValue}
    </span>
  );
};
