import Navbar from '@/components/layout/Navbar';
import SummaryTable from './dashboard/components/SummaryTable';
import DailySLAChart from './dashboard/components/DailySLAChart';
import CompactDailySLAChart from './dashboard/components/CompactDailySLAChart';
import SLACausesTable from './dashboard/components/SLACausesTable';
import GAMASHistoryCard from './dashboard/components/GAMASHistoryCard';
import ReportSection from './dashboard/components/ReportSection';
import PotensiSPSection from './dashboard/components/SlaBelow95';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  useDailySLAChartByBatteryVersion,
  useDailySLAChartAllSites,
  useWeeklySLAChartAllSites,
  useMonthlyReportSummary,
  useSLAReasons,
  useGAMASHistory,
  useSLAReportDetail,
} from '@/hooks/useSLAQueries';
import { getSLADateRange, getSLAMonthPeriod, getSLAMonthName, getSLAReportDateRange, getSLADashboardDateRange } from '@/lib/dateUtils';
import WeeklyTrendChart from './dashboard/components/WeeklyTrendChart';
import { SLAReportDetail } from '@/types/api';

const Index = () => {
  // Get date range for dashboard charts (daily charts, SLA reasons, weekly chart, GAMAS history)
  // Rules: tanggal 1 = bulan sebelumnya (full month), tanggal 2+ = bulan ini (full month)
  const dashboardDateRange = getSLADashboardDateRange();
  
  // Get SLA date range (mengikuti rules: tanggal 1 = bulan sebelumnya, tanggal 2+ = bulan ini)
  // Note: This is kept for backward compatibility but may not be used for dashboard charts
  const { startDate, endDate } = getSLADateRange();
  const currentPeriod = getSLAMonthPeriod();
  const currentMonthName = getSLAMonthName();

  // Fetch monthly summary
  const { 
    data: monthlySummary, 
    isLoading: isLoadingSummary,
    error: errorSummary 
  } = useMonthlyReportSummary(currentPeriod);

  // Fetch daily SLA charts (using dashboard date range)
  const { 
    data: dailySLAAllSite, 
    isLoading: isLoadingAllSites,
    error: errorAllSites 
  } = useDailySLAChartAllSites({ startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });

  const { 
    data: dailySLATalis5Full, 
    isLoading: isLoadingTalis5Full,
    error: errorTalis5Full 
  } = useDailySLAChartByBatteryVersion('talis5', { startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });

  const { 
    data: dailySLATalis5Mix, 
    isLoading: isLoadingTalis5Mix,
    error: errorTalis5Mix 
  } = useDailySLAChartByBatteryVersion('mix', { startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });

  const { 
    data: dailySLAJSPro, 
    isLoading: isLoadingJSPro,
    error: errorJSPro 
  } = useDailySLAChartByBatteryVersion('jspro', { startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });

  // Fetch SLA reasons (using dashboard date range)
  const { 
    data: slaReasonsTalis5, 
    isLoading: isLoadingReasonsTalis5 
  } = useSLAReasons('talis5', { startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });
  
  const { 
    data: slaReasonsMix, 
    isLoading: isLoadingReasonsMix 
  } = useSLAReasons('mix', { startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });
  
  const { 
    data: slaReasonsJSPro, 
    isLoading: isLoadingReasonsJSPro 
  } = useSLAReasons('jspro', { startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });

  // Fetch weekly SLA chart (using dashboard date range)
  const { 
    data: weeklyTrendData, 
    isLoading: isLoadingWeekly,
    error: errorWeekly 
  } = useWeeklySLAChartAllSites({ startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate });

  // Fetch GAMAS history (using dashboard date range)
  const { 
    data: gamasHistoryData, 
    isLoading: isLoadingGAMAS 
  } = useGAMASHistory({ startDate: dashboardDateRange.startDate, endDate: dashboardDateRange.endDate, limit: 5 });

  // Fetch detailed SLA report (menggunakan date range khusus untuk report)
  const reportDateRange = getSLAReportDateRange();
  const reportDetailQuery = useSLAReportDetail({ 
    startDate: reportDateRange.startDate, 
    endDate: reportDateRange.endDate 
  });
  const reportDetail = reportDetailQuery.data as SLAReportDetail | undefined;
  const isLoadingReport = reportDetailQuery.isLoading;

  // Extract slaBelow95 data from reportDetail (already included in daily report response)
  const slaBelow95Data = reportDetail?.slaBelow95;

  // Combine SLA reasons
  const slaCauses = [
    ...(slaReasonsTalis5?.length ? [{ batteryVersion: 'Talis5 Full', cause: slaReasonsTalis5.map(r => r.reason).join(', ') }] : []),
    ...(slaReasonsMix?.length ? [{ batteryVersion: 'Talis5 Mix', cause: slaReasonsMix.map(r => r.reason).join(', ') }] : []),
    ...(slaReasonsJSPro?.length ? [{ batteryVersion: 'JS PRO', cause: slaReasonsJSPro.map(r => r.reason).join(', ') }] : []),
  ];

  // Transform GAMAS history
  const gamasHistory = gamasHistoryData?.data?.map(item => ({
    date: item.date,
    description: item.description,
    affectedSites: 0, // API doesn't provide this, set to 0
  })) || [];

  // Check if any critical data is loading
  const isLoading = isLoadingSummary || isLoadingAllSites || isLoadingTalis5Full || isLoadingTalis5Mix || isLoadingJSPro;
  const hasError = errorSummary || errorAllSites || errorTalis5Full || errorTalis5Mix || errorJSPro;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="w-full px-2 py-4 container mx-auto">
        {hasError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Terjadi kesalahan saat memuat data. Silakan refresh halaman atau coba lagi nanti.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Loading text="Memuat data dashboard..." />
        ) : (
          <>
            {/* Main View - Summary + Daily Charts */}
            <section className="mb-6">
              <div className="grid grid-cols-12 gap-4">
                {/* Left Column - Summary Tables */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                  <SummaryTable data={monthlySummary} />
                  <SLACausesTable causes={slaCauses} />
                  <GAMASHistoryCard history={gamasHistory} />
                </div>
                
                {/* Right Column - Daily SLA Charts */}
                <div className="col-span-12 lg:col-span-9 space-y-3">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
                    Daily SLA AVG Bulan {currentMonthName}
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {isLoadingTalis5Full ? (
                      <Loading size="sm" />
                    ) : errorTalis5Full ? (
                      <Alert variant="destructive">
                        <AlertDescription>Gagal memuat data Talis5 Full</AlertDescription>
                      </Alert>
                    ) : (
                      <CompactDailySLAChart 
                        data={dailySLATalis5Full || []} 
                        title="Talis5 Full"
                        variant="talis5Full"
                      />
                    )}
                    
                    {isLoadingTalis5Mix ? (
                      <Loading size="sm" />
                    ) : errorTalis5Mix ? (
                      <Alert variant="destructive">
                        <AlertDescription>Gagal memuat data Talis5 Mix</AlertDescription>
                      </Alert>
                    ) : (
                      <CompactDailySLAChart 
                        data={dailySLATalis5Mix || []} 
                        title="Talis5 Mix"
                        variant="talis5Mix"
                      />
                    )}
                    
                    {isLoadingJSPro ? (
                      <Loading size="sm" />
                    ) : errorJSPro ? (
                      <Alert variant="destructive">
                        <AlertDescription>Gagal memuat data JS PRO</AlertDescription>
                      </Alert>
                    ) : (
                      <CompactDailySLAChart 
                        data={dailySLAJSPro || []} 
                        title="JS PRO"
                        variant="jsPro"
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
            
            {/* Bottom Section - All Site Chart + Weekly Trend */}
            <section className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isLoadingAllSites ? (
                  <Loading />
                ) : errorAllSites ? (
                  <Alert variant="destructive">
                    <AlertDescription>Gagal memuat data semua site</AlertDescription>
                  </Alert>
                ) : (
                  <DailySLAChart 
                    data={dailySLAAllSite || []} 
                    title={`SLA ${monthlySummary?.summary.totalSite || 0} Site Sundaya ${currentMonthName}`}
                    variant="default"
                  />
                )}
                {isLoadingWeekly ? (
                  <Loading />
                ) : errorWeekly ? (
                  <Alert variant="destructive">
                    <AlertDescription>Gagal memuat data trend mingguan</AlertDescription>
                  </Alert>
                ) : (
                  <WeeklyTrendChart data={weeklyTrendData || []} />
                )}
              </div>
            </section>
            
            {/* Report Section and Potensi SP Section */}
            <section className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Laporan Ringkas */}
                <div>
                  {isLoadingReport ? (
                    <Loading text="Memuat laporan detail..." />
                  ) : (
                    <ReportSection 
                      reportData={reportDetail}
                      gamasHistory={gamasHistory}
                    />
                  )}
                </div>
                
                {/* SLA Below 95.5% Section */}
                <div>
                  <PotensiSPSection
                    slaBelow95Data={slaBelow95Data}
                    isLoading={isLoadingReport}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-4 mt-8">
        <div className="w-full px-2 text-center">
          <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ECC Master Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
