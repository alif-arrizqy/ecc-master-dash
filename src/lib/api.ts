/**
 * API Service for SLA Dashboard
 * Using Axios for HTTP requests
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// Get environment variables with fallback defaults for development
const SLA_SERVICES_URL = import.meta.env.VITE_SLA_SERVICES_URL;
const SITES_SERVICES_URL = import.meta.env.VITE_SITES_SERVICES_URL;
const MONITORING_SERVICES_URL = import.meta.env.VITE_MONITORING_SERVICES_URL;

if (!import.meta.env.VITE_SLA_SERVICES_URL) {
  console.warn('VITE_SLA_SERVICES_URL is not set.');
}

if (!import.meta.env.VITE_SITES_SERVICES_URL) {
  console.warn('VITE_SITES_SERVICES_URL is not set.');
}

export type BatteryVersion = 'talis5' | 'mix' | 'jspro';

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
 * Create axios instance for SLA Services
 */
const slaApiClient: AxiosInstance = axios.create({
  baseURL: SLA_SERVICES_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create axios instance for Sites Services
 */
const sitesApiClient: AxiosInstance = axios.create({
  baseURL: SITES_SERVICES_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create axios instance for Monitoring Services
 */
const monitoringApiClient: AxiosInstance = axios.create({
  baseURL: MONITORING_SERVICES_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor for SLA Services
 */
slaApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for SLA Services
 */
slaApiClient.interceptors.response.use(
  (response) => {
    // Check if response has success field and it's false
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (!response.data.success) {
        throw new Error('API returned unsuccessful response');
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data
        ? (error.response.data as { message?: string })?.message || error.message
        : error.message;
      
      console.error(`SLA API Error [${status}]:`, message);
      
      // You can add specific error handling based on status codes
      switch (status) {
        case 401:
          // Handle unauthorized - maybe redirect to login
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('SLA API Error: No response received', error.request);
      
      // Check if it's a CORS error
      if (error.request.status === 0 || error.code === 'ERR_FAILED') {
        const isCorsError = error.message?.includes('CORS') || 
                           error.message?.includes('blocked by CORS') ||
                           error.message?.includes('Access-Control');
        if (isCorsError) {
          const corsError = new Error('CORS Error: Server tidak mengizinkan method ini. Pastikan backend sudah mengkonfigurasi CORS dengan benar.');
          return Promise.reject(corsError);
        }
      }
    } else {
      // Something else happened
      console.error('SLA API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Request interceptor for Sites Services
 */
sitesApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for Sites Services
 */
sitesApiClient.interceptors.response.use(
  (response) => {
    // Check if response has success field and it's false
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (!response.data.success) {
        throw new Error('API returned unsuccessful response');
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data
        ? (error.response.data as { message?: string })?.message || error.message
        : error.message;
      
      console.error(`Sites API Error [${status}]:`, message);
      
      // You can add specific error handling based on status codes
      switch (status) {
        case 401:
          // Handle unauthorized - maybe redirect to login
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Sites API Error: No response received', error.request);
    } else {
      // Something else happened
      console.error('Sites API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic API function with error handling for SLA Services
 * Errors are handled by the response interceptor
 */
async function fetchSlaApi<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await slaApiClient.get<ApiResponse<T>>(endpoint, config);
  return response.data.data;
}

/**
 * Generic API function for paginated responses from SLA Services
 * Errors are handled by the response interceptor
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
 * Generic API function with error handling for Sites Services
 * Errors are handled by the response interceptor
 */
async function fetchSitesApi<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await sitesApiClient.get<ApiResponse<T>>(endpoint, config);
  return response.data.data;
}

/**
 * Generic API function for paginated responses from Sites Services
 * Errors are handled by the response interceptor
 * Response structure: { success: true, data: { data: [...], pagination: {...} } }
 */
async function fetchSitesApiPaginated<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; pagination: ApiResponse<T>['pagination'] }> {
  const response = await sitesApiClient.get<ApiResponse<{ data: T; pagination: ApiResponse<T>['pagination'] }>>(endpoint, config);
  // Response structure: response.data = { success: true, data: { data: [...], pagination: {...} } }
  // So we need to access response.data.data.data for the array and response.data.data.pagination for pagination
  const responseData = response.data.data as { data: T; pagination: ApiResponse<T>['pagination'] };
  return {
    data: responseData.data,
    pagination: responseData.pagination,
  };
}

/**
 * API Endpoints
 */
export const slaApi = {
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
   * GET /api/v1/sla-bakti/report
   */
  getSLAReportDetail: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    return fetchSlaApi<{
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
            talis5: {
              name: string;
              summary: {
                totalSites: number;
                sla: number;
                slaUnit: string;
              };
              message: string;
              downSla: Array<{
                date: string;
                sla: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              underSla: Array<{
                date: string;
                sla: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              dropSla: Array<{
                date: string;
                slaBefore: number;
                slaNow: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              upSla: Array<{
                date: string;
                slaBefore: number;
                slaNow: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
            };
            mix: {
              name: string;
              summary: {
                totalSites: number;
                sla: number;
                slaUnit: string;
              };
              message: string;
              downSla: Array<{
                date: string;
                sla: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              underSla: Array<{
                date: string;
                sla: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              dropSla: Array<{
                date: string;
                slaBefore: number;
                slaNow: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              upSla: Array<{
                date: string;
                slaBefore: number;
                slaNow: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
            };
            jspro: {
              name: string;
              summary: {
                totalSites: number;
                sla: number;
                slaUnit: string;
              };
              message: string;
              downSla: Array<{
                date: string;
                sla: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              underSla: Array<{
                date: string;
                sla: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              dropSla: Array<{
                date: string;
                slaBefore: number;
                slaNow: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
              upSla: Array<{
                date: string;
                slaBefore: number;
                slaNow: number;
                slaUnit: string;
                downtime: string;
                problem: string;
                site: string;
                battery_version: string;
              }>;
            };
          };
        };
      };
    }>(`/api/v1/sla-bakti/daily/report`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
  },

  /**
   * Get sites with Potensi SP status
   * GET /api/v1/sla-bakti/master
   */
  getPotensiSPSites: async (params: {
    startDate: string;
    endDate: string;
    statusSP: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchSlaApi<{
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
        // Legacy fields for backward compatibility
        slaAvg?: number;
        sla_avg?: number;
        status?: string;
        [key: string]: unknown;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/v1/sla-bakti/master`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        statusSP: params.statusSP,
        page: params.page || 1,
        limit: params.limit || 50,
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
        // Legacy fields for backward compatibility
        slaAvg?: number;
        sla_avg?: number;
        status?: string;
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
   * Sites Management CRUD
   */
  // GET /api/v1/sites/
  getSites: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
    status?: string; // terestrial, non_terestrial, non-terestrial
    province?: string; // province name or region (papua/maluku)
    sccType?: string; // scc_srne, scc_epever, scc-srne, scc-epever
    batteryVersion?: string; // talis5, mix, jspro
    siteId?: string; // Exact match for siteId (takes priority over search)
    prCode?: string; // Exact match for prCode (takes priority over search)
  }) => {
    return fetchSitesApiPaginated<Array<unknown>>('/api/v1/sites/', { params });
  },

  // POST /api/v1/sites/
  createSite: async (data: unknown) => {
    const response = await sitesApiClient.post<ApiResponse<unknown>>('/api/v1/sites/', data);
    return response.data.data;
  },

  // GET /api/v1/sites/{id}
  getSiteById: async (id: string | number) => {
    return fetchSitesApi<{
      id: number;
      site_id: string;
      site_name: string;
      province: string;
      ip_snmp?: string;
      scc_type?: string;
      battery_version?: string;
      total_battery?: number;
      talis_installed?: string;
      status?: string;
      webapp_url?: string;
      [key: string]: unknown;
    }>(`/api/v1/sites/${id}`);
  },

  // PUT /api/v1/sites/{id}
  updateSite: async (id: string | number, data: {
    site_id?: string;
    site_name?: string;
    province?: string;
    ip_snmp?: string;
    scc_type?: string;
    battery_version?: string;
    total_battery?: number;
    talis_installed?: string;
    status?: string;
    webapp_url?: string;
    [key: string]: unknown;
  }) => {
    const response = await sitesApiClient.put<ApiResponse<unknown>>(`/api/v1/sites/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/sites/{id}
  deleteSite: async (id: string | number, hard: boolean = false) => {
    const url = hard ? `/api/v1/sites/${id}?hard=true` : `/api/v1/sites/${id}`;
    const response = await sitesApiClient.delete<ApiResponse<{ message: string }>>(url);
    return response.data.data;
  },


  // GET /api/v1/sites/statistics
  getSiteStatistics: async () => {
    return fetchSitesApi<{
      summary: {
        talis5: { totalSites: number };
        mix: { totalSites: number };
        jspro: { totalSites: number };
      };
      maluku: {
        totalSite: {
          all: number;
          active: number;
          inactive: number;
        };
        byProvince: Array<{ province: string; count: number }>;
        byBatteryVersion: {
          [key: string]: {
            summary: { total: number };
            sites: Array<{ siteId: string; siteName: string }>;
          };
        };
        byStatusSites: Record<string, number>;
        bySccType: Record<string, number>;
      };
      papua: {
        totalSite: {
          all: number;
          active: number;
          inactive: number;
        };
        byProvince: Array<{ province: string; count: number }>;
        byBatteryVersion: {
          [key: string]: {
            summary: { total: number };
            sites: Array<{ siteId: string; siteName: string }>;
          };
        };
        byStatusSites: Record<string, number>;
        bySccType: Record<string, number>;
      };
    }>('/api/v1/sites/statistics');
  },
};

/**
 * Monitoring Services API
 */
export const monitoringApi = {
  /**
   * Get all site downtime data
   * GET /api/v1/site-down
   */
  getSiteDowntime: async (params?: {
    page?: number;
    limit?: number;
    siteId?: string;
  }) => {
    return monitoringApiClient.get<ApiResponse<{
      data: Array<{
        id: number;
        siteId: string;
        siteName: string | null;
        downSince: string;
        downSeconds: number | null;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>('/api/v1/site-down', {
      params,
    });
  },

  /**
   * Get site downtime by Site ID
   * GET /api/v1/site-down/:siteId
   */
  getSiteDowntimeBySiteId: async (siteId: string) => {
    return monitoringApiClient.get<ApiResponse<{
      id: number;
      siteId: string;
      siteName: string | null;
      downSince: string;
      downSeconds: number | null;
      createdAt: string;
      updatedAt: string;
    }>>(`/api/v1/site-down/${siteId}`);
  },
};

