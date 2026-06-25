/**
 * StatusBadge Component
 * Display ticket status with appropriate colors
 */

import { cn } from '@/shared/lib/utils';
import { ticketStatusLabels, type TicketStatus } from '../types/ticketing.types';

interface StatusBadgeProps {
  status: TicketStatus;
}

const statusClasses: Record<TicketStatus, string> = {
  progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-status-warning/10 text-status-warning dark:bg-status-warning/30 dark:text-status-warning',
  closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const label = ticketStatusLabels[status];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap min-h-[24px]',
        statusClasses[status]
      )}
    >
      {label}
    </span>
  );
};
