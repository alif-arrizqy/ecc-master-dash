/**
 * Date utility functions for SLA Dashboard
 * 
 * Rules:
 * - Jika tanggal 1 bulan baru → gunakan 2 hari terakhir bulan sebelumnya
 * - Jika tanggal 2+ bulan baru → gunakan dari tanggal 1 bulan baru sampai hari ini
 */

import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

/**
 * Get date range for SLA charts and reports
 * Rules:
 * - Tanggal 1 → 2 hari terakhir bulan sebelumnya (29-30 atau 30-31)
 * - Tanggal 2+ → dari tanggal 1 bulan ini sampai hari ini
 */
export function getSLADateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.getDate();
  
  if (today === 1) {
    // Tanggal 1: gunakan 2 hari terakhir bulan sebelumnya
    const yesterday = subDays(now, 1); // tanggal terakhir bulan sebelumnya
    const dayBeforeYesterday = subDays(now, 2); // 2 hari terakhir bulan sebelumnya
    
    return {
      startDate: format(dayBeforeYesterday, 'yyyy-MM-dd'),
      endDate: format(yesterday, 'yyyy-MM-dd'),
    };
  } else {
    // Tanggal 2+: dari tanggal 1 bulan ini sampai hari ini
    const start = startOfMonth(now);
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    };
  }
}

/**
 * Get date range for daily report (requires exactly 1 day difference)
 * Rules:
 * - Report selalu untuk "2 hari yang lalu" sampai "1 hari yang lalu" (yesterday)
 * - Jika sekarang tanggal 11 Desember → startDate = 2025-12-09, endDate = 2025-12-10
 * - Jika sekarang tanggal 1 Desember → startDate = 2025-11-29, endDate = 2025-11-30
 * 
 * Note: Endpoint /api/v1/sla-bakti/daily/report requires exactly 1 day difference
 * between startDate and endDate. Report selalu untuk periode "kemarin" (yesterday period).
 */
export function getSLAReportDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  
  // Report untuk "2 hari yang lalu" sampai "1 hari yang lalu" (yesterday)
  // startDate = 2 hari yang lalu
  // endDate = 1 hari yang lalu (yesterday)
  const twoDaysAgo = subDays(now, 2);
  const yesterday = subDays(now, 1);
  
  return {
    startDate: format(twoDaysAgo, 'yyyy-MM-dd'),
    endDate: format(yesterday, 'yyyy-MM-dd'),
  };
}

/**
 * Get period for monthly summary
 * Rules:
 * - Tanggal 1 → gunakan bulan sebelumnya
 * - Tanggal 2+ → gunakan bulan saat ini
 */
export function getSLAMonthPeriod(): string {
  const now = new Date();
  const today = now.getDate();
  
  if (today === 1) {
    // Tanggal 1: gunakan bulan sebelumnya
    const lastMonth = subMonths(now, 1);
    return format(lastMonth, 'yyyy-MM');
  } else {
    // Tanggal 2+: gunakan bulan saat ini
    return format(now, 'yyyy-MM');
  }
}

/**
 * Get month name for display (Indonesian)
 * Rules:
 * - Tanggal 1 → tampilkan bulan sebelumnya
 * - Tanggal 2+ → tampilkan bulan saat ini
 */
