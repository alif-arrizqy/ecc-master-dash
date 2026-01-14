/**
 * Type definitions for API responses
 */

export type BatteryVersion = 'talis5' | 'mix' | 'jspro';

/**
 * Daily SLA Chart Data Point
 */
export interface DailySLAChartData {
  date: string;
  value: number;
}

/**
 * Weekly SLA Chart Data Point
 */
export interface WeeklySLAChartData {
  name: string;
  value: number;
}

/**
 * Monthly Report Summary Response
 */
export interface MonthlyReportSummary {
  summary: {
    dateNow: string;
    totalSite: number;
    sla: number;
    slaUnit: string;
    slaStatus: string;
  };
  detail: {
    talis5: {
      name: string;
      summary: {
        totalSites: number;
        sla: number;
        slaUnit: string;
        slaStatus: string;
      };
    };
    mix: {
      name: string;
      summary: {
        totalSites: number;
        sla: number;
        slaUnit: string;
        slaStatus: string;
      };
    };
    jspro: {
      name: string;
      summary: {
        totalSites: number;
        sla: number;
        slaUnit: string;
        slaStatus: string;
      };
    };
  };
}

/**
 * SLA Reason Response
 */
export interface SLAReason {
  id: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * GAMAS History Item
 */
export interface GAMASHistoryItem {
  id: number;
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination Info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * GAMAS History Response with Pagination
 */
export interface GAMASHistoryResponse {
  data: GAMASHistoryItem[];
  pagination: PaginationInfo;
}

/**
 * Site SLA Detail
 */
export interface SiteSLADetail {
  date: string;
  sla: number;
  slaUnit: string;
  downtime: string;
  problem: string;
  site: string;
  batteryVersion: BatteryVersion;
  slaBefore?: number;
  slaNow?: number;
}

/**
 * Battery Version Report Detail
 */
export interface BatteryVersionReportDetail {
  name: string;
  summary: {
    totalSites: number;
    sla: number;
    slaUnit: string;
  };
  message: string;
  downSla: SiteSLADetail[];
  underSla: SiteSLADetail[];
  dropSla: SiteSLADetail[];
  upSla: SiteSLADetail[];
}

/**
 * Site SLA Detail for slaBelow95
 */
export interface SlaBelow95SiteItem {
  sla: number;
  site: string;
  downtime: string;
  problem: string | null;
  batteryVersion: BatteryVersion;
  statusSP: "Potensi SP" | "Clear SP";
}

/**
 * Battery Version Detail for slaBelow95
 */
export interface SlaBelow95BatteryVersionDetail {
  name: string;
  totalSites: number;
  sites: SlaBelow95SiteItem[];
}

/**
 * SLA Below 95.5% Section
 */
export interface SlaBelow95Section {
  message: string;
  totalSites: number;
  detail: {
    batteryVersion: {
      talis5: SlaBelow95BatteryVersionDetail;
      mix: SlaBelow95BatteryVersionDetail;
      jspro: SlaBelow95BatteryVersionDetail;
    };
  };
}

/**
 * SLA Report Detail Response
 */
export interface SLAReportDetail {
  report: {
    dateNow: string;
    dateBefore: string;
    totalSite: number;
    slaNow: number;
    slaBefore: number;
    slaUnit: string;
    message: string;
    detail: {
      batteryVersion: {
        talis5: BatteryVersionReportDetail;
        mix: BatteryVersionReportDetail;
        jspro: BatteryVersionReportDetail;
      };
    };
  };
  slaBelow95: SlaBelow95Section;
}

/**
 * Site SLA Detail (for Master/Potensi SP - legacy)
 */
export interface SiteSLADetailMaster {
  slaAverage: number;
  slaUnit: string;
  slaStatus: string;
  dailySla: Array<{
    date: string;
    sla: number;
    slaUnit: string;
    slaStatus: string;
  }>;
  statusSP: string;
}

/**
 * Site Master Data (Potensi SP)
 */
export interface SiteMaster {
  siteId?: string;
  siteName?: string;
  name?: string;
  site_name?: string;
  province?: string;
  batteryVersion?: string;
  battery_version?: string;
  talisInstalled?: string | null;
  problem?: unknown[];
  siteSla?: SiteSLADetailMaster;
  // Legacy fields for backward compatibility
  slaAvg?: number;
  sla_avg?: number;
  status?: string;
  [key: string]: unknown; // Allow additional fields from API
}

/**
 * Daily SLA Average Item
 */
export interface DailySLAAverageItem {
  date: string;
  sla: number;
  slaUnit: string;
  slaStatus: string;
}

/**
 * Potensi SP Sites Response
 */
export interface PotensiSPSitesResponse {
  summary: {
    slaAverage: number;
    slaUnit: string;
    slaAverageDaily: DailySLAAverageItem[];
  };
  sites: SiteMaster[];
  pagination: PaginationInfo;
}

