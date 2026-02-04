/**
 * Shipping Spare Part Table Component
 * Table untuk menampilkan data shipping spare part dengan pagination, search, dan status update
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import type { ShippingSparePart } from '../types/shipping.types';

interface ShippingSparePartTableProps {
  data: ShippingSparePart[];
  isLoading?: boolean;
  onView: (item: ShippingSparePart) => void;
  onEdit: (item: ShippingSparePart) => void;
  onDelete: (id: number) => void;
  filter?: {
    status?: string;
    site_id?: string;
    province?: string;
    cluster?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
  onFilterChange?: (filter: {
    status?: string;
    site_id?: string;
    province?: string;
    cluster?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => void;
}

type SortField = 'date' | 'site_id' | 'site_name' | 'pr_code' | 'cluster' | 'address' | 'problem' | 'status';
type SortOrder = 'asc' | 'desc' | null;

export const ShippingSparePartTable = ({
  data,
  isLoading,
  onView,
  onEdit,
  onDelete,
  filter = {},
  onFilterChange,
}: ShippingSparePartTableProps) => {
  const [searchQuery, setSearchQuery] = useState(filter.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilter, setLocalFilter] = useState({
    status: filter.status || '',
    site_id: filter.site_id || '',
    province: filter.province || '',
    cluster: filter.cluster || '',
    startDate: filter.startDate || '',
    endDate: filter.endDate || '',
    search: filter.search || '',
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sync local filter with prop filter
  useEffect(() => {
    setLocalFilter({
      status: filter.status || '',
      site_id: filter.site_id || '',
      province: filter.province || '',
      cluster: filter.cluster || '',
      startDate: filter.startDate || '',
      endDate: filter.endDate || '',
      search: filter.search || '',
    });
    setSearchQuery(filter.search || '');
  }, [filter]);

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    const newFilter = { ...localFilter, [key]: value };
    setLocalFilter(newFilter);
    if (onFilterChange) {
      // Remove empty values
      const cleanedFilter: any = {};
      Object.entries(newFilter).forEach(([k, v]) => {
        if (v && v.trim() !== '') {
          cleanedFilter[k] = v;
        }
      });
      onFilterChange(cleanedFilter);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    const emptyFilter = {
      status: '',
      site_id: '',
      province: '',
      cluster: '',
      startDate: '',
      endDate: '',
      search: '',
    };
    setLocalFilter(emptyFilter);
    setSearchQuery('');
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  // Check if any filter is active
  const hasActiveFilters = Object.values(localFilter).some(v => v && v.trim() !== '');

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
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
    // Filter by search query
    let filtered = data;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter((item) => {
        return (
          item.site?.site_id?.toLowerCase().includes(query) ||
          item.site?.site_name?.toLowerCase().includes(query) ||
          item.site?.pr_code?.toLowerCase().includes(query) ||
          item.address?.cluster?.toLowerCase().includes(query) ||
          item.address?.address_shipping?.toLowerCase().includes(query) ||
          item.problem?.problem_name?.toLowerCase().includes(query) ||
          item.sparepart_note?.toLowerCase().includes(query) ||
          item.ticket?.ticket_number?.toLowerCase().includes(query) ||
          item.resi?.resi_number?.toLowerCase().includes(query)
        );
      });
    }

    // Sort data
    const sorted = [...filtered];
    if (!sortField || !sortOrder) return sorted;

    return sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        case 'site_id': {
          aValue = (a.site?.site_id || '').toLowerCase();
          bValue = (b.site?.site_id || '').toLowerCase();
          break;
        }
        case 'site_name': {
          aValue = (a.site?.site_name || '').toLowerCase();
          bValue = (b.site?.site_name || '').toLowerCase();
          break;
        }
        case 'pr_code': {
          aValue = (a.site?.pr_code || '').toLowerCase();
          bValue = (b.site?.pr_code || '').toLowerCase();
          break;
        }
        case 'cluster': {
          aValue = (a.address?.cluster || '').toLowerCase();
          bValue = (b.address?.cluster || '').toLowerCase();
          break;
        }
          case 'address': {
            aValue = (a.address?.address_shipping || '').toLowerCase();
            bValue = (b.address?.address_shipping || '').toLowerCase();
            break;
          }
          case 'problem': {
            aValue = (a.problem?.problem_name || '').toLowerCase();
            bValue = (b.problem?.problem_name || '').toLowerCase();
            break;
          }
          case 'status': {
            const statusOrder: Record<string, number> = { 
              'selesai': 3, 'SELESAI': 3,
              'proses kirim': 2, 'PROSES_KIRIM': 2,
              'request gudang': 1, 'REQUEST_GUDANG': 1
            };
            aValue = statusOrder[a.status] || 0;
            bValue = statusOrder[b.status] || 0;
            break;
          }
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder, searchQuery]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage]);

  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to page 1 when data changes
  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedData.length, currentPage, totalPages]);

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

  const normalizeStatus = (status: string): 'request gudang' | 'proses kirim' | 'selesai' => {
    if (status === 'REQUEST_GUDANG' || status === 'request gudang') return 'request gudang';
    if (status === 'PROSES_KIRIM' || status === 'proses kirim') return 'proses kirim';
    if (status === 'SELESAI' || status === 'selesai') return 'selesai';
    return 'request gudang';
  };

  const getStatusDisplay = (status: string) => {
    const normalized = normalizeStatus(status);
    return normalized === 'request gudang' ? 'Request Gudang' : 
           normalized === 'proses kirim' ? 'Proses Kirim' : 'Selesai';
  };

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    const colors = {
      'request gudang': 'bg-status-warning/10 text-status-warning',
      'proses kirim': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'selesai': 'bg-status-good/10 text-status-good',
    };
    return colors[normalized];
  };

  const columns: { key: SortField; label: string }[] = [
    { key: 'date', label: 'Tanggal Kirim' },
    { key: 'site_id', label: 'Site ID' },
    { key: 'site_name', label: 'Nama Site' },
    { key: 'pr_code', label: 'Kode PR' },
    { key: 'cluster', label: 'Cluster' },
    { key: 'address', label: 'Alamat' },
    { key: 'problem', label: 'Problem' },
    { key: 'status', label: 'Status' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <Input
            placeholder="Search by Site ID, Site Name, PR Code, Cluster, Address, Problem, Note, Ticket..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange('search', e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1"
          />
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
                {Object.values(localFilter).filter(v => v && v.trim() !== '').length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Filter Data</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={localFilter.status || undefined}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    handleFilterChange('status', '');
                  } else {
                    handleFilterChange('status', value);
                  }
                }}
              >
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="REQUEST_GUDANG">Request Gudang</SelectItem>
                  <SelectItem value="PROSES_KIRIM">Proses Kirim</SelectItem>
                  <SelectItem value="SELESAI">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Province Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-province">Provinsi</Label>
              <Select
                value={localFilter.province || undefined}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    handleFilterChange('province', '');
                  } else {
                    handleFilterChange('province', value);
                  }
                }}
              >
                <SelectTrigger id="filter-province">
                  <SelectValue placeholder="Semua Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Provinsi</SelectItem>
                  <SelectItem value="PAPUA_BARAT">Papua Barat</SelectItem>
                  <SelectItem value="PAPUA_BARAT_DAYA">Papua Barat Daya</SelectItem>
                  <SelectItem value="PAPUA_SELATAN">Papua Selatan</SelectItem>
                  <SelectItem value="PAPUA">Papua</SelectItem>
                  <SelectItem value="MALUKU">Maluku</SelectItem>
                  <SelectItem value="MALUKU_UTARA">Maluku Utara</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cluster Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-cluster">Cluster</Label>
              <Input
                id="filter-cluster"
                placeholder="Masukkan cluster"
                value={localFilter.cluster}
                onChange={(e) => handleFilterChange('cluster', e.target.value)}
              />
            </div>

            {/* Site ID Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-site-id">Site ID</Label>
              <Input
                id="filter-site-id"
                placeholder="Masukkan Site ID"
                value={localFilter.site_id}
                onChange={(e) => handleFilterChange('site_id', e.target.value)}
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-start-date">Tanggal Mulai</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={localFilter.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-end-date">Tanggal Akhir</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={localFilter.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {!isLoading && totalItems > 0 && (
        <p className="text-sm text-muted-foreground">
          Menampilkan {((currentPage - 1) * itemsPerPage) + 1} -{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {getSortIcon(key)}
                  </div>
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-muted-foreground">
                      {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{item.site?.site_id || '-'}</TableCell>
                  <TableCell>{item.site?.site_name.toUpperCase() || '-'}</TableCell>
                  <TableCell>{item.site?.pr_code || '-'}</TableCell>
                  <TableCell>{item.address?.cluster || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={item.address?.address_shipping || ''}>
                    {item.address?.address_shipping || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={item.problem?.problem_name || ''}>
                    {item.problem?.problem_name || '-'}
                  </TableCell>
                  <TableCell>
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(item.status))}>
                      {getStatusDisplay(item.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(item)}
                        title="View Detail (termasuk Sparepart Note)"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalItems > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages} ({totalItems} data)
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  type="button"
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
