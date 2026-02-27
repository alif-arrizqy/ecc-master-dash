/**
 * Monitoring API Service
 * Menggunakan monitoringApiClient dari shared/lib/api
 */

import { monitoringApiClient } from '@/shared/lib/api';
import { 
  SiteDownResponse, 
  SiteUpResponse, 
  MonitoringFilters,
  SiteDown,
  SiteUp
} from '../types/monitoring.types';

/**
 * Monitoring API endpoints
 */
export const monitoringApi = {
  /**
   * Get all site down data
   * GET /api/v1/monitoring/site-down
   */
  getSiteDown: async (filters?: MonitoringFilters): Promise<SiteDownResponse> => {
    const response = await monitoringApiClient.get<SiteDownResponse>('/api/v1/monitoring/site-down', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get site down by Site ID
   * GET /api/v1/monitoring/site-down/:siteId
   */
  getSiteDownBySiteId: async (siteId: string): Promise<{ success: boolean; data: SiteDown }> => {
    const response = await monitoringApiClient.get<{ success: boolean; data: SiteDown }>(
      `/api/v1/monitoring/site-down/${siteId}`
    );
    return response.data;
  },

  /**
   * Get all site up data
   * GET /api/v1/monitoring/site-up
   */
  getSiteUp: async (filters?: MonitoringFilters): Promise<SiteUpResponse> => {
    const response = await monitoringApiClient.get<SiteUpResponse>('/api/v1/monitoring/site-up', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get site up by Site ID
   * GET /api/v1/monitoring/site-up/:siteId
   */
  getSiteUpBySiteId: async (siteId: string): Promise<{ success: boolean; data: SiteUp }> => {
    const response = await monitoringApiClient.get<{ success: boolean; data: SiteUp }>(
      `/api/v1/monitoring/site-up/${siteId}`
    );
    return response.data;
  },

  /**
   * Sync site down from NMS API
   * POST /api/v1/monitoring/site-down/sync
   */
  syncSiteDown: async (): Promise<{
    success: boolean;
    data: {
      inserted: number;
      updated: number;
      errors: number;
      skipped: number;
    };
  }> => {
    const response = await monitoringApiClient.post<{
      success: boolean;
      data: {
        inserted: number;
        updated: number;
        errors: number;
        skipped: number;
      };
    }>('/api/v1/monitoring/site-down/sync');
    return response.data;
  },

  /**
   * Sync site up from NMS API
   * POST /api/v1/monitoring/site-up/sync
   */
  syncSiteUp: async (): Promise<{
    success: boolean;
    data: {
      inserted: number;
      updated: number;
      errors: number;
      skipped: number;
    };
  }> => {
    const response = await monitoringApiClient.post<{
      success: boolean;
      data: {
        inserted: number;
        updated: number;
        errors: number;
        skipped: number;
      };
    }>('/api/v1/monitoring/site-up/sync');
    return response.data;
  },
};

