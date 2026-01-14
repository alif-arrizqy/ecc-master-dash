/**
 * Utility functions for Sites Management
 */

/**
 * Format SCC type to uppercase and replace underscores with spaces
 * @param sccType - SCC type string (e.g., 'scc_srne')
 * @returns Formatted string (e.g., 'SCC SRNE') or '-' if empty
 */
export const formatSccType = (sccType?: string): string => {
  if (!sccType) return '-';
  return sccType.toUpperCase().replace(/_/g, ' ');
};

/**
 * Format site name to uppercase and replace underscores with spaces
 * @param siteName - Site name string (e.g., 'bumi_rahmat')
 * @returns Formatted string (e.g., 'BUMI RAHMAT') or '-' if empty
 */
export const formatSiteName = (siteName?: string): string => {
  if (!siteName) return '-';
  return siteName.toUpperCase().replace(/_/g, ' ');
};

/**
 * Format date string for display
 * @param dateString - Date string (ISO format or date string)
 * @returns Formatted date string (dd/MM/yyyy) or '-' if empty
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  
  try {
    const date = dateString.includes('T') 
      ? new Date(dateString) 
      : new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

