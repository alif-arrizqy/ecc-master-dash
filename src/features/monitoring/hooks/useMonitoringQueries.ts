/**
 * React Query hooks untuk Monitoring Module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../services/monitoring.api';
import { slaApi } from '@/features/sla/services/sla.api';
import { MonitoringFilters, SiteDownWithStatus } from '../types/monitoring.types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getCurrentMonthStartDate, getCurrentMonthEndDate } from '../utils/dateUtils';

/**
 * Format duration dari seconds ke readable format
 * Hanya menampilkan hari (Hari)
 */
const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  
  // Jika kurang dari 1 hari, tampilkan 0 hari
  if (days < 1) {
    return '0 hari';
  }
  
  return `${days} hari`;
};

/**
 * Tentukan status berdasarkan durasi down
 */
const getSiteDownStatus = (downSeconds: number): 'critical' | 'warning' | 'normal' => {
  const days = downSeconds / 86400;
  if (days > 30) return 'critical';
  if (days > 7) return 'warning';
  return 'normal';
};

/**
 * Helper function untuk mendapatkan status SLA dari nilai SLA
 */
const getSLAStatus = (slaAvg: number | undefined): 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad' | undefined => {
  if (slaAvg === undefined || slaAvg === null) return undefined;
  if (slaAvg >= 99.5) return 'Meet SLA';
  if (slaAvg >= 95.5) return 'Fair';
  if (slaAvg >= 90) return 'Bad';
  return 'Very Bad';
};

