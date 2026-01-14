/**
 * Site Down Page
 * Halaman khusus untuk monitoring site down
 */

import { useState } from 'react';
import { MonitoringSummary } from '../components/MonitoringSummary';
import { SiteDownTable } from '../components/SiteDownTable';
import { useSiteDown } from '../hooks/useMonitoringQueries';
import { MonitoringFilters } from '../types/monitoring.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const SiteDownPage = () => {
  const [filters, setFilters] = useState<MonitoringFilters>({
    page: 1,
    limit: 20,
  });

  const {
    data: siteDownData,
    isLoading,
    error,
    refetch,
  } = useSiteDown(filters);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSiteIdFilter = (siteId: string) => {
    setFilters((prev) => ({
      ...prev,
      siteId: siteId || undefined,
      page: 1,
    }));
  };

  return (
    <div className="w-full px-2 py-4 container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Site Down Monitoring</h1>
          <p className="text-muted-foreground">
            Daftar site yang sedang down beserta durasi downtime
          </p>
        </div>

        {/* Summary Cards */}
        {siteDownData?.summary && (
          <div className="mb-6">
            <MonitoringSummary
              summary={siteDownData.summary}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gagal memuat data site down. Silakan refresh halaman.
            </AlertDescription>
          </Alert>
        )}

        {/* Site Down Table */}
        <SiteDownTable
          data={siteDownData?.data || []}
          pagination={siteDownData?.pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSiteIdFilter={handleSiteIdFilter}
          onRefresh={() => refetch()}
        />
      </main>
    </div>
  );
};

