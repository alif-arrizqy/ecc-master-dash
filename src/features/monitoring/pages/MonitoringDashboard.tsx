/**
 * Monitoring Dashboard Page
 * Halaman utama untuk monitoring site down dan site up
 */

import { useState } from 'react';
import { MonitoringSummary } from '../components/MonitoringSummary';
import { SiteDownTable } from '../components/SiteDownTable';
import { SiteUpTable } from '../components/SiteUpTable';
import { useSiteDown, useSiteUp, useSyncSiteDown, useSyncSiteUp } from '../hooks/useMonitoringQueries';
import { MonitoringFilters, SiteDownWithStatus } from '../types/monitoring.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { dummySummary, dummySiteDownData, dummySiteUpData, dummyPagination, dummySiteUpPagination } from '../data/dummyData';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper function untuk transform dummy site down data
const transformDummySiteDown = (site: typeof dummySiteDownData[0]): SiteDownWithStatus => {
  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days} hari ${hours} jam`;
    } else if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    } else {
      return `${minutes} menit`;
    }
  };

  const getSiteDownStatus = (downSeconds: number): 'critical' | 'warning' | 'normal' => {
    const days = downSeconds / 86400;
    if (days > 30) return 'critical';
    if (days > 7) return 'warning';
    return 'normal';
  };

  const status = getSiteDownStatus(site.downSeconds);
  const downSinceDate = new Date(site.downSince);
  
  return {
    ...site,
    status,
    formattedDuration: formatDuration(site.downSeconds),
    formattedDownSince: formatDistanceToNow(downSinceDate, {
      addSuffix: true,
      locale: id,
    }),
  };
};

export const MonitoringDashboard = () => {
  const { toast } = useToast();
  const useDummyData = true; // Menggunakan dummy data untuk testing layout
  
  const [siteDownFilters, setSiteDownFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 5,
  });
  const [siteUpFilters, setSiteUpFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 5,
  });

  // Sync mutations
  const syncSiteDown = useSyncSiteDown();
  const syncSiteUp = useSyncSiteUp();

  // Fetch site down data
  const {
    data: siteDownData,
    isLoading: isLoadingSiteDown,
    error: errorSiteDown,
    refetch: refetchSiteDown,
  } = useSiteDown(siteDownFilters);

  // Fetch site up data
  const {
    data: siteUpData,
    isLoading: isLoadingSiteUp,
    error: errorSiteUp,
    refetch: refetchSiteUp,
  } = useSiteUp(siteUpFilters);

  // Use dummy data if enabled
  const finalSiteDownData = useDummyData ? {
    success: true,
    data: dummySiteDownData.map(transformDummySiteDown),
    pagination: dummyPagination,
    summary: dummySummary,
  } : siteDownData;

  const finalSiteUpData = useDummyData ? {
    success: true,
    data: dummySiteUpData,
    pagination: dummySiteUpPagination,
    summary: dummySummary,
  } : siteUpData;

  // Handle sync button
  const handleSync = async () => {
    try {
      await Promise.all([
        syncSiteDown.mutateAsync(),
        syncSiteUp.mutateAsync(),
      ]);
      
      toast({
        title: 'Sync Berhasil',
        description: 'Data monitoring berhasil di-sync dari NMS Semeru',
      });
      
      // Refetch data setelah sync
      refetchSiteDown();
      refetchSiteUp();
    } catch (error) {
      toast({
        title: 'Sync Gagal',
        description: 'Gagal melakukan sync data. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const handleSiteDownPageChange = (page: number) => {
    setSiteDownFilters((prev) => ({ ...prev, page }));
  };

  const handleSiteDownSiteIdFilter = (siteId: string) => {
    setSiteDownFilters((prev) => ({
      ...prev,
      siteId: siteId || undefined,
      page: 1,
    }));
  };

  const handleSiteUpPageChange = (page: number) => {
    setSiteUpFilters((prev) => ({ ...prev, page }));
  };

  const handleSiteUpSiteIdFilter = (siteId: string) => {
    setSiteUpFilters((prev) => ({
      ...prev,
      siteId: siteId || undefined,
      page: 1,
    }));
  };

  // Check if any critical data is loading
  const isLoading = isLoadingSiteDown || isLoadingSiteUp;
  const hasError = errorSiteDown || errorSiteUp;

  return (
    <div className="container mx-auto px-4 py-8">
        {hasError && !useDummyData && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Terjadi kesalahan saat memuat data. Silakan refresh halaman atau coba lagi nanti.
            </AlertDescription>
          </Alert>
        )}

        {isLoading && !useDummyData ? (
          <Loading text="Memuat data monitoring..." />
        ) : (
          <>
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Site Monitoring
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Monitoring status site down dan site up dari NMS Semeru
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncSiteDown.isPending || syncSiteUp.isPending}
                  onClick={handleSync}
                  className="group gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <RefreshCw 
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      (syncSiteDown.isPending || syncSiteUp.isPending) ? "animate-spin" : "group-hover:rotate-180"
                    )} 
                  />
                  Sync Data
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            {(finalSiteDownData?.summary || finalSiteUpData?.summary) && (
              <section className="mb-6">
                <MonitoringSummary
                  summary={finalSiteDownData?.summary || finalSiteUpData?.summary || dummySummary}
                  isLoading={isLoadingSiteDown || isLoadingSiteUp}
                />
              </section>
            )}

            {/* Tables: Site Down (Top) dan Site Up (Bottom) */}
            <section className="mb-6 space-y-6">
              {/* Site Down Section */}
                  <SiteDownTable
                    data={finalSiteDownData?.data || []}
                    pagination={finalSiteDownData?.pagination}
                    isLoading={isLoadingSiteDown && !useDummyData}
                    onPageChange={handleSiteDownPageChange}
                    onSiteIdFilter={handleSiteDownSiteIdFilter}
                  />

              {/* Site Up Section */}
                  <SiteUpTable
                    data={finalSiteUpData?.data || []}
                    pagination={finalSiteUpData?.pagination}
                    isLoading={isLoadingSiteUp && !useDummyData}
                    onPageChange={handleSiteUpPageChange}
                    onSiteIdFilter={handleSiteUpSiteIdFilter}
                  />
            </section>
          </>
        )}
    </div>
  );
};

