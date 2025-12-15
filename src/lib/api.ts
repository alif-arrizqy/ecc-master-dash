/**
 * API Service for SLA Dashboard
 * Using Axios for HTTP requests
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set. API calls may fail.');
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
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || '',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Can be used to add auth tokens, modify requests, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    // Example: Add auth token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handle global error responses
 */
apiClient.interceptors.response.use(
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
      
      console.error(`API Error [${status}]:`, message);
      
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
      console.error('API Error: No response received', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic API function with error handling
 * Errors are handled by the response interceptor
 */
async function fetchApi<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(endpoint, config);
  return response.data.data;
}

/**
 * Generic API function for paginated responses
 * Errors are handled by the response interceptor
 */
async function fetchApiPaginated<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; pagination: ApiResponse<T>['pagination'] }> {
  const response = await apiClient.get<ApiResponse<T>>(endpoint, config);
  return {
    data: response.data.data,
    pagination: response.data.pagination,
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
    return fetchApi<Array<{ date: string; value: number }>>(
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
    return fetchApi<Array<{ date: string; value: number }>>(
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
    return fetchApi<Array<{ name: string; value: number }>>(
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
    return fetchApi<{
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
    return fetchApi<Array<{
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
    return fetchApiPaginated<Array<{
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
    return fetchApi<{
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
    return fetchApi<{
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

    // API returns pagination inside data object
    const response = await apiClient.get<ApiResponse<{
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
    
    const response = await apiClient.post<ApiResponse<{
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
    const response = await apiClient.post<ApiResponse<unknown>>('/api/v1/sla-bakti/problems', data);
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
    return fetchApiPaginated<Array<{
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
    const response = await apiClient.patch<ApiResponse<unknown>>(`/api/v1/sla-bakti/problems/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/sla-bakti/problems/{id}
  deleteSLAProblem: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sla-bakti/problems/${id}`);
    return response.data.data;
  },

  /**
   * SLA Reason CRUD
   */
  // POST /api/v1/sla-reason/
  createSLAReason: async (data: { reason: string }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/v1/sla-reason/', data);
    return response.data.data;
  },

  // GET /api/v1/sla-reason/
  getSLAReasons: async (params?: { page?: number; limit?: number }) => {
    return fetchApiPaginated<Array<{
      id: number;
      reason: string;
      createdAt: string;
      updatedAt: string;
    }>>('/api/v1/sla-reason/', { params });
  },

  // GET /api/v1/sla-reason/{id}
  getSLAReason: async (id: number) => {
    return fetchApi<{
      id: number;
      reason: string;
      createdAt: string;
      updatedAt: string;
    }>(`/api/v1/sla-reason/${id}`);
  },

  // PATCH /api/v1/sla-reason/{id}
  updateSLAReason: async (id: number, data: { reason: string }) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/api/v1/sla-reason/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/sla-reason/{id}
  deleteSLAReason: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sla-reason/${id}`);
    return response.data.data;
  },

  // POST /api/v1/sla-reason/battery-version
  createSLAReasonBatteryVersion: async (data: {
    batteryVersion: BatteryVersion;
    reasonId: number;
  }) => {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/v1/sla-reason/battery-version', data);
    return response.data.data;
  },

  // DELETE /api/v1/sla-reason/battery-version/{id}
  deleteSLAReasonBatteryVersion: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sla-reason/battery-version/${id}`);
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
    const response = await apiClient.post<ApiResponse<unknown>>('/api/v1/history-gamas/', data);
    return response.data.data;
  },

  // GET /api/v1/history-gamas/
  getHistoryGAMAS: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return fetchApiPaginated<Array<{
      id: number;
      date: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    }>>('/api/v1/history-gamas/', { params });
  },

  // GET /api/v1/history-gamas/{id}
  getHistoryGAMASById: async (id: number) => {
    return fetchApi<{
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
    const response = await apiClient.patch<ApiResponse<unknown>>(`/api/v1/history-gamas/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/history-gamas/{id}
  deleteHistoryGAMAS: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/history-gamas/${id}`);
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
    return fetchApiPaginated<Array<unknown>>('/api/v1/sla-bakti/raw', { params });
  },

  // DELETE /api/v1/sla-bakti/raw
  deleteRawSLAByDateRange: async (params: {
    startDate: string;
    endDate: string;
  }) => {
    const response = await apiClient.delete<ApiResponse<{ message: string; deletedCount?: number }>>('/api/v1/sla-bakti/raw', {
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
    return fetchApiPaginated<Array<unknown>>(`/api/v1/sla-bakti/raw/${siteId}`, { params });
  },

  // DELETE /api/v1/sla-bakti/raw/{siteId}
  deleteRawSLABySiteId: async (siteId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.delete<ApiResponse<{ message: string; deletedCount?: number }>>(`/api/v1/sla-bakti/raw/${siteId}`, {
      params,
    });
    return response.data.data;
  },
};

