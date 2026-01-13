/**
 * Site Down Table Component
 * Menampilkan tabel site down dengan sorting, filtering, dan pagination
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SiteDownWithStatus, MonitoringPagination } from '../types/monitoring.types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SiteDownTableProps {
  data: SiteDownWithStatus[];
  pagination?: MonitoringPagination;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSiteIdFilter?: (siteId: string) => void;
  onRefresh?: () => void;
}

export const SiteDownTable = ({
  data,
  pagination,
  isLoading,
  onPageChange,
  onLimitChange,
  onSiteIdFilter,
  onRefresh,
}: SiteDownTableProps) => {
  const [siteIdFilter, setSiteIdFilter] = useState('');

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

  const handleSiteIdFilterChange = (value: string) => {
    setSiteIdFilter(value);
    if (onSiteIdFilter) {
      onSiteIdFilter(value || '');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Filter by Site ID..."
            value={siteIdFilter}
            onChange={(e) => handleSiteIdFilterChange(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site ID</TableHead>
              <TableHead>Site Name</TableHead>
              <TableHead>Down Since</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <span className="text-muted-foreground">Tidak ada data site down</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.siteId}</TableCell>
                  <TableCell>{site.siteName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{site.formattedDownSince}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(site.downSince).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{site.formattedDuration}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(site.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
            {pagination.total} site
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
            >
              Next
            </Button>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => onLimitChange?.(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

