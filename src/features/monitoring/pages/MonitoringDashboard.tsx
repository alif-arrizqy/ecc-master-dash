/**
 * Monitoring Dashboard Page
 * Halaman utama untuk monitoring site down dan site up
 */

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonitoringSummary } from '../components/MonitoringSummary';
import { SiteDownTable } from '../components/SiteDownTable';
import { useSiteDown, useSiteUp } from '../hooks/useMonitoringQueries';
import { MonitoringFilters } from '../types/monitoring.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const MonitoringDashboard = () => {
  const [siteDownFilters, setSiteDownFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 20,
  });
  const [siteUpFilters, setSiteUpFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 20,
  });

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

  const handleSiteDownPageChange = (page: number) => {
    setSiteDownFilters((prev) => ({ ...prev, page }));
  };

  const handleSiteDownLimitChange = (limit: number) => {
    setSiteDownFilters((prev) => ({ ...prev, limit, page: 1 }));
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

  const handleSiteUpLimitChange = (limit: number) => {
    setSiteUpFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSiteUpSiteIdFilter = (siteId: string) => {
    setSiteUpFilters((prev) => ({
      ...prev,
      siteId: siteId || undefined,
      page: 1,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      <main className="w-full px-2 py-4 container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Site Monitoring</h1>
          <p className="text-muted-foreground">
            Monitoring status site down dan site up dari NMS Semeru
          </p>
        </div>

        {/* Summary Cards */}
        {siteDownData?.summary && (
          <div className="mb-6">
            <MonitoringSummary
              summary={siteDownData.summary}
              isLoading={isLoadingSiteDown}
            />
          </div>
        )}

        {/* Error Alert */}
        {(errorSiteDown || errorSiteUp) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorSiteDown
                ? 'Gagal memuat data site down. Silakan refresh halaman.'
                : 'Gagal memuat data site up. Silakan refresh halaman.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs untuk Site Down dan Site Up */}
        <Tabs defaultValue="site-down" className="space-y-4">
          <TabsList>
            <TabsTrigger value="site-down">Site Down</TabsTrigger>
            <TabsTrigger value="site-up">Site Up</TabsTrigger>
          </TabsList>

          <TabsContent value="site-down" className="space-y-4">
            <SiteDownTable
              data={siteDownData?.data || []}
              pagination={siteDownData?.pagination}
              isLoading={isLoadingSiteDown}
              onPageChange={handleSiteDownPageChange}
              onLimitChange={handleSiteDownLimitChange}
              onSiteIdFilter={handleSiteDownSiteIdFilter}
              onRefresh={() => refetchSiteDown()}
            />
          </TabsContent>

          <TabsContent value="site-up" className="space-y-4">
            {/* Site Up Table - bisa dibuat component terpisah nanti */}
            <div className="rounded-md border p-4">
              <p className="text-muted-foreground">
                Site Up table akan diimplementasikan di sini
              </p>
              {siteUpData && (
                <div className="mt-4">
                  <p>Total Sites Up: {siteUpData.summary.totalSitesUp}</p>
                  <p>Data: {JSON.stringify(siteUpData.data.slice(0, 3), null, 2)}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

