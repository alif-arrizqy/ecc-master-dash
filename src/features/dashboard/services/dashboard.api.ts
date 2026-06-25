/**
 * Dashboard API Service
 * API methods khusus untuk Dashboard module
 */

import { slaApiClient } from '@/lib/api';
import type { BatteryVersion } from '@/lib/api';
import type { AxiosRequestConfig } from 'axios';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Generic API function for SLA Services
 */
async function fetchSlaApi<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await slaApiClient.get<ApiResponse<T>>(endpoint, config);
  return response.data.data;
}

/**
 * Generic API function for paginated responses from SLA Services
 */
async function fetchSlaApiPaginated<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; pagination: ApiResponse<T>['pagination'] }> {
  const response = await slaApiClient.get<ApiResponse<T>>(endpoint, config);
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Dashboard API endpoints
 */
export const dashboardApi = {
  /**
   * Get daily SLA chart data per battery version
   * GET /api/v1/sla-bakti/daily/chart/battery/{batteryVersion}
   */
  getDailySLAChartByBatteryVersion: async (
    batteryVersion: BatteryVersion,
    params: { startDate: string; endDate: string }
  ) => {
    return fetchSlaApi<Array<{ date: string; value: number }>>(
      `/api/v1/sla-bakti/daily/chart/battery/${batteryVersion}`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      }
    );
  },

  /**
   * Get daily average SLA chart data for all sites
   * GET /api/v1/sla-bakti/daily/chart/all-sites
   */
  getDailySLAChartAllSites: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    return fetchSlaApi<Array<{ date: string; value: number }>>(
      `/api/v1/sla-bakti/daily/chart/all-sites`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      }
    );
  },

  /**
   * Get weekly SLA chart data for all sites
   * GET /api/v1/sla-bakti/weekly/chart/all-sites
   */
  getWeeklySLAChartAllSites: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    return fetchSlaApi<Array<{ name: string; value: number }>>(
      `/api/v1/sla-bakti/weekly/chart/all-sites`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      }
    );
  },

  /**
   * Get monthly report summary
   * GET /api/v1/sla-bakti/monthly/summary
   */
  getMonthlyReportSummary: async (period: string) => {
    return fetchSlaApi<{
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
    }>(`/api/v1/sla-bakti/monthly/summary`, {
      params: { period },
    });
  },

  /**
   * Get SLA reasons for battery version (Penyebab AVG SLA < 95.5%)
   * GET /api/v1/sla-reason/battery-version/{batteryVersion}
   */
  getSLAReasonsByBatteryVersion: async (
    batteryVersion: BatteryVersion,
    params?: { startDate?: string; endDate?: string }
  ) => {
    return fetchSlaApi<Array<{
      id: number;
      reason: string;
      createdAt: string;
      updatedAt: string;
    }>>(`/api/v1/sla-reason/battery-version/${batteryVersion}`, {
      params: {
        startDate: params?.startDate,
        endDate: params?.endDate,
      },
    });
  },

  /**
   * Get GAMAS history
   * GET /api/v1/history-gamas/
   */
  getGAMASHistory: async (params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchSlaApiPaginated<Array<{
      id: number;
      date: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    }>>(`/api/v1/history-gamas/`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
  },

  /**
   * Get detailed SLA report
   * GET /api/v1/sla-bakti/daily/report
   */
  getSLAReportDetail: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    return fetchSlaApi<any>(`/api/v1/sla-bakti/daily/report`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
  },

  /**
   * Get daily SLA MQTT chart data for terestrial sites
   * GET /api/v1/sla-bakti/daily/chart/terrestrial
   */
  getDailySLAChartTerrestrial: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    return fetchSlaApi<Array<{ date: string; value: number }>>(
      `/api/v1/sla-bakti/daily/chart/terrestrial`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      }
    );
  },

  /**
   * Get monthly summary for terestrial/MQTT sites
   * GET /api/v1/sla-bakti/monthly/summary/terrestrial
   */
  getMonthlySummaryTerrestrial: async (period: string) => {
    return fetchSlaApi<{
      totalSites: number;
      avgSla: number;
      slaUnit: string;
      slaStatus: string;
    }>(`/api/v1/sla-bakti/monthly/summary/terrestrial`, {
      params: { period },
    });
  },
};

