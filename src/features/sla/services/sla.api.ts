/**
 * SLA API Service
 * API methods khusus untuk SLA module (SLA Bakti)
 */

import { slaApiClient } from '@/shared/lib/api';
import type { BatteryVersion } from '@/shared/lib/api';
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
 * SLA API endpoints
 */
export const slaApi = {
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
   * Get SLA master data with all filters
   * GET /api/v1/sla-bakti/master
   */
  getSLAMasterData: async (params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
    batteryVersion?: string;
    province?: string;
    statusSP?: string;
    statusSLA?: string;
    pic?: string;
    siteName?: string;
    slaMin?: number;
    slaMax?: number;
  }) => {
    const queryParams: Record<string, string | number> = {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page || 1,
      limit: params.limit || 20,
    };

    if (params.batteryVersion && params.batteryVersion !== 'all') {
      queryParams.batteryVersion = params.batteryVersion;
    }
    if (params.province && params.province !== 'all') {
      queryParams.province = params.province;
    }
    if (params.statusSP && params.statusSP !== 'all') {
      queryParams.statusSP = params.statusSP;
    }
    if (params.statusSLA && params.statusSLA !== 'all') {
      queryParams.statusSLA = params.statusSLA;
    }
    if (params.pic && params.pic !== 'all') {
      queryParams.pic = params.pic;
    }
    if (params.siteName) {
      queryParams.siteName = params.siteName;
    }
    if (params.slaMin !== undefined) {
      queryParams.slaMin = params.slaMin;
    }
    if (params.slaMax !== undefined) {
      queryParams.slaMax = params.slaMax;
    }

    // API returns pagination inside data object
    const response = await slaApiClient.get<ApiResponse<{
      summary: {
        slaAverage: number;
        slaUnit: string;
        slaAverageDaily: Array<{
          date: string;
          sla: number;
          slaUnit: string;
          slaStatus: string;
        }>;
      };
      sites: Array<{
        siteId?: string;
        siteName?: string;
        name?: string;
        site_name?: string;
        province?: string;
        batteryVersion?: string;
        battery_version?: string;
        talisInstalled?: string | null;
        problem?: unknown[];
        siteSla?: {
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
        };
        [key: string]: unknown;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>(`/api/v1/sla-bakti/master`, {
      params: queryParams,
    });

    // Extract pagination from data object
    const apiData = response.data.data;
    return {
      data: {
        summary: apiData.summary,
        sites: apiData.sites,
      },
      pagination: apiData.pagination || response.data.pagination,
    };
  },

  /**
   * Upload Excel file for SLA Bakti
   * POST /api/v1/sla-bakti/upload
   */
  uploadSLAFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await slaApiClient.post<ApiResponse<{
      preview: unknown;
      save: unknown;
    }>>('/api/v1/sla-bakti/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  /**
   * SLA Problem CRUD
   */
  // POST /api/v1/sla-bakti/problems
  createSLAProblem: async (data: {
    date: string;
    siteId: string;
    prCode?: string | null;
    problems: Array<{
      pic?: string | null;
      problem?: string | null;
      notes?: string | null;
    }>;
  }) => {
    const response = await slaApiClient.post<ApiResponse<unknown>>('/api/v1/sla-bakti/problems', data);
    return response.data.data;
  },

  // GET /api/v1/sla-bakti/problems
  getSLAProblems: async (params?: {
    startDate?: string;
    endDate?: string;
    siteId?: string;
    prCode?: string;
    pic?: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchSlaApiPaginated<Array<{
      id: number;
      date: string;
      siteId: string;
      prCode?: string | null;
      problems: Array<{
        id: number;
        pic?: string | null;
        problem?: string | null;
        notes?: string | null;
      }>;
      createdAt: string;
      updatedAt: string;
    }>>('/api/v1/sla-bakti/problems', {
      params,
    });
  },

  // PATCH /api/v1/sla-bakti/problems/{id}
  updateSLAProblem: async (id: number, data: {
    date?: string;
    siteId?: string;
    prCode?: string | null;
    problems?: Array<{
      pic?: string | null;
      problem?: string | null;
      notes?: string | null;
    }>;
  }) => {
    const response = await slaApiClient.patch<ApiResponse<unknown>>(`/api/v1/sla-bakti/problems/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/sla-bakti/problems/{id}
  deleteSLAProblem: async (id: number) => {
    const response = await slaApiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sla-bakti/problems/${id}`);
    return response.data.data;
  },

  /**
   * SLA Reason CRUD
   */
  // POST /api/v1/sla-reason/
  createSLAReason: async (data: { reason: string }) => {
    const response = await slaApiClient.post<ApiResponse<unknown>>('/api/v1/sla-reason/', data);
    return response.data.data;
  },

  // GET /api/v1/sla-reason/
  getSLAReasons: async (params?: { page?: number; limit?: number }) => {
    return fetchSlaApiPaginated<Array<{
      id: number;
      reason: string;
      createdAt: string;
      updatedAt: string;
    }>>('/api/v1/sla-reason/', { params });
  },

  // GET /api/v1/sla-reason/{id}
  getSLAReason: async (id: number) => {
    return fetchSlaApi<{
      id: number;
      reason: string;
      createdAt: string;
      updatedAt: string;
    }>(`/api/v1/sla-reason/${id}`);
  },

  // PATCH /api/v1/sla-reason/{id}
  updateSLAReason: async (id: number, data: { reason: string }) => {
    const response = await slaApiClient.patch<ApiResponse<unknown>>(`/api/v1/sla-reason/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/sla-reason/{id}
  deleteSLAReason: async (id: number) => {
    const response = await slaApiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sla-reason/${id}`);
    return response.data.data;
  },

  // POST /api/v1/sla-reason/battery-version
  createSLAReasonBatteryVersion: async (data: {
    batteryVersion: BatteryVersion;
    reasonId: number;
  }) => {
    const response = await slaApiClient.post<ApiResponse<unknown>>('/api/v1/sla-reason/battery-version', data);
    return response.data.data;
  },

  // DELETE /api/v1/sla-reason/battery-version/{id}
  deleteSLAReasonBatteryVersion: async (id: number) => {
    const response = await slaApiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sla-reason/battery-version/${id}`);
    return response.data.data;
  },

  /**
   * History GAMAS CRUD
   */
  // POST /api/v1/history-gamas/
  createHistoryGAMAS: async (data: {
    date: string;
    description: string;
  }) => {
    const response = await slaApiClient.post<ApiResponse<unknown>>('/api/v1/history-gamas/', data);
    return response.data.data;
  },

  // GET /api/v1/history-gamas/
  getHistoryGAMAS: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchSlaApiPaginated<Array<{
      id: number;
      date: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    }>>('/api/v1/history-gamas/', { params });
  },

  // GET /api/v1/history-gamas/{id}
  getHistoryGAMASById: async (id: number) => {
    return fetchSlaApi<{
      id: number;
      date: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    }>(`/api/v1/history-gamas/${id}`);
  },

  // PATCH /api/v1/history-gamas/{id}
  updateHistoryGAMAS: async (id: number, data: {
    date?: string;
    description?: string;
  }) => {
    const response = await slaApiClient.patch<ApiResponse<unknown>>(`/api/v1/history-gamas/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/history-gamas/{id}
  deleteHistoryGAMAS: async (id: number) => {
    const response = await slaApiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/history-gamas/${id}`);
    return response.data.data;
  },

  /**
   * Raw SLA CRUD
   */
  // GET /api/v1/sla-bakti/raw
  getRawSLA: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchSlaApiPaginated<Array<unknown>>('/api/v1/sla-bakti/raw', { params });
  },

  // DELETE /api/v1/sla-bakti/raw
  deleteRawSLAByDateRange: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    const response = await slaApiClient.delete<ApiResponse<{ message: string; deletedCount?: number }>>('/api/v1/sla-bakti/raw', {
      params,
    });
    return response.data.data;
  },

  // GET /api/v1/sla-bakti/raw/{siteId}
  getRawSLABySiteId: async (siteId: string, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchSlaApiPaginated<Array<unknown>>(`/api/v1/sla-bakti/raw/${siteId}`, { params });
  },

  // DELETE /api/v1/sla-bakti/raw/{siteId}
  deleteRawSLABySiteId: async (siteId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await slaApiClient.delete<ApiResponse<{ message: string; deletedCount?: number }>>(`/api/v1/sla-bakti/raw/${siteId}`, {
      params,
    });
    return response.data.data;
  },

  /**
   * Sites API (temporary - akan dipindah ke shared service)
   * TODO: Pindah ke shared service
   */
  getSites: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    province?: string;
    sccType?: string;
    batteryVersion?: string;
    siteId?: string;
    prCode?: string;
  }) => {
    // Import sitesApiClient dari lib/api
    const { sitesApiClient } = await import('@/lib/api');
    const response = await sitesApiClient.get<ApiResponse<{
      data: Array<unknown>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>('/api/v1/sites/', { params });
    
    // Sites API returns { success: true, data: { data: [...], pagination: {...} } }
    const apiData = response.data.data as { data: Array<unknown>; pagination: any };
    return {
      data: apiData.data,
      pagination: apiData.pagination || response.data.pagination,
    };
  },
};

