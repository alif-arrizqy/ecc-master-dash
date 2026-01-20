/**
 * Date utility functions for Monitoring Module
 */

/**
 * Get start date of current month (YYYY-MM-DD format)
 * Returns: tanggal 1 tiap bulan
 */
export const getCurrentMonthStartDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Get end date of current month (YYYY-MM-DD format)
 * Returns: akhir tanggal bulan tersebut
 */
export const getCurrentMonthEndDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Get last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  return `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

