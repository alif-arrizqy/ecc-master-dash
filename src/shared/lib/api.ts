/**
 * Shared API Clients and Services
 * Base API clients dan shared services untuk digunakan oleh feature modules
 */

import type { AxiosRequestConfig } from 'axios';

// Re-export base clients dari lib/api.ts
export { slaApiClient, sitesApiClient, monitoringApiClient, shippingApiClient, sparepartApiClient } from '@/lib/api';
export type { BatteryVersion } from '@/lib/api';

/**
 * ============================================
 * SHARED TYPES
 * ============================================
 */
export interface ApiResponse<T> {
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
 * ============================================
 * HELPER FUNCTIONS (Internal)
 * ============================================
 * Helper functions untuk fetch API dengan error handling
 */

// Import sitesApiClient untuk digunakan di helper functions
import { sitesApiClient } from '@/lib/api';

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
 * ============================================
 * SHARED SERVICES
 * ============================================
 * Services yang digunakan oleh multiple features
 */

/**
 * Sites API - Shared Service
 * Digunakan oleh:
 * - features/sites/ (CRUD sites)
 * - features/sla/ (mungkin untuk dropdown/filter)
 * - features/monitoring/ (untuk mapping site)
 */
export const sitesApi = {
  /**
   * Get sites with filters and pagination
   * GET /api/v1/sites/
   */
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

  /**
   * Create a new site
   * POST /api/v1/sites/
   */
  createSite: async (data: unknown) => {
    const response = await sitesApiClient.post<ApiResponse<unknown>>('/api/v1/sites/', data);
    return response.data.data;
  },

  /**
   * Get site by ID
   * GET /api/v1/sites/{id}
   */
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

  /**
   * Update a site
   * PUT /api/v1/sites/{id}
   */
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

  /**
   * Delete a site
   * DELETE /api/v1/sites/{id}
   */
  deleteSite: async (id: string | number, hard: boolean = false) => {
    const url = hard ? `/api/v1/sites/${id}?hard=true` : `/api/v1/sites/${id}`;
    const response = await sitesApiClient.delete<ApiResponse<{ message: string }>>(url);
    return response.data.data;
  },

  /**
   * Get site statistics
   * GET /api/v1/sites/statistics
   */
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
