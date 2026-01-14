/**
 * Monitoring Dashboard Page
 * Halaman utama untuk monitoring site down dan site up
 */

import { useState, useMemo } from 'react';
import { MonitoringSummary } from '../components/MonitoringSummary';
import { SiteDownTable } from '../components/SiteDownTable';
import { SiteUpTable } from '../components/SiteUpTable';
import { useSiteDown, useSiteUp, useSyncSiteDown, useSyncSiteUp, useSLAMasterForMerge } from '../hooks/useMonitoringQueries';
import { MonitoringFilters, SiteDownWithStatus } from '../types/monitoring.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export const MonitoringDashboard = () => {
  const { toast } = useToast();
  const useDummyData = false; // Menggunakan real API data
  
  const [siteDownFilters, setSiteDownFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 80, // Fetch 80 data untuk client-side pagination (5 per page)
  });
  const [siteUpFilters, setSiteUpFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 80, // Fetch 80 data untuk client-side pagination (5 per page)
  });

  // Sync mutations
  const syncSiteDown = useSyncSiteDown();
  const syncSiteUp = useSyncSiteUp();

  // Fetch SLA master data untuk merge dengan monitoring data
  // useSLAMasterForMerge sudah mengembalikan Map<string, any> langsung
  const { data: slaDataMap } = useSLAMasterForMerge();

  // Fetch site down data
  const {
    data: siteDownData,
    isLoading: isLoadingSiteDown,
    error: errorSiteDown,
    refetch: refetchSiteDown,
  } = useSiteDown(siteDownFilters, slaDataMap);

  // Fetch site up data
  const {
    data: siteUpData,
    isLoading: isLoadingSiteUp,
    error: errorSiteUp,
    refetch: refetchSiteUp,
  } = useSiteUp(siteUpFilters, slaDataMap);

  // Combine summary from both site-down and site-up responses
  const combinedSummary = useMemo(() => {
    const siteDownSummary = siteDownData?.summary;
    const siteUpSummary = siteUpData?.summary;
    
    if (!siteDownSummary && !siteUpSummary) {
      return undefined;
    }
    
    return {
      totalSites: siteDownSummary?.totalSites ?? siteUpSummary?.totalSites ?? 0,
      totalSitesDown: siteDownSummary?.totalSitesDown,
      totalSitesUp: siteUpSummary?.totalSitesUp,
      percentageSitesDown: siteDownSummary?.percentageSitesDown,
      percentageSitesUp: siteUpSummary?.percentageSitesUp,
    };
  }, [siteDownData?.summary, siteUpData?.summary]);

  // Handle sync button - POST to /sync then GET data
  const handleSync = async () => {
    try {
      // Step 1: POST to sync endpoints
      await Promise.all([
        syncSiteDown.mutateAsync(),
        syncSiteUp.mutateAsync(),
      ]);
      
      // Step 2: Refetch data after sync (GET endpoints)
      await Promise.all([
        refetchSiteDown(),
        refetchSiteUp(),
      ]);
      
      toast({
        title: 'Sync Berhasil',
        description: 'Data monitoring berhasil di-sync dari NMS Semeru',
      });
    } catch (error) {
      toast({
        title: 'Sync Gagal',
        description: 'Gagal melakukan sync data. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const handleSiteDownPageChange = (page: number) => {
    // Client-side pagination, tidak perlu update filter
    // Page change di-handle di component
  };

  const handleSiteDownSiteNameFilter = (siteName: string) => {
    setSiteDownFilters((prev) => ({
      ...prev,
      siteName: siteName || undefined,
      page: 1,
      limit: 80, // Fetch 80 data untuk client-side pagination
    }));
  };

  const handleSiteUpPageChange = (page: number) => {
    // Client-side pagination, tidak perlu update filter
    // Page change di-handle di component
  };

  const handleSiteUpSiteNameFilter = (siteName: string) => {
    setSiteUpFilters((prev) => ({
      ...prev,
      siteName: siteName || undefined,
      page: 1,
      limit: 80, // Fetch 80 data untuk client-side pagination
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
                      Monitoring status site down dan site up dari <b className='text-green-600'>NMS Semeru</b>
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
            {combinedSummary && (
              <section className="mb-6">
                <MonitoringSummary
                  summary={combinedSummary}
                  isLoading={isLoadingSiteDown || isLoadingSiteUp}
                />
              </section>
            )}

            {/* Tables: Site Down (Top) dan Site Up (Bottom) */}
            <section className="mb-6 space-y-6">
              {/* Site Down Section */}
                  <SiteDownTable
                    data={siteDownData?.data || []}
                    pagination={siteDownData?.pagination}
                    isLoading={isLoadingSiteDown && !useDummyData}
                    onPageChange={handleSiteDownPageChange}
                    onSiteIdFilter={handleSiteDownSiteNameFilter}
                  />

              {/* Site Up Section */}
                  <SiteUpTable
                    data={siteUpData?.data || []}
                    pagination={siteUpData?.pagination}
                    isLoading={isLoadingSiteUp && !useDummyData}
                    onPageChange={handleSiteUpPageChange}
                    onSiteIdFilter={handleSiteUpSiteNameFilter}
                  />
            </section>
          </>
        )}
    </div>
  );
};