/**
 * Transform site down data dengan status dan formatted fields
 * Response API: id, siteId, siteName, downSince, downSeconds, createdAt, updatedAt
 * Merge dengan SLA data untuk mendapatkan slaAvg, statusSLA, statusSP, problem
 * 
 * Logic merge:
 * 1. Ambil data dari monitoring/site-down (sudah ada)
 * 2. Cari data SLA berdasarkan site_id dari endpoint /sla-bakti/master
 * 3. Ambil slaAvg, statusSLA, problem dari SLA data
 * 4. Merge dan return
 * 
 * PERHITUNGAN DURATION:
 * Duration dihitung REAL-TIME dari downSince (kapan site mulai down) sampai waktu sekarang.
 * Rumus: duration = waktu sekarang - downSince (dalam detik)
 * 
 * Contoh:
 * - downSince: 2025-01-01 10:00:00
 * - waktu sekarang: 2025-01-03 14:30:00
 * - duration = (2025-01-03 14:30:00) - (2025-01-01 10:00:00) = 2 hari 4 jam 30 menit
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformSiteDown = (site: any, slaDataMap?: Map<string, any>): SiteDownWithStatus => {
  const downSinceDate = new Date(site.downSince);
  const now = new Date();
  
  // Hitung duration REAL-TIME: waktu sekarang - downSince (dalam detik)
  const durationInSeconds = Math.floor((now.getTime() - downSinceDate.getTime()) / 1000);
  
  // Gunakan duration yang dihitung real-time untuk status
  const status = getSiteDownStatus(durationInSeconds);
  
  // Get SLA data for this site berdasarkan site_id
  const slaData = slaDataMap?.get(site.siteId);
  
  // Ambil slaAvg dari siteSla.slaAverage
  const slaAvg = slaData?.siteSla?.slaAverage;
  
  // Hitung statusSLA dari slaAvg
  const statusSLA = getSLAStatus(slaAvg);
  
  // Ambil statusSP dari siteSla.statusSP
  const statusSP = slaData?.siteSla?.statusSP as 'Potensi SP' | 'Clear SP' | undefined;
  
  // Ambil problem dari field problem (bisa array atau object)
  let problem: string[] | undefined;
  if (slaData?.problem) {
    if (Array.isArray(slaData.problem)) {
      // Jika array, convert ke string array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      problem = slaData.problem.map((p: any) => {
        if (typeof p === 'string') return p;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((p as any)?.problem) return (p as any).problem;
        return String(p);
      }).filter(Boolean);
    } else if (typeof slaData.problem === 'string') {
      problem = [slaData.problem];
    }
  }
  
  return {
    ...site,
    status,
    // Duration dihitung REAL-TIME dari downSince sampai sekarang
    formattedDuration: formatDuration(durationInSeconds),
    formattedDownSince: formatDistanceToNow(downSinceDate, {
      addSuffix: true,
      locale: id,
    }),
    // Update downSeconds dengan nilai yang dihitung real-time
    downSeconds: durationInSeconds,
    // Merge SLA data: slaAvg, statusSLA, statusSP, problem
    slaAvg,
    statusSLA,
    statusSP,
    problem,
  };
};

/**
 * Transform site up data dengan merge SLA data
 * 
 * Logic merge:
 * 1. Ambil data dari monitoring/site-up (sudah ada)
 * 2. Cari data SLA berdasarkan site_id dari endpoint /sla-bakti/master
 * 3. Ambil slaAvg, statusSLA, problem dari SLA data
 * 4. Merge dan return
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformSiteUp = (site: any, slaDataMap?: Map<string, any>): any => {
  // Get SLA data for this site berdasarkan site_id
  const slaData = slaDataMap?.get(site.siteId);
  
  // Ambil slaAvg dari siteSla.slaAverage
  const slaAvg = slaData?.siteSla?.slaAverage;
  
  // Hitung statusSLA dari slaAvg
  const statusSLA = getSLAStatus(slaAvg);
  
  // Ambil problem dari field problem (bisa array atau object)
  let problem: string[] | undefined;
  if (slaData?.problem) {
    if (Array.isArray(slaData.problem)) {
      // Jika array, convert ke string array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      problem = slaData.problem.map((p: any) => {
        if (typeof p === 'string') return p;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((p as any)?.problem) return (p as any).problem;
        return String(p);
      }).filter(Boolean);
    } else if (typeof slaData.problem === 'string') {
      problem = [slaData.problem];
    }
  }
  
  return {
    ...site,
    // Merge SLA data: slaAvg, statusSLA, problem
    slaAvg,
    statusSLA,
    problem,
  };
};

/**
 * Fetch semua SLA master data dengan pagination
 * Mengambil semua pages untuk mendapatkan semua sites
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchAllSLAMasterData = async (startDate: string, endDate: string): Promise<Map<string, any>> => {
  const slaDataMap = new Map<string, any>();
  let currentPage = 1;
  let hasMorePages = true;
  const limit = 100; // Fetch 100 per page untuk efisiensi

  while (hasMorePages) {
    try {
      const result = await slaApi.getSLAMasterData({
        startDate,
        endDate,
        page: currentPage,
        limit,
      });

      if (result?.data?.sites && result.data.sites.length > 0) {
        // Map semua sites berdasarkan site_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.data.sites.forEach((site: any) => {
          // Coba berbagai kemungkinan field untuk site_id
          const siteId = site.siteId || site.site_id || site.name || site.site_name;
          if (siteId) {
            slaDataMap.set(siteId, site);
          }
        });

        // Check if there are more pages
        const totalPages = result.pagination?.totalPages || 1;
        hasMorePages = currentPage < totalPages;
        currentPage++;
      } else {
        hasMorePages = false;
      }
    } catch (error) {
      console.error('Error fetching SLA master data:', error);
      hasMorePages = false;
    }
  }

  return slaDataMap;
};

/**
 * Hook untuk fetch SLA master data untuk merge dengan monitoring data
 * Fetch semua data dengan pagination untuk mendapatkan semua sites
 */
