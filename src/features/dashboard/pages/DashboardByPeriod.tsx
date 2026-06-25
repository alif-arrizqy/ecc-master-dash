import { useMemo, useState } from 'react';
import SummaryTable from '../components/dashboard/SummaryTable';
import DailySLAChart from '../components/dashboard/DailySLAChart';
import CompactDailySLAChart from '../components/dashboard/CompactDailySLAChart';
import MQTTSummaryCard from '../components/dashboard/MQTTSummaryCard';
import SLACausesTable from '../components/dashboard/SLACausesTable';
import GAMASHistoryCard from '../components/dashboard/GAMASHistoryCard';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useRefreshCache } from '@/shared/hooks/useRefreshCache';
import {
  useDailySLAChartByBatteryVersion,
  useDailySLAChartAllSites,
  useDailySLAChartTerrestrial,
  useWeeklySLAChartAllSites,
  useMonthlyReportSummary,
  useMonthlySummaryTerrestrial,
  useSLAReasons,
  useGAMASHistory,
} from '../hooks/useDashboardQueries';
import { getSLAMonthPeriod, getSLAMonthNameForPeriod, getMonthDateRange } from '@/shared/lib/dateUtils';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

function parseDefaultYearMonth(): { year: number; month: number } {
  const period = getSLAMonthPeriod();
  const [y, m] = period.split('-');
  const year = parseInt(y, 10);
  const month = parseInt(m, 10);
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year, month };
}

function buildYearOptions(): number[] {
  const current = new Date().getFullYear();
  const start = 2020;
  const years: number[] = [];
  for (let y = current; y >= start; y--) {
    years.push(y);
  }
  return years;
}

