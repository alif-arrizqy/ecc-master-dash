import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, X, Eye, Calendar, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { picTypes, Site, Problem } from '@/shared/data/mockData';
import { cn } from '@/shared/lib/utils';
import { getSLADateRange } from '@/shared/lib/dateUtils';
import { format } from 'date-fns';
import { slaApi } from '../../services/sla.api';
import SiteDetailModal from './SiteDetailModal';

const ITEMS_PER_PAGE = 20;

type SortField = 'siteName' | 'province' | 'batteryVersion' | 'slaAvg' | 'slaStatus' | 'status' | 'pic';

type SLAStatus = 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad';

const PROVINCES = ['Maluku', 'Papua'];

interface APISite {
  siteId?: string;
  siteName?: string;
  name?: string;
  site_name?: string;
  province?: string;
  batteryVersion?: string;
  battery_version?: string;
  siteSla?: {
    slaAverage: number;
    slaUnit: string;
    slaStatus: string;
    dailySla: Array<{
      date: string;
      sla: number;
      slaUnit: string;
      slaStatus: string;
    }>;
    statusSP: string;
  };
  slaAvg?: number;
  sla_avg?: number;
  status?: string;
  problem?: unknown[];
  [key: string]: unknown;
}

const SLADataTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [batteryFilter, setBatteryFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [statusSPFilter, setStatusSPFilter] = useState<string>('all');
  const [statusSLAFilter, setStatusSLAFilter] = useState<string>('all');
  const [picFilter, setPicFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [slaMin, setSlaMin] = useState<number | undefined>(undefined);
  const [slaMax, setSlaMax] = useState<number | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField>('siteName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<{
    sites: APISite[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | null>(null);
  const [searchDebounce, setSearchDebounce] = useState('');
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);

  // Helper functions for SLA status
  const getSLAStatus = (sla: number): SLAStatus => {
    if (sla >= 95.5) return 'Meet SLA';
    if (sla >= 90) return 'Fair';
    if (sla >= 80) return 'Bad';
    return 'Very Bad';
  };

  const getSLAColor = (sla: number) => {
    if (sla >= 95.5) return 'text-status-good';
    if (sla >= 70) return 'text-status-warning';
    return 'text-status-danger';
  };

  const getSLABgColor = (sla: number) => {
    if (sla >= 95.5) return '';
    if (sla >= 90) return 'bg-status-warning/5';
    if (sla >= 80) return 'bg-orange-50 dark:bg-orange-950/20';
    return 'bg-status-danger/5';
  };

  const getSLAStatusColor = (status: SLAStatus) => {
    switch (status) {
      case 'Meet SLA':
        return 'bg-status-good/10 text-status-good';
      case 'Fair':
        return 'bg-status-warning/10 text-status-warning';
      case 'Bad':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Very Bad':
        return 'bg-status-danger/10 text-status-danger';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPicColor = (pic: string) => {
    switch (pic) {
      case 'VSAT':
        return 'bg-status-warning/10 text-status-warning';
      case 'SNMP':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'POWER':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Other':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Format problem description with truncation
  const formatProblemDescription = (problems: unknown[]): string => {
    if (!problems || problems.length === 0) return '-';
    const problemsArray = problems as Array<{ problem?: string }>;
    const firstProblem = problemsArray[0]?.problem || '-';
    const MAX_LENGTH = 50;
    return firstProblem.length > MAX_LENGTH 
      ? firstProblem.substring(0, MAX_LENGTH) + '...' 
      : firstProblem;
  };

    const getUniquePics = (problems: unknown[]): string[] => {
    if (!problems || problems.length === 0) return [];
    const problemsArray = problems as Array<{ pic?: string }>;
    return problemsArray
      .map(p => p.pic || 'Unknown')
      .filter((p, i, arr) => arr.indexOf(p) === i);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate date range
        const defaultDateRange = getSLADateRange();
        const startDate = dateRange.from 
          ? format(dateRange.from, 'yyyy-MM-dd')
          : defaultDateRange.startDate;
        const endDate = dateRange.to
          ? format(dateRange.to, 'yyyy-MM-dd')
          : defaultDateRange.endDate;

        // Map battery version filter to API format
        let batteryVersion: string | undefined;
        if (batteryFilter !== 'all') {
          // Map display names to API format
          const batteryVersionMap: Record<string, string> = {
            'Talis5 Full': 'talis5',
            'Talis5 Mix': 'mix',
            'JS PRO': 'jspro',
          };
          batteryVersion = batteryVersionMap[batteryFilter] || batteryFilter;
        }

        // Map status SP filter
        let statusSP: string | undefined;
        if (statusSPFilter !== 'all') {
          statusSP = statusSPFilter;
        }

        // Map status SLA filter
        let statusSLA: string | undefined;
        if (statusSLAFilter !== 'all') {
          // Map display names to API values
          const statusSLAMap: Record<string, string> = {
            'Meet SLA': 'good',
            'Fair': 'warning',
            'Bad': 'bad',
            'Very Bad': 'very_bad',
          };
          statusSLA = statusSLAMap[statusSLAFilter] || statusSLAFilter;
        }

        const result = await slaApi.getSLAMasterData({
          startDate,
          endDate,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          batteryVersion,
          province: provinceFilter !== 'all' ? provinceFilter : undefined,
          statusSP,
          statusSLA,
          pic: picFilter !== 'all' ? picFilter : undefined,
          siteName: searchDebounce || undefined,
          slaMin: slaMin !== undefined ? slaMin : undefined,
          slaMax: slaMax !== undefined ? slaMax : undefined,
        });

        setApiData({
          sites: result.data.sites || [],
          pagination: result.pagination || {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            total: 0,
            totalPages: 0,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching SLA data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, batteryFilter, provinceFilter, statusSPFilter, statusSLAFilter, picFilter, searchDebounce, dateRange.from, dateRange.to, slaMin, slaMax]);

  // Map API sites to component format
  const mappedSites = useMemo(() => {
    if (!apiData) return [];

    return apiData.sites.map((site): Site & { pic: string; problems: unknown[]; slaStatus: SLAStatus } => {
      const siteName = site.siteName || site.name || site.site_name || 'Unknown';
      const province = site.province || 'Unknown';

      const apiBatteryVersion = (site.batteryVersion || site.battery_version || '').toLowerCase();
      const batteryVersionMap: Record<string, 'Talis5 Full' | 'Talis5 Mix' | 'JS PRO'> = {
        'talis5': 'Talis5 Full',
        'mix': 'Talis5 Mix',
        'jspro': 'JS PRO',
        'js pro': 'JS PRO',
      };
      const batteryVersion = batteryVersionMap[apiBatteryVersion] || 'Talis5 Full';

      const slaAvg = site.siteSla?.slaAverage || site.slaAvg || site.sla_avg || 0;
      const status = (site.siteSla?.statusSP || site.status || 'Clear SP') as 'Potensi SP' | 'Clear SP';
      const problems = site.problem || [];
      const slaStatus = getSLAStatus(slaAvg);
      const picLabels = getUniquePics(problems);
      const pic = picLabels.length > 0 ? picLabels.join(', ') : '-';

      const dailySla = site.siteSla?.dailySla?.map((day, index) => ({
        day: index + 1,
        sla: day.sla,
      })) || [];

      return {
        id: site.siteId || siteName,
        siteName,
        province,
        batteryVersion,
        installDate: (site.talisInstalled as string) || new Date().toISOString(),
        slaAvg,
        status,
        dailySla,
        pic,
        problems,
        slaStatus,
      };
    });
  }, [apiData]);

  // Client-side filtering and sorting (since API might not support all sort fields)
  const sortedData = useMemo(() => {
    let data = [...mappedSites];
    
    // Client-side filtering for Status SLA (as fallback if API doesn't support it)
    if (statusSLAFilter !== 'all') {
      const filterStatus = statusSLAFilter as SLAStatus;
      data = data.filter(site => site.slaStatus === filterStatus);
    }
    
    data.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortField === 'pic') {
        aVal = a.pic;
        bVal = b.pic;
      } else if (sortField === 'slaStatus') {
        // Sort by SLA status priority: Meet SLA > Fair > Bad > Very Bad
        const statusPriority: Record<SLAStatus, number> = {
          'Meet SLA': 4,
          'Fair': 3,
          'Bad': 2,
          'Very Bad': 1,
        };
        aVal = statusPriority[a.slaStatus] || 0;
        bVal = statusPriority[b.slaStatus] || 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return data;
  }, [mappedSites, sortField, sortDirection, statusSLAFilter]);

  const totalPages = apiData?.pagination?.totalPages || 0;
  const paginatedData = sortedData;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBatteryFilter('all');
    setProvinceFilter('all');
    setStatusSPFilter('all');
    setStatusSLAFilter('all');
    setPicFilter('all');
    setDateRange({});
    setSlaMin(undefined);
    setSlaMax(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || batteryFilter !== 'all' || provinceFilter !== 'all' || statusSPFilter !== 'all' || statusSLAFilter !== 'all' || picFilter !== 'all' || dateRange.from || dateRange.to || slaMin !== undefined || slaMax !== undefined;

  // Capture table as PNG: kolom Action dihilangkan, ukuran fit tabel, rapi & jelas
  const captureTable = async () => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper || !tableRef.current) return;
    try {
      const html2canvasModule = await import('html2canvas');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvas = (html2canvasModule as any).default ?? (html2canvasModule as any);

      const scale = 2; // agar teks jelas, tidak terlalu kecil
      const canvas = await html2canvas(wrapper, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        onclone: (_clonedDoc, clonedElement) => {
          clonedElement.style.overflow = 'visible';
          clonedElement.style.width = 'auto';
          clonedElement.style.padding = '12px';
          const clonedTable = clonedElement.querySelector('table');
          if (!clonedTable) return;
          const tbl = clonedTable as HTMLElement;
          tbl.style.borderCollapse = 'collapse';
          tbl.style.fontSize = '13px';
          const lastTh = clonedTable.querySelector('thead tr')?.lastElementChild as HTMLElement | null;
          if (lastTh) lastTh.style.display = 'none';
          clonedTable.querySelectorAll('tbody tr').forEach((tr) => {
            const lastTd = tr.lastElementChild as HTMLElement | null;
            if (lastTd) lastTd.style.display = 'none';
          });
          clonedTable.querySelectorAll('th, td').forEach((cell) => {
            const el = cell as HTMLElement;
            el.style.padding = '6px 10px';
          });
        },
      });

      if (!canvas) return;
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sla-table-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to capture table:', err);
    }
  };

  const columns: { key: SortField; label: string }[] = [
    { key: 'siteName', label: 'Site Name' },
    { key: 'province', label: 'Province' },
    { key: 'batteryVersion', label: 'Battery Version' },
    { key: 'slaAvg', label: 'SLA AVG' },
    { key: 'status', label: 'Status SP' },
    { key: 'pic', label: 'PIC' },
  ];

  return (
    <>
      <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Data SLA Site</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={captureTable}
                className="flex items-center gap-2 bg-primary text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                title="Capture table as PNG"
                aria-label="Capture table as PNG"
              >
                <Camera className="h-4 w-4" />
                Capture Table
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari site..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-9"
              />
            </div>

            {/* Battery Filter */}
            <Select value={batteryFilter} onValueChange={(val) => {
              setBatteryFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Battery Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Battery</SelectItem>
                <SelectItem value="Talis5 Full">Talis5 Full</SelectItem>
                <SelectItem value="Talis5 Mix">Talis5 Mix</SelectItem>
                <SelectItem value="JS PRO">JS PRO</SelectItem>
              </SelectContent>
            </Select>

            {/* Province Filter */}
            <Select value={provinceFilter} onValueChange={(val) => {
              setProvinceFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Provinsi</SelectItem>
                {PROVINCES.map(prov => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status SP Filter */}
            <Select value={statusSPFilter} onValueChange={(val) => {
              setStatusSPFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status SP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status SP</SelectItem>
                <SelectItem value="Potensi SP">Potensi SP</SelectItem>
                <SelectItem value="Clear SP">Clear SP</SelectItem>
              </SelectContent>
            </Select>

            {/* Status SLA Filter */}
            <Select value={statusSLAFilter} onValueChange={(val) => {
              setStatusSLAFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status SLA</SelectItem>
                <SelectItem value="Meet SLA">Meet SLA (≥95.5%)</SelectItem>
                <SelectItem value="Fair">Fair (90-95.5%)</SelectItem>
                <SelectItem value="Bad">Bad (80-90%)</SelectItem>
                <SelectItem value="Very Bad">Very Bad (&lt;80%)</SelectItem>
              </SelectContent>
            </Select>

            {/* PIC Filter */}
            <Select value={picFilter} onValueChange={(val) => {
              setPicFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua PIC</SelectItem>
                {picTypes.map(pic => (
                  <SelectItem key={pic} value={pic}>{pic}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <span className="text-xs">
                        {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                      </span>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span className="text-muted-foreground">Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    setDateRange({ from: range?.from, to: range?.to });
                    setCurrentPage(1);
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

          </div>

          {/* Quick Filter: SLA < 95% */}
          <div className="flex items-center gap-2">
            <Button
              variant={slaMin === 0 && slaMax === 95 ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (slaMin === 0 && slaMax === 95) {
                  setSlaMin(undefined);
                  setSlaMax(undefined);
                } else {
                  setSlaMin(0);
                  setSlaMax(95);
                }
                setCurrentPage(1);
              }}
            >
              SLA &lt; 95%
            </Button>
            {(slaMin !== undefined || slaMax !== undefined) && (
              <span className="text-sm text-muted-foreground">
                Filter: {slaMin !== undefined ? `Min ${slaMin}%` : 'Min -'} - {slaMax !== undefined ? `Max ${slaMax}%` : 'Max -'}
              </span>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {loading ? (
            'Memuat data...'
          ) : error ? (
            <span className="text-status-danger">{error}</span>
          ) : apiData && apiData.pagination.total > 0 ? (
            `Menampilkan ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, apiData.pagination.total)} dari ${apiData.pagination.total} site`
          ) : (
            'Tidak ada data yang ditemukan'
          )}
        </p>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-status-danger mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        )}

        {/* Table - wrapper dengan ref untuk capture; padding & alignment rapi */}
        {!loading && !error && (
        <div
          ref={tableWrapperRef}
          className="overflow-x-auto rounded-md border border-border bg-white p-4"
        >
          <table ref={tableRef} className="w-full border-collapse bg-white">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map(({ key, label }) => (
                  <th
                    key={key}
                    className={cn(
                      "py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap",
                      key === 'siteName' || key === 'province' ? "text-left" : "text-center"
                    )}
                    onClick={() => handleSort(key)}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      key === 'siteName' || key === 'province' ? "justify-start" : "justify-center"
                    )}>
                      {label}
                      <ArrowUpDown className={cn(
                        "h-3 w-3 shrink-0",
                        sortField === key && "text-primary"
                      )} />
                    </div>
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Problem
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((site) => (
                <tr
                  key={site.id}
                  className={cn(
                    "border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors",
                    site.slaAvg
                  )}
                >
                  <td className="py-3 px-4 text-sm font-medium text-foreground text-left align-middle">
                    {site.siteName}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground text-left align-middle">
                    {site.province}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground text-center align-middle">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap min-h-[24px]",
                      site.batteryVersion === 'Talis5 Full' && "bg-battery-talis5FullLight text-battery-talis5Full",
                      site.batteryVersion === 'Talis5 Mix' && "bg-battery-talis5MixLight text-battery-talis5Mix",
                      site.batteryVersion === 'JS PRO' && "bg-battery-jsproLight text-battery-jspro",
                    )}>
                      {site.batteryVersion}
                    </span>
                  </td>
                  <td className={cn("py-3 px-4 text-sm font-semibold text-center align-middle", getSLAColor(site.slaAvg))}>
                    {site.slaAvg.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-sm text-center align-middle">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap min-h-[24px]",
                      site.status === 'Potensi SP'
                        ? "bg-status-warning/10 text-status-warning"
                        : "bg-status-good/10 text-status-good"
                    )}>
                      {site.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-center align-middle">
                    <div className="flex flex-wrap gap-1 justify-center items-center">
                      {getUniquePics(site.problems).length > 0 ? (
                        getUniquePics(site.problems).map((p) => (
                          <span
                            key={p}
                            className={cn(
                              "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold whitespace-nowrap min-h-[24px]",
                              getPicColor(p)
                            )}
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className={cn(
                    "py-3 px-4 text-sm text-left align-middle",
                    site.problems && site.problems.length > 0
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}>
                    {formatProblemDescription(site.problems)}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSite(site as Site)}
                      className="gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {!loading && !error && apiData && apiData.pagination.total > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} 
              {apiData.pagination.total > 0 && (
                <span className="ml-2">
                  ({((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, apiData.pagination.total)} dari {apiData.pagination.total} site)
                </span>
              )}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Site Detail Modal */}
      {selectedSite && 'problems' in selectedSite && (
        <SiteDetailModal
          site={selectedSite}
          problems={(selectedSite as Site & { problems: Problem[] }).problems}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </>
  );
};

export default SLADataTable;