export const useSLAMasterForMerge = () => {
  const startDate = getCurrentMonthStartDate();
  const endDate = getCurrentMonthEndDate();
  
  return useQuery({
    queryKey: ['monitoring', 'sla-master-merge', { startDate, endDate }],
    queryFn: async () => {
      // Fetch all SLA data dengan pagination
      const slaDataMap = await fetchAllSLAMasterData(startDate, endDate);
      return slaDataMap;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid unnecessary requests
  });
};

/**
 * Hook untuk fetch site down data dengan merge SLA data
 * 
 * Logic:
 * 1. Fetch data dari endpoint monitoring/site-down
 * 2. Merge dengan data dari endpoint /sla-bakti/master berdasarkan site_id
 * 3. Ambil slaAvg, statusSLA, statusSP, problem dari SLA data
 * 4. Return merged data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSiteDown = (filters?: MonitoringFilters, slaDataMap?: Map<string, any>) => {
  return useQuery({
    queryKey: ['monitoring', 'site-down', filters, slaDataMap?.size],
    queryFn: async () => {
      // 1. Fetch data dari endpoint monitoring/site-down
      const response = await monitoringApi.getSiteDown(filters);
      
      // 2. Merge dengan data dari endpoint /sla-bakti/master berdasarkan site_id
      // 3. Ambil slaAvg, statusSLA, statusSP, problem dari SLA data
      // 4. Return merged data
      return {
        ...response,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: response.data.map((site: any) => transformSiteDown(site, slaDataMap)),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchInterval: 5 * 60 * 1000, // Auto-refresh setiap 5 menit
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook untuk fetch site up data dengan merge SLA data
 * 
 * Logic:
 * 1. Fetch data dari endpoint monitoring/site-up
 * 2. Merge dengan data dari endpoint /sla-bakti/master berdasarkan site_id
 * 3. Ambil slaAvg, statusSLA, problem dari SLA data
 * 4. Return merged data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSiteUp = (filters?: MonitoringFilters, slaDataMap?: Map<string, any>) => {
  return useQuery({
    queryKey: ['monitoring', 'site-up', filters, slaDataMap?.size],
    queryFn: async () => {
      // 1. Fetch data dari endpoint monitoring/site-up
      const response = await monitoringApi.getSiteUp(filters);
      
      // 2. Merge dengan data dari endpoint /sla-bakti/master berdasarkan site_id
      // 3. Ambil slaAvg, statusSLA, problem dari SLA data
      // 4. Return merged data
      return {
        ...response,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: response.data.map((site: any) => transformSiteUp(site, slaDataMap)),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchInterval: 5 * 60 * 1000, // Auto-refresh setiap 5 menit
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook untuk fetch site down by siteId
 */
export const useSiteDownBySiteId = (siteId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'site-down', siteId],
    queryFn: () => monitoringApi.getSiteDownBySiteId(siteId),
    enabled: !!siteId,
  });
};

/**
 * Hook untuk fetch site up by siteId
 */
export const useSiteUpBySiteId = (siteId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'site-up', siteId],
    queryFn: () => monitoringApi.getSiteUpBySiteId(siteId),
    enabled: !!siteId,
  });
};

/**
 * Hook untuk sync site down dari NMS
 */
export const useSyncSiteDown = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => monitoringApi.syncSiteDown(),
    onSuccess: () => {
      // Invalidate dan refetch site down queries
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'site-down'] });
    },
  });
};

/**
 * Hook untuk sync site up dari NMS
 */
export const useSyncSiteUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => monitoringApi.syncSiteUp(),
    onSuccess: () => {
      // Invalidate dan refetch site up queries
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'site-up'] });
    },
  });
};

/**
 * Hook untuk fetch SLA master data
 * GET /api/v1/sla-bakti/master
 * Rules:
 * - page: sesuai halaman yang diinginkan
 * - limit: 5
 * - startDate: tanggal 1 tiap bulan (default: current month start)
 * - endDate: akhir tanggal bulan tersebut (default: current month end)
 */
export const useSLAMaster = (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  batteryVersion?: string;
  province?: string;
  statusSP?: string;
  statusSLA?: string;
  pic?: string;
  siteName?: string;
  slaMin?: number;
  slaMax?: number;
}) => {
  const startDate = params?.startDate || getCurrentMonthStartDate();
  const endDate = params?.endDate || getCurrentMonthEndDate();
  const page = params?.page || 1;
  const limit = params?.limit || 5; // Default limit: 5

  return useQuery({
    queryKey: ['monitoring', 'sla-master', { startDate, endDate, page, limit, ...params }],
    queryFn: () => slaApi.getSLAMasterData({
      startDate,
      endDate,
      page,
      limit,
      batteryVersion: params?.batteryVersion,
      province: params?.province,
      statusSP: params?.statusSP,
      statusSLA: params?.statusSLA,
      pic: params?.pic,
      siteName: params?.siteName,
      slaMin: params?.slaMin,
      slaMax: params?.slaMax,
    }),
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchInterval: 5 * 60 * 1000, // Auto-refresh setiap 5 menit
    refetchOnWindowFocus: true,
  });
};