export function getSLAMonthName(): string {
  const now = new Date();
  const today = now.getDate();
  
  const months = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  
  if (today === 1) {
    // Tanggal 1: tampilkan bulan sebelumnya
    const lastMonth = subMonths(now, 1);
    return `${months[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
  } else {
    // Tanggal 2+: tampilkan bulan saat ini
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }
}

/**
 * Get start and end date of current month in YYYY-MM-DD format
 * @deprecated Use getSLADateRange() instead for SLA-specific logic
 */
export function getCurrentMonthDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

/**
 * Get start and end date of a specific month in YYYY-MM-DD format
 */
export function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const date = new Date(year, month - 1, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

/**
 * Get current month and year in format 'YYYY-MM'
 * @deprecated Use getSLAMonthPeriod() instead for SLA-specific logic
 */
export function getCurrentMonthPeriod(): string {
  const now = new Date();
  return format(now, 'yyyy-MM');
}

/**
 * Get current month and year in Indonesian format (e.g., 'desember 2024')
 * @deprecated Use getSLAMonthName() instead for SLA-specific logic
 */
export function getCurrentMonthPeriodIndonesian(): string {
  const now = new Date();
  const months = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Get date range for Potensi SP sites
 * Rules:
 * - startDate = tanggal 1 bulan ini
 * - endDate = 1 hari yang lalu (yesterday)
 * - Contoh: sekarang 11 Desember → startDate = 2025-12-01, endDate = 2025-12-10
 */
export function getPotensiSPDateRange(): { startDate: string; endDate: string } {
  // const now = new Date();
  // const start = startOfMonth(now); // Tanggal 1 bulan ini
  // const yesterday = subDays(now, 1); // 1 hari yang lalu
  
  // return {
  //   startDate: format(start, 'yyyy-MM-dd'),
  //   endDate: format(yesterday, 'yyyy-MM-dd'),
  // };
  const now = new Date();
  const today = now.getDate();
  
  if (today === 1) {
    // Tanggal 1: gunakan bulan sebelumnya
    // startDate = tanggal 1 bulan sebelumnya
    // endDate = tanggal terakhir bulan sebelumnya
    const lastMonth = subMonths(now, 1);
    const start = startOfMonth(lastMonth); // Tanggal 1 bulan sebelumnya
    const end = endOfMonth(lastMonth); // Tanggal terakhir bulan sebelumnya
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  } else {
    // Tanggal 2+: dari tanggal 1 bulan ini sampai tanggal terakhir bulan ini
    const start = startOfMonth(now); // Tanggal 1 bulan ini
    const end = endOfMonth(now); // Tanggal terakhir bulan ini
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }
}

/**
 * Get date range for Dashboard charts (daily chart all sites, daily chart per battery version,
 * SLA reasons, weekly chart, and GAMAS history)
 * Rules:
 * - Normal (tanggal 2+): startDate = tanggal 1 bulan sekarang, endDate = tanggal terakhir bulan sekarang
 *   Contoh: sekarang 2025-12-16 → startDate = 2025-12-01, endDate = 2025-12-31
 * - Edge case (tanggal 1): startDate = tanggal 1 bulan sebelumnya, endDate = tanggal terakhir bulan sebelumnya
 *   Contoh: sekarang 2025-12-01 → startDate = 2025-11-01, endDate = 2025-11-30
 * 
 * Used for:
 * - /api/v1/sla-bakti/daily/chart/all-sites
 * - /api/v1/sla-bakti/daily/chart/battery/{version}
 * - /api/v1/sla-reason/battery-version/{version}
 * - /api/v1/sla-bakti/weekly/chart/all-sites
 * - /api/v1/history-gamas/
 */
export function getSLADashboardDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.getDate();
  
  if (today === 1) {
    // Tanggal 1: gunakan bulan sebelumnya
    // startDate = tanggal 1 bulan sebelumnya
    // endDate = tanggal terakhir bulan sebelumnya
    const lastMonth = subMonths(now, 1);
    const start = startOfMonth(lastMonth); // Tanggal 1 bulan sebelumnya
    const end = endOfMonth(lastMonth); // Tanggal terakhir bulan sebelumnya
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  } else {
    // Tanggal 2+: dari tanggal 1 bulan ini sampai tanggal terakhir bulan ini
    const start = startOfMonth(now); // Tanggal 1 bulan ini
    const end = endOfMonth(now); // Tanggal terakhir bulan ini
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }
}

/**
 * Get date range for Problem data
 * Rules:
 * - Normal (tanggal 2+): startDate = tanggal 1 bulan sekarang, endDate = tanggal terakhir bulan sekarang
 *   Contoh: sekarang 2025-12-16 → startDate = 2025-12-01, endDate = 2025-12-31
 * - Edge case (tanggal 1): startDate = tanggal 1 bulan sebelumnya, endDate = tanggal terakhir bulan sebelumnya
 *   Contoh: sekarang 2025-12-01 → startDate = 2025-11-01, endDate = 2025-11-30
 */
export function getProblemDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.getDate();
  
  if (today === 1) {
    // Tanggal 1: gunakan bulan sebelumnya
    // startDate = tanggal 1 bulan sebelumnya
    // endDate = tanggal terakhir bulan sebelumnya
    const lastMonth = subMonths(now, 1);
    const start = startOfMonth(lastMonth); // Tanggal 1 bulan sebelumnya
    const end = endOfMonth(lastMonth); // Tanggal terakhir bulan sebelumnya
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  } else {
    // Tanggal 2+: dari tanggal 1 bulan ini sampai tanggal terakhir bulan ini
    const start = startOfMonth(now); // Tanggal 1 bulan ini
    const end = endOfMonth(now); // Tanggal terakhir bulan ini
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }
}

