/**
 * Custom hooks for Sites Management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { slaApi } from '@/lib/api';
import { Site, SiteFormData, SiteQueryParams, SiteStatistics } from './types';
import { ITEMS_PER_PAGE } from './constants';

/**
 * Hook for fetching sites with filters and pagination
 */
export const useSitesQuery = (params: SiteQueryParams) => {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: () => slaApi.getSites(params),
  });
};

/**
 * Hook for creating a new site
 */
export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SiteFormData) => slaApi.createSite(data),
    onSuccess: () => {
      toast.success('Site berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error) => {
      toast.error('Gagal membuat site', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
};

/**
 * Hook for updating a site
 */
export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: SiteFormData | Partial<Site> }) =>
      slaApi.updateSite(id, data),
    onSuccess: (_, variables) => {
      // Check if this is an activate/deactivate action
      if (typeof variables.data === 'object' && variables.data !== null && 'isActive' in variables.data) {
        const isActive = variables.data.isActive;
        toast.success(isActive ? 'Site berhasil diaktifkan' : 'Site berhasil dinonaktifkan');
      } else {
        toast.success('Site berhasil diupdate');
      }
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error) => {
      toast.error('Gagal mengupdate site', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
};

/**
 * Hook for deleting a site
 */
export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hard }: { id: string | number; hard?: boolean }) => slaApi.deleteSite(id, hard),
    onSuccess: (_, variables) => {
      toast.success(variables.hard ? 'Site berhasil dihapus permanen' : 'Site berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus site', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
};

/**
 * Hook for fetching site statistics
 */
export const useSiteStatistics = () => {
  return useQuery({
    queryKey: ['sites', 'statistics'],
    queryFn: () => slaApi.getSiteStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

