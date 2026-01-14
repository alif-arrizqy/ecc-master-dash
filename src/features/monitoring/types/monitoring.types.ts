/**
 * Types untuk Monitoring Module
 */

export interface SiteDown {
  id: number;
  siteId: string;
  siteName: string;
  downSince: string; // ISO 8601 date string
  downSeconds: number;
  slaAvg?: number;
  statusSLA?: 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad';
  statusSP?: 'Potensi SP' | 'Clear SP';
  problem?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SiteUp {
  id: number;
  siteId: string;
  siteName: string;
  slaAvg?: number;
  statusSLA?: 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad';
  problem?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringSummary {
  totalSites: number;
  totalSitesDown?: number;
  totalSitesUp?: number;
  percentageSitesDown?: number;
  percentageSitesUp?: number;
}

export interface MonitoringPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SiteDownResponse {
  success: boolean;
  data: SiteDown[];
  pagination: MonitoringPagination;
  summary: MonitoringSummary;
}

export interface SiteUpResponse {
  success: boolean;
  data: SiteUp[];
  pagination: MonitoringPagination;
  summary: MonitoringSummary;
}

export interface MonitoringFilters {
  page?: number;
  limit?: number;
  siteId?: string;
  siteName?: string;
}

export type SiteDownStatus = 'critical' | 'warning' | 'normal';

export interface SiteDownWithStatus extends SiteDown {
  status: SiteDownStatus;
  formattedDuration: string;
  formattedDownSince: string;
  slaAvg?: number;
  statusSLA?: 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad';
  statusSP?: 'Potensi SP' | 'Clear SP';
  problem?: string[];
}

