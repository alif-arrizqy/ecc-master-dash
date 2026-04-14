import { format } from 'date-fns';

/** Format untuk query legacy: `yyyy-MM-dd+HH:mm:ss` */
export function toSlaInternalQueryTimestamp(d: Date): string {
  return format(d, 'yyyy-MM-dd HH:mm:ss').replace(/ /g, '+');
}
