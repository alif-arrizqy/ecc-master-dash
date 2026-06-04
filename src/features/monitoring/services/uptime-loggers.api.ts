import { uptimeLoggersApiClient } from '@/lib/api';

export interface SiteItem {
  siteId: string;
  siteName: string;
  batteryType: 'jspro' | 'talis5';
  lastUpdate: string | null;
  uptimePercentage: number;
  uptimeDuration: string | null;
  status: 'online' | 'offline' | 'healthy' | 'warning' | 'critical';
  connectivityStatus: 'online' | 'offline';
  batteryVoltageV: number | null;
  pingLatencyMs: number | null;
  connectivityReachable: boolean;
  connectivityProbedAt: string | null;
  grafanaUrl: string | null;
}

export interface UptimeSummary {
  totalSites: number;
  avgUptime: number;
  mode: 'realtime' | 'historical';
  onlineCount?: number;
  offlineCount?: number;
  healthyCount?: number;
  warningCount?: number;
  criticalCount?: number;
}

export interface PullingLogItem {
  id: string;
  timestamp: string;
  siteId: string;
  siteName: string;
  batteryType: 'jspro' | 'talis5';
  result: 'success' | 'failed';
  errorMessage?: string;
}

export interface PullingLogsSummary {
  totalLogs: number;
  successCount: number;
  failedCount: number;
  successRate: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
}

export const uptimeLoggersApi = {
  async getUptimeSummary(date?: string): Promise<UptimeSummary> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await uptimeLoggersApiClient.get<ApiResponse<UptimeSummary>>(
      '/api/v1/monitoring/uptime/summary',
      { params }
    );
    return response.data.data;
  },

  async getUptimeSites(params?: {
    date?: string;
    batteryType?: string;
    search?: string;
    uptimeHealth?: string;
  }): Promise<SiteItem[]> {
    const response = await uptimeLoggersApiClient.get<ApiResponse<SiteItem[]>>(
      '/api/v1/monitoring/uptime/sites',
      { params }
    );
    return response.data.data;
  },

  async getPullingLogsSummary(date?: string): Promise<PullingLogsSummary> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await uptimeLoggersApiClient.get<ApiResponse<PullingLogsSummary>>(
      '/api/v1/monitoring/pulling-logs/summary',
      { params }
    );
    return response.data.data;
  },

  async getPullingLogs(params?: {
    date?: string;
    batteryType?: string;
    result?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: PullingLogItem[]; pagination: Pagination }> {
    const response = await uptimeLoggersApiClient.get<ApiResponse<PullingLogItem[]>>(
      '/api/v1/monitoring/pulling-logs',
      { params }
    );
    return {
      items: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  async triggerProbe(): Promise<void> {
    await uptimeLoggersApiClient.post('/api/v1/monitoring/uptime/probe/run');
  },
};
