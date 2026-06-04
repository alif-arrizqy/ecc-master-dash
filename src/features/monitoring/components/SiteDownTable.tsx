/**
 * Site Down Table Component
 * Menampilkan tabel site down dengan sorting, filtering, dan pagination
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteDownWithStatus, MonitoringPagination } from '../types/monitoring.types';
import { AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import MonitoringSiteDetailModal from './MonitoringSiteDetailModal';

interface SiteDownTableProps {
  data: SiteDownWithStatus[];
  pagination?: MonitoringPagination;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onSiteIdFilter?: (siteName: string) => void; // Changed to siteName for API filter
}

type SortField = 'siteName' | 'slaAvg' | 'statusSLA' | 'statusSP' | 'problem' | 'downSince' | 'downSeconds' | 'status';
type SortOrder = 'asc' | 'desc' | null;

const MAX_PROBLEM_DISPLAY_LENGTH = 45;

function formatProblemList(problem: string[] | undefined, maxLen: number = MAX_PROBLEM_DISPLAY_LENGTH): { display: string; full: string } {
  const list = problem?.filter(Boolean) || [];
  if (list.length === 0) return { display: '-', full: '' };
  const full = list.join(', ');
  const display = full.length > maxLen ? `${full.slice(0, maxLen)}...` : full;
  return { display, full };
}

export const SiteDownTable = ({
  data,
  pagination,
  isLoading,
  onPageChange,
  onSiteIdFilter,
}: SiteDownTableProps) => {
  const [siteNameFilter, setSiteNameFilter] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSite, setSelectedSite] = useState<SiteDownWithStatus | null>(null);
  const itemsPerPage = 5; // Fixed 5 rows per page

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    // Filter by site name
    let filtered = data;
    if (siteNameFilter.trim()) {
      filtered = data.filter(site => 
        site.siteName.toLowerCase().includes(siteNameFilter.toLowerCase())
      );
    }

    // Sort data - create a copy first to avoid mutating the original array
    const sorted = [...filtered];
    if (!sortField || !sortOrder) return sorted;
    
    return sorted.sort((a, b) => {

      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'siteName':
          aValue = a.siteName.toLowerCase();
          bValue = b.siteName.toLowerCase();
          break;
        case 'slaAvg':
          aValue = a.slaAvg || 0;
          bValue = b.slaAvg || 0;
          break;
        case 'statusSLA': {
          const slaStatusOrder = { 'Meet SLA': 4, 'Fair': 3, 'Bad': 2, 'Very Bad': 1 };
          aValue = slaStatusOrder[a.statusSLA || 'Very Bad'];
          bValue = slaStatusOrder[b.statusSLA || 'Very Bad'];
          break;
        }
        case 'statusSP': {
          const spStatusOrder = { 'Potensi SP': 2, 'Clear SP': 1 };
          aValue = spStatusOrder[a.statusSP || 'Clear SP'];
          bValue = spStatusOrder[b.statusSP || 'Clear SP'];
          break;
        }
        case 'problem':
          aValue = (a.problem || []).length;
          bValue = (b.problem || []).length;
          break;
        case 'downSince': {
          // Handle null values: null dianggap lebih kecil
          if (!a.downSince && !b.downSince) return 0;
          if (!a.downSince) return 1;
          if (!b.downSince) return -1;
          aValue = new Date(a.downSince).getTime();
          bValue = new Date(b.downSince).getTime();
          break;
        }
        case 'downSeconds': {
          // Handle null values: null dianggap lebih kecil
          if (a.downSeconds == null && b.downSeconds == null) return 0;
          if (a.downSeconds == null) return 1;
          if (b.downSeconds == null) return -1;
          aValue = a.downSeconds;
          bValue = b.downSeconds;
          break;
        }
        case 'status': {
          const statusOrder = { critical: 3, warning: 2, normal: 1 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder, siteNameFilter]);

  // Client-side pagination: always paginate if we have more data than itemsPerPage
  // This handles both dummy data (all 20 items) and real API data that might return all items
  const paginatedData = useMemo(() => {
    // If data length is greater than itemsPerPage, we need client-side pagination
    // This means all data is sent and we need to slice it
    if (filteredAndSortedData.length > itemsPerPage) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredAndSortedData.slice(startIndex, endIndex);
    }
    // If data length <= itemsPerPage, server has already paginated it
    return filteredAndSortedData;
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalItems = filteredAndSortedData.length;
  // If we have more data than itemsPerPage, use client-side pagination
  // Otherwise, use server-side pagination info if available
  const useClientPagination = totalItems > itemsPerPage;
  // For client-side pagination, use server total if available, otherwise use filtered data length
  const serverTotal = pagination?.total || totalItems;
  const totalPages = useClientPagination 
    ? Math.ceil(totalItems / itemsPerPage)
    : (pagination?.totalPages || 1);
  const currentPageNum = useClientPagination ? currentPage : (pagination?.page || 1);

  // Reset to page 1 when data changes (for client-side pagination)
  useEffect(() => {
    if (useClientPagination && currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedData.length, useClientPagination, currentPage, totalPages]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="h-3 w-3 text-primary" />;
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="h-3 w-3 text-primary" />;
    }
    return <ArrowUpDown className="h-3 w-3" />;
  };

  const getStatusBadge = (status: 'critical' | 'warning' | 'normal') => {
    const variants = {
      critical: 'destructive',
      warning: 'default',
      normal: 'secondary',
    } as const;

    const labels = {
      critical: 'Critical',
      warning: 'Warning',
      normal: 'Normal',
    };

    return (
      <Badge variant={variants[status]}>{labels[status]}</Badge>
    );
  };

  // Helper functions for SLA status (similar to SLA table)
  const getSLAStatus = (sla?: number): 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad' => {
    if (!sla) return 'Very Bad';
    if (sla >= 95.5) return 'Meet SLA';
    if (sla >= 90) return 'Fair';
    if (sla >= 80) return 'Bad';
    return 'Very Bad';
  };

  const getSLAColor = (sla?: number) => {
    if (sla >= 95.5) return 'text-status-good';
    if (sla >= 70) return 'text-status-warning';
    return 'text-status-danger';
  };

  const getSLAStatusColor = (status: 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad') => {
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

  const handleSiteNameFilterChange = (value: string) => {
    setSiteNameFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
    // For server-side filtering, call the callback
    // We check if we're using server-side by checking if data length <= itemsPerPage
    if (onSiteIdFilter && data.length <= itemsPerPage) {
      onSiteIdFilter(value || '');
    }
  };

  const handlePageChange = (page: number) => {
    const useClientPagination = filteredAndSortedData.length > itemsPerPage;
    if (useClientPagination) {
      setCurrentPage(page);
    } else {
      // Server-side pagination
      onPageChange?.(page);
    }
  };

  const handlePageButtonClick = (page: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handlePageChange(page);
  };


  const columns: { key: SortField; label: string }[] = [
    { key: 'siteName', label: 'Site Name' },
    { key: 'slaAvg', label: 'SLA AVG' },
    { key: 'statusSLA', label: 'Status SLA' },
    { key: 'statusSP', label: 'Status SP' },
    { key: 'problem', label: 'Problem' },
    { key: 'downSince', label: 'Down Since' },
    { key: 'downSeconds', label: 'Duration' },
  ];

  return (
    <div className="bg-card rounded-lg p-6 border shadow-sm">
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Site Down</h3>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <Input
              placeholder="Search by Site Name..."
              value={siteNameFilter}
              onChange={(e) => handleSiteNameFilterChange(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        {/* Results count */}
        {!isLoading && totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            {useClientPagination ? (
              <>
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} dari{' '}
                {totalItems} site
              </>
            ) : (
              <>
                {(() => {
                  const serverPage = pagination?.page || 1;
                  const serverTotal = pagination?.total || totalItems;
                  return (
                    <>
                      Menampilkan {((serverPage - 1) * itemsPerPage) + 1} -{' '}
                      {Math.min(serverPage * itemsPerPage, serverTotal)} dari{' '}
                      {serverTotal} site
                    </>
                  );
                })()}
              </>
            )}
          </p>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {columns.map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {getSortIcon(key)}
                      </div>
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">Tidak ada data site down</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((site) => {
                    const slaStatus = site.statusSLA || getSLAStatus(site.slaAvg);
                    const problemDisplay = formatProblemList(site.problem);
                    return (
                      <tr
                        key={site.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          {site.siteName}
                        </td>
                        <td className={cn("py-3 px-4 text-sm font-semibold", getSLAColor(site.slaAvg))}>
                          {site.slaAvg != null ? `${site.slaAvg.toFixed(2)}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            getSLAStatusColor(slaStatus)
                          )}>
                            {slaStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            site.statusSP === 'Potensi SP'
                              ? "bg-status-warning/10 text-status-warning"
                              : "bg-status-good/10 text-status-good"
                          )}>
                            {site.statusSP || 'Clear SP'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm max-w-[250px]">
                          <span
                            className="block truncate text-sm font-medium"
                            title={problemDisplay.full || undefined}
                          >
                            {problemDisplay.display}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {site.downSince ? (
                            <div className="flex flex-col">
                              <span className="text-foreground">{site.formattedDownSince}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(site.downSince).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          {site.formattedDuration}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setSelectedSite(site)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPageNum} dari {totalPages}
              {(() => {
                const startItem = ((currentPageNum - 1) * itemsPerPage) + 1;
                const endItem = Math.min(currentPageNum * itemsPerPage, totalItems);
                const total = useClientPagination ? serverTotal : (pagination?.total || totalItems);
                return `(${startItem}-${endItem} dari ${total} site)`;
              })()}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => handlePageButtonClick(currentPageNum - 1, e)}
                disabled={currentPageNum === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPageNum <= 3) {
                  pageNum = i + 1;
                } else if (currentPageNum >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPageNum - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    type="button"
                    variant={currentPageNum === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => handlePageButtonClick(pageNum, e)}
                    className="w-8"
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => handlePageButtonClick(currentPageNum + 1, e)}
                disabled={currentPageNum >= totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Site Detail Modal */}
      {selectedSite && (
        <MonitoringSiteDetailModal
          site={selectedSite}
          type="down"
          onClose={() => setSelectedSite(null)}
        />
      )}
    </div>
  );
};
