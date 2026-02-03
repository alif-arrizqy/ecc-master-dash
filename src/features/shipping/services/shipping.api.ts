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
 * Response structure: { success: true, message: "...", data: { items: [...], pagination: {...} } }
 */
async function fetchShippingApiPaginated<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; pagination: ApiResponse<T>['pagination'] }> {
  const response = await shippingApiClient.get<ApiResponse<unknown>>(endpoint, config);
  const responseData = response.data.data;
  
  // Handle structure: { success: true, data: { items: [...], pagination: {...} } }
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    const paginatedData = responseData as { items?: T; pagination?: ApiResponse<T>['pagination'] };
    
    // Check if it has 'items' property (shipping services format)
    if ('items' in paginatedData && Array.isArray(paginatedData.items)) {
      return {
        data: paginatedData.items as T,
        pagination: paginatedData.pagination || response.data.pagination,
      };
    }
    
    // Check if it has 'data' property (nested format)
    if ('data' in paginatedData && Array.isArray((paginatedData as { data: T }).data)) {
      const nestedData = paginatedData as { data: T; pagination?: ApiResponse<T>['pagination'] };
      return {
        data: nestedData.data,
        pagination: nestedData.pagination || response.data.pagination,
      };
    }
  }
  
  // Handle flat structure: { success: true, data: [...], pagination: {...} }
  if (Array.isArray(responseData)) {
    return {
      data: responseData as T,
      pagination: response.data.pagination,
    };
  }
  
  // Fallback: return empty array
  return {
    data: ([] as unknown as T),
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
    province?: string;
    cluster?: string;
    startDate?: string;
    endDate?: string;
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
    if (data.resi_number) formData.append('resi_number', data.resi_number);
    if (data.resi_image) formData.append('resi_image', data.resi_image);
    
    // Convert status to uppercase with underscore format for backend
    const statusStr = String(data.status);
    let statusValue: string;
    if (statusStr === 'request gudang' || statusStr === 'REQUEST_GUDANG') {
      statusValue = 'REQUEST_GUDANG';
    } else if (statusStr === 'proses kirim' || statusStr === 'PROSES_KIRIM') {
      statusValue = 'PROSES_KIRIM';
    } else if (statusStr === 'selesai' || statusStr === 'SELESAI') {
      statusValue = 'SELESAI';
    } else {
      // Fallback: convert to uppercase with underscore
      statusValue = statusStr.toUpperCase().replace(/\s+/g, '_');
    }
    formData.append('status', statusValue);
    
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
   * PATCH /api/v1/shipping-spare-part/:id
   * Backend hanya menerima: resi_number, resi_image, status
   */
  update: async (id: number, data: Partial<ShippingSparePartFormData>): Promise<ShippingSparePart> => {
    const formData = new FormData();
    
    // Hanya kirim field yang diizinkan oleh backend (sesuai ShippingSparePartUpdateSchema)
    if (data.resi_number) {
      formData.append('resi_number', data.resi_number);
    }
    if (data.resi_image) {
      formData.append('resi_image', data.resi_image);
    }
    
    if (data.status) {
      // Convert status to uppercase with underscore format for backend
      let statusValue: string;
      const statusStr = String(data.status);
      if (statusStr === 'request gudang' || statusStr === 'REQUEST_GUDANG') {
        statusValue = 'REQUEST_GUDANG';
      } else if (statusStr === 'proses kirim' || statusStr === 'PROSES_KIRIM') {
        statusValue = 'PROSES_KIRIM';
      } else if (statusStr === 'selesai' || statusStr === 'SELESAI') {
        statusValue = 'SELESAI';
      } else {
        // Fallback: convert to uppercase with underscore
        statusValue = statusStr.toUpperCase().replace(/\s+/g, '_');
      }
      formData.append('status', statusValue);
    }

    const response = await shippingApiClient.patch<ApiResponse<ShippingSparePart>>(
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
   * GET /api/v1/shipping-spare-part/export
   */
  exportToExcel: async (params?: {
    status?: string | string[];
    site_id?: string;
    address_id?: number;
    problem_id?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    province?: string;
    cluster?: string;
  }): Promise<{ blob: Blob; filename: string }> => {
    const response = await shippingApiClient.get('/api/v1/shipping-spare-part/export', {
      params,
      responseType: 'blob',
    });
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `shipping-spare-part-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      blob: response.data,
      filename,
    };
  },

  /**
   * Export to PDF
   * GET /api/v1/shipping-spare-part/export-pdf
   */
  exportToPDF: async (params?: {
    status?: string | string[];
    site_id?: string;
    address_id?: number;
    problem_id?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    province?: string;
    cluster?: string;
  }): Promise<{ blob: Blob; filename: string }> => {
    const response = await shippingApiClient.get('/api/v1/shipping-spare-part/export-pdf', {
      params,
      responseType: 'blob',
    });
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `shipping-spare-part-${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      blob: response.data,
      filename,
    };
  },
};

/**
 * Retur Spare Part API endpoints
 */
export const returSparePartApi = {
  /**
   * Get statistics
   * GET /api/v1/retur-spare-part/statistics
   */
  getStatistics: async (): Promise<ShippingStatistics> => {
    return fetchShippingApi<ShippingStatistics>('/api/v1/retur-spare-part/statistics');
  },

  /**
   * Get all retur spare part
   * GET /api/v1/retur-spare-part
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    shipper?: string;
    source_spare_part?: string;
  }) => {
    return fetchShippingApiPaginated<ReturSparePart[]>('/api/v1/retur-spare-part', {
      params,
    });
  },

  /**
   * Get retur spare part by id
   * GET /api/v1/retur-spare-part/:id
   */
  getById: async (id: number): Promise<ReturSparePart> => {
    return fetchShippingApi<ReturSparePart>(`/api/v1/retur-spare-part/${id}`);
  },

  /**
   * Create retur spare part
   * POST /api/v1/retur-spare-part
   */
  create: async (data: ReturSparePartFormData): Promise<ReturSparePart> => {
    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('shipper', data.shipper);
    formData.append('source_spare_part', data.source_spare_part);
    if (data.list_spare_part) formData.append('list_spare_part', data.list_spare_part);
    if (data.image) formData.append('image', data.image);
    if (data.notes) formData.append('notes', data.notes);

    const response = await shippingApiClient.post<ApiResponse<ReturSparePart>>(
      '/api/v1/retur-spare-part',
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
   * Update retur spare part
   * PATCH /api/v1/retur-spare-part/:id
   */
  update: async (id: number, data: Partial<ReturSparePartFormData>): Promise<ReturSparePart> => {
    const formData = new FormData();
    if (data.date) formData.append('date', data.date);
    if (data.shipper) formData.append('shipper', data.shipper);
    if (data.source_spare_part) formData.append('source_spare_part', data.source_spare_part);
    if (data.list_spare_part !== undefined) formData.append('list_spare_part', data.list_spare_part);
    if (data.image) formData.append('image', data.image);
    if (data.notes !== undefined) formData.append('notes', data.notes || '');

    const response = await shippingApiClient.patch<ApiResponse<ReturSparePart>>(
      `/api/v1/retur-spare-part/${id}`,
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
   * Delete retur spare part
   * DELETE /api/v1/retur-spare-part/:id
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await shippingApiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/retur-spare-part/${id}`
    );
    return response.data.data;
  },

  /**
   * Export to excel
   * GET /api/v1/retur-spare-part/export
   */
  exportToExcel: async (params?: {
    startDate?: string;
    endDate?: string;
    shipper?: string;
    source_spare_part?: string;
    search?: string;
  }): Promise<{ blob: Blob; filename: string }> => {
    const response = await shippingApiClient.get('/api/v1/retur-spare-part/export', {
      params,
      responseType: 'blob',
    });
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `retur-spare-part-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      blob: response.data,
      filename,
    };
  },

  /**
   * Export to PDF
   * GET /api/v1/retur-spare-part/export-pdf
   */
  exportToPDF: async (params?: {
    startDate?: string;
    endDate?: string;
    shipper?: string;
    source_spare_part?: string;
    search?: string;
  }): Promise<{ blob: Blob; filename: string }> => {
    const response = await shippingApiClient.get('/api/v1/retur-spare-part/export-pdf', {
      params,
      responseType: 'blob',
    });
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `retur-spare-part-${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      blob: response.data,
      filename,
    };
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

