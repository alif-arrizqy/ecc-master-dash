import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate startDate and endDate for SLA report
 * Rules:
 * - If today is the 1st of the month: startDate = 1st of previous month, endDate = last day of previous month
 * - Otherwise: startDate = 1st of current month, endDate = yesterday
 */
export function getSLADateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const dayOfMonth = today.getDate();

  let startDate: Date;
  let endDate: Date;

  if (dayOfMonth === 1) {
    // If today is the 1st, use previous month
    const previousMonth = subMonths(today, 1);
    startDate = startOfMonth(previousMonth);
    endDate = endOfMonth(previousMonth);
  } else {
    // Otherwise, use current month from 1st to yesterday
    startDate = startOfMonth(today);
    endDate = subDays(today, 1);
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  };
}
