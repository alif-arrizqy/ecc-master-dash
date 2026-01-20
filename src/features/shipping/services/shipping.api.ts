/**
 * Shipping API Service
 * API methods untuk Shipping Spare Part dan Retur Spare Part
 */

import { shippingApiClient } from '@/shared/lib/api';
import type { AxiosRequestConfig } from 'axios';
import type {
  ShippingSparePart,
  ReturSparePart,
  Address,
  ProblemMaster,
  ShippingStatistics,
  ShippingSparePartFormData,
  ReturSparePartFormData,
} from '../types/shipping.types';

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
 * Generic API function for Shipping Services
 */
async function fetchShippingApi<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await shippingApiClient.get<ApiResponse<T>>(endpoint, config);
  return response.data.data;
}

/**
 * Generic API function for paginated responses from Shipping Services
 */
async function fetchShippingApiPaginated<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; pagination: ApiResponse<T>['pagination'] }> {
  const response = await shippingApiClient.get<ApiResponse<T>>(endpoint, config);
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Shipping Spare Part API endpoints
 */
export const shippingSparePartApi = {
  /**
   * Get statistics
   * GET /api/v1/shipping-spare-part/statistics
   */
  getStatistics: async (): Promise<ShippingStatistics> => {
    return fetchShippingApi<ShippingStatistics>('/api/v1/shipping-spare-part/statistics');
  },

  /**
   * Get all shipping spare part
   * GET /api/v1/shipping-spare-part
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    site_id?: string;
  }) => {
    return fetchShippingApiPaginated<ShippingSparePart[]>('/api/v1/shipping-spare-part', {
      params,
    });
  },

  /**
   * Get shipping spare part by id
   * GET /api/v1/shipping-spare-part/:id
   */
  getById: async (id: number): Promise<ShippingSparePart> => {
    return fetchShippingApi<ShippingSparePart>(`/api/v1/shipping-spare-part/${id}`);
  },

  /**
   * Create shipping spare part
   * POST /api/v1/shipping-spare-part
   */
  create: async (data: ShippingSparePartFormData): Promise<ShippingSparePart> => {
    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('site_id', data.site_id);
    if (data.address_id) formData.append('address_id', String(data.address_id));
    if (data.sparepart_note) formData.append('sparepart_note', data.sparepart_note);
    if (data.problem_id) formData.append('problem_id', String(data.problem_id));
    if (data.problem_new) formData.append('problem_new', data.problem_new);
    if (data.ticket_number) formData.append('ticket_number', data.ticket_number);
    if (data.ticket_image) formData.append('ticket_image', data.ticket_image);
    if (data.resi_image) formData.append('resi_image', data.resi_image);
    formData.append('status', data.status);
    if (data.pr_code) formData.append('pr_code', data.pr_code);

    const response = await shippingApiClient.post<ApiResponse<ShippingSparePart>>(
      '/api/v1/shipping-spare-part',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Update shipping spare part
   * PUT /api/v1/shipping-spare-part/:id
   */
  update: async (id: number, data: Partial<ShippingSparePartFormData>): Promise<ShippingSparePart> => {
    const formData = new FormData();
    if (data.date) formData.append('date', data.date);
    if (data.site_id) formData.append('site_id', data.site_id);
    if (data.address_id !== undefined) formData.append('address_id', String(data.address_id));
    if (data.sparepart_note !== undefined) formData.append('sparepart_note', data.sparepart_note);
    if (data.problem_id !== undefined) formData.append('problem_id', String(data.problem_id));
    if (data.problem_new) formData.append('problem_new', data.problem_new);
    if (data.ticket_number !== undefined) formData.append('ticket_number', data.ticket_number);
    if (data.ticket_image) formData.append('ticket_image', data.ticket_image);
    if (data.resi_image) formData.append('resi_image', data.resi_image);
    if (data.status) formData.append('status', data.status);
    if (data.pr_code !== undefined) formData.append('pr_code', data.pr_code);

    const response = await shippingApiClient.put<ApiResponse<ShippingSparePart>>(
      `/api/v1/shipping-spare-part/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Delete shipping spare part
   * DELETE /api/v1/shipping-spare-part/:id
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await shippingApiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/shipping-spare-part/${id}`
    );
    return response.data.data;
  },

  /**
   * Export to excel
   * GET /api/v1/shipping-spare-part/export-to-excel
   */
  exportToExcel: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> => {
    const response = await shippingApiClient.get('/api/v1/shipping-spare-part/export-to-excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

/**
 * Retur Spare Part API endpoints
 */
export const returSparePartApi = {
  /**
   * Get statistics
   * GET /api/v1/return-spare-part/statistics
   */
  getStatistics: async (): Promise<ShippingStatistics> => {
    return fetchShippingApi<ShippingStatistics>('/api/v1/return-spare-part/statistics');
  },

  /**
   * Get all retur spare part
   * GET /api/v1/return-spare-part
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return fetchShippingApiPaginated<ReturSparePart[]>('/api/v1/return-spare-part', {
      params,
    });
  },

  /**
   * Get retur spare part by id
   * GET /api/v1/return-spare-part/:id
   */
  getById: async (id: number): Promise<ReturSparePart> => {
    return fetchShippingApi<ReturSparePart>(`/api/v1/return-spare-part/${id}`);
  },

  /**
   * Create retur spare part
   * POST /api/v1/return-spare-part
   */
  create: async (data: ReturSparePartFormData): Promise<ReturSparePart> => {
    const response = await shippingApiClient.post<ApiResponse<ReturSparePart>>(
      '/api/v1/return-spare-part',
      data
    );
    return response.data.data;
  },

  /**
   * Update retur spare part
   * PUT /api/v1/return-spare-part/:id
   */
  update: async (id: number, data: Partial<ReturSparePartFormData>): Promise<ReturSparePart> => {
    const response = await shippingApiClient.put<ApiResponse<ReturSparePart>>(
      `/api/v1/return-spare-part/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete retur spare part
   * DELETE /api/v1/return-spare-part/:id
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await shippingApiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/return-spare-part/${id}`
    );
    return response.data.data;
  },

  /**
   * Export to excel
   * GET /api/v1/return-spare-part/export-to-excel
   */
  exportToExcel: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const response = await shippingApiClient.get('/api/v1/return-spare-part/export-to-excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

/**
 * Problem Master API endpoints
 */
export const problemMasterApi = {
  /**
   * Get all problem master
   * GET /api/v1/problem-master
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return fetchShippingApiPaginated<ProblemMaster[]>('/api/v1/problem-master', {
      params,
    });
  },

  /**
   * Create problem master
   * POST /api/v1/problem-master
   */
  create: async (data: { problem: string }): Promise<ProblemMaster> => {
    const response = await shippingApiClient.post<ApiResponse<ProblemMaster>>(
      '/api/v1/problem-master',
      data
    );
    return response.data.data;
  },

  /**
   * Update problem master
   * PUT /api/v1/problem-master/:id
   */
  update: async (id: number, data: { problem: string }): Promise<ProblemMaster> => {
    const response = await shippingApiClient.put<ApiResponse<ProblemMaster>>(
      `/api/v1/problem-master/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete problem master
   * DELETE /api/v1/problem-master/:id
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await shippingApiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/problem-master/${id}`
    );
    return response.data.data;
  },
};

/**
 * Address API endpoints
 */
export const addressApi = {
  /**
   * Get all address
   * GET /api/v1/address
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return fetchShippingApiPaginated<Address[]>('/api/v1/address', {
      params,
    });
  },

  /**
   * Create address
   * POST /api/v1/address
   */
  create: async (data: Partial<Address>): Promise<Address> => {
    const response = await shippingApiClient.post<ApiResponse<Address>>('/api/v1/address', data);
    return response.data.data;
  },

  /**
   * Update address
   * PUT /api/v1/address/:id
   */
  update: async (id: number, data: Partial<Address>): Promise<Address> => {
    const response = await shippingApiClient.put<ApiResponse<Address>>(`/api/v1/address/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete address
   * DELETE /api/v1/address/:id
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await shippingApiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/address/${id}`
    );
    return response.data.data;
  },
};