const DashboardByPeriod = () => {
  const refreshCache = useRefreshCache();
  const yearOptions = useMemo(() => buildYearOptions(), []);

  const [{ year, month }, setYearMonth] = useState(parseDefaultYearMonth);

  const period = `${year}-${String(month).padStart(2, '0')}`;
  const dashboardDateRange = useMemo(
    () => getMonthDateRange(year, month),
    [year, month],
  );
  const monthDisplayName = getSLAMonthNameForPeriod(period);

  const {
    data: monthlySummary,
    isLoading: isLoadingSummary,
    error: errorSummary,
  } = useMonthlyReportSummary(period);

  const {
    data: mqttSummary,
    isLoading: isLoadingMqttSummary,
  } = useMonthlySummaryTerrestrial(period);

  const {
    data: dailySLATerrestrial,
    isLoading: isLoadingTerrestrial,
    error: errorTerrestrial,
  } = useDailySLAChartTerrestrial({
    startDate: dashboardDateRange.startDate,
    endDate: dashboardDateRange.endDate,
  });

  const {
    data: dailySLAAllSite,
    isLoading: isLoadingAllSites,
    error: errorAllSites,
  } = useDailySLAChartAllSites({
    startDate: dashboardDateRange.startDate,
    endDate: dashboardDateRange.endDate,
  });

  const {
    data: dailySLATalis5Full,
    isLoading: isLoadingTalis5Full,
    error: errorTalis5Full,
  } = useDailySLAChartByBatteryVersion('talis5', {
    startDate: dashboardDateRange.startDate,
    endDate: dashboardDateRange.endDate,
  });

  const {
    data: dailySLATalis5Mix,
    isLoading: isLoadingTalis5Mix,
    error: errorTalis5Mix,
  } = useDailySLAChartByBatteryVersion('mix', {
    startDate: dashboardDateRange.startDate,
    endDate: dashboardDateRange.endDate,
  });

  const {
    data: dailySLAJSPro,
    isLoading: isLoadingJSPro,
    error: errorJSPro,
  } = useDailySLAChartByBatteryVersion('jspro', {
    startDate: dashboardDateRange.startDate,
    endDate: dashboardDateRange.endDate,
  });

  const { data: slaReasonsTalis5, isLoading: isLoadingReasonsTalis5 } =
    useSLAReasons('talis5', {
      startDate: dashboardDateRange.startDate,
      endDate: dashboardDateRange.endDate,
    });

  const { data: slaReasonsMix, isLoading: isLoadingReasonsMix } = useSLAReasons(
    'mix',
    {
      startDate: dashboardDateRange.startDate,
      endDate: dashboardDateRange.endDate,
    },
  );

  const { data: slaReasonsJSPro, isLoading: isLoadingReasonsJSPro } =
    useSLAReasons('jspro', {
      startDate: dashboardDateRange.startDate,
      endDate: dashboardDateRange.endDate,
    });

  const {
    data: weeklyTrendData,
    isLoading: isLoadingWeekly,
    error: errorWeekly,
  } = useWeeklySLAChartAllSites({
    startDate: dashboardDateRange.startDate,
    endDate: dashboardDateRange.endDate,
  });

  const { data: gamasHistoryData, isLoading: isLoadingGAMAS } = useGAMASHistory(
    {
      startDate: dashboardDateRange.startDate,
      endDate: dashboardDateRange.endDate,
      limit: 5,
    },
  );

  const slaCauses = [
    ...(slaReasonsTalis5?.length
      ? [
          {
            batteryVersion: 'Talis5 Full',
            cause: slaReasonsTalis5.map((r) => r.reason).join(', '),
          },
        ]
      : []),
    ...(slaReasonsMix?.length
      ? [
          {
            batteryVersion: 'Talis5 Mix',
            cause: slaReasonsMix.map((r) => r.reason).join(', '),
          },
        ]
      : []),
    ...(slaReasonsJSPro?.length
      ? [
          {
            batteryVersion: 'JS PRO',
            cause: slaReasonsJSPro.map((r) => r.reason).join(', '),
          },
        ]
      : []),
  ];

  const gamasHistory =
    gamasHistoryData?.data?.map((item) => ({
      date: item.date,
      description: item.description,
    })) || [];

  const isLoading =
    isLoadingSummary ||
    isLoadingAllSites ||
    isLoadingTalis5Full ||
    isLoadingTalis5Mix ||
    isLoadingJSPro;
  const hasError =
    errorSummary ||
    errorAllSites ||
    errorTalis5Full ||
    errorTalis5Mix ||
    errorJSPro;

  const reasonsLoading =
    isLoadingReasonsTalis5 || isLoadingReasonsMix || isLoadingReasonsJSPro;

  return (
    <div className="w-full px-2 py-4 container mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Dashboard per periode
          </h1>
          <p className="text-sm text-muted-foreground">
            Pilih bulan dan tahun; grafik dan ringkasan mengikuti periode yang
            dipilih (tanpa bagian Report Daily dan SLA Below 95).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid w-[140px] gap-2">
            <Label htmlFor="dash-period-year">Tahun</Label>
            <Select
              value={String(year)}
              onValueChange={(v) =>
                setYearMonth((prev) => ({ ...prev, year: Number(v) }))
              }
            >
              <SelectTrigger id="dash-period-year">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-[160px] gap-2">
            <Label htmlFor="dash-period-month">Bulan</Label>
            <Select
              value={String(month)}
              onValueChange={(v) =>
                setYearMonth((prev) => ({ ...prev, month: Number(v) }))
              }
            >
              <SelectTrigger id="dash-period-month">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Terjadi kesalahan saat memuat data. Silakan refresh halaman atau coba
            lagi nanti.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Loading text="Memuat data dashboard..." />
      ) : (
        <>
          <section className="mb-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 space-y-4 lg:col-span-3">
                <SummaryTable data={monthlySummary} />
                <MQTTSummaryCard
                  totalSites={mqttSummary?.totalSites ?? 0}
                  avgSla={mqttSummary?.avgSla ?? 0}
                  slaStatus={mqttSummary?.slaStatus ?? ''}
                  isLoading={isLoadingMqttSummary}
                />
                {reasonsLoading ? (
                  <Loading size="sm" text="Memuat penyebab SLA..." />
                ) : (
                  <SLACausesTable causes={slaCauses} />
                )}
                {isLoadingGAMAS ? (
                  <Loading size="sm" text="Memuat history GAMAS..." />
                ) : (
                  <GAMASHistoryCard history={gamasHistory} />
                )}
              </div>

              <div className="col-span-12 space-y-3 lg:col-span-9">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Daily SLA AVG {monthDisplayName}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={refreshCache.isPending}
                    onClick={() => {
                      refreshCache.mutate({
                        startDate: dashboardDateRange.startDate,
                        endDate: dashboardDateRange.endDate,
                      });
                    }}
                    className="group gap-2 border-primary/50 text-primary transition-all duration-200 hover:scale-105 hover:border-primary hover:bg-primary/10 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <RefreshCw
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        refreshCache.isPending
                          ? 'animate-spin'
                          : 'group-hover:rotate-180',
                      )}
                    />
                    Refresh Data
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {isLoadingTalis5Full ? (
                    <Loading size="sm" />
                  ) : errorTalis5Full ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Gagal memuat data Talis5 Full
                      </AlertDescription>
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
                      <AlertDescription>
                        Gagal memuat data Talis5 Mix
                      </AlertDescription>
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

                  {isLoadingTerrestrial ? (
                    <Loading size="sm" />
                  ) : errorTerrestrial ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Gagal memuat data Terestrial/MQTT
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <CompactDailySLAChart
                      data={dailySLATerrestrial || []}
                      title="Terestrial / MQTT"
                      variant="default"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {isLoadingAllSites ? (
                <Loading />
              ) : errorAllSites ? (
                <Alert variant="destructive">
                  <AlertDescription>Gagal memuat data semua site</AlertDescription>
                </Alert>
              ) : (
                <DailySLAChart
                  data={dailySLAAllSite || []}
                  title={`SLA ${monthlySummary?.summary.totalSite || 0} SITE SUNDAYA GABUNGAN SLA MQTT ${monthDisplayName.toUpperCase()}`}
                  variant="default"
                />
              )}
              {isLoadingWeekly ? (
                <Loading />
              ) : errorWeekly ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Gagal memuat data trend mingguan
                  </AlertDescription>
                </Alert>
              ) : (
                <WeeklyTrendChart data={weeklyTrendData || []} />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardByPeriod;
