/**
 * Retur Spare Part Table Component
 * Table untuk menampilkan data retur spare part dengan pagination dan search
 * Gambar hanya ditampilkan di view detail
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
import { Label } from '@/components/ui/label';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import type { ReturSparePart } from '../types/shipping.types';
import { shippingApiClient } from '@/shared/lib/api';

interface ReturSparePartTableProps {
  data: ReturSparePart[];
  isLoading?: boolean;
  onView: (item: ReturSparePart) => void;
  onEdit: (item: ReturSparePart) => void;
  onDelete: (id: number) => void;
  filter?: {
    startDate?: string;
    endDate?: string;
    shipper?: string;
    source_spare_part?: string;
    search?: string;
  };
  onFilterChange?: (filter: {
    startDate?: string;
    endDate?: string;
    shipper?: string;
    source_spare_part?: string;
    search?: string;
  }) => void;
}

type SortField = 'date' | 'shipper' | 'source_spare_part' | 'list_spare_part';
type SortOrder = 'asc' | 'desc' | null;

export const ReturSparePartTable = ({
  data,
  isLoading,
  onView,
  onEdit,
  onDelete,
  filter = {},
  onFilterChange,
}: ReturSparePartTableProps) => {
  const [searchQuery, setSearchQuery] = useState(filter.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilter, setLocalFilter] = useState({
    startDate: filter.startDate || '',
    endDate: filter.endDate || '',
    shipper: filter.shipper || '',
    source_spare_part: filter.source_spare_part || '',
    search: filter.search || '',
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sync local filter with prop filter
  useEffect(() => {
    setLocalFilter({
      startDate: filter.startDate || '',
      endDate: filter.endDate || '',
      shipper: filter.shipper || '',
      source_spare_part: filter.source_spare_part || '',
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
      startDate: '',
      endDate: '',
      shipper: '',
      source_spare_part: '',
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

  // Format list_spare_part
  const formatListSparePart = (list?: string | Array<unknown>) => {
    if (!list) return '-';
    if (typeof list === 'string') {
      try {
        const parsed = JSON.parse(list);
        if (Array.isArray(parsed)) {
          return parsed.map((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              return JSON.stringify(item);
            }
            return String(item);
          }).join(', ');
        }
        return String(parsed);
      } catch {
        return list;
      }
    }
    if (Array.isArray(list)) {
      return list.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }
    return String(list);
  };

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
          item.shipper?.toLowerCase().includes(query) ||
          item.source_spare_part?.toLowerCase().includes(query) ||
          formatListSparePart(item.list_spare_part).toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query) ||
          (item.date ? format(new Date(item.date), 'dd/MM/yyyy').includes(query) : false)
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
        case 'shipper':
          aValue = (a.shipper || '').toLowerCase();
          bValue = (b.shipper || '').toLowerCase();
          break;
        case 'source_spare_part':
          aValue = (a.source_spare_part || '').toLowerCase();
          bValue = (b.source_spare_part || '').toLowerCase();
          break;
        case 'list_spare_part':
          aValue = formatListSparePart(a.list_spare_part).toLowerCase();
          bValue = formatListSparePart(b.list_spare_part).toLowerCase();
          break;
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

  const columns: { key: SortField; label: string }[] = [
    { key: 'date', label: 'Tanggal Pengembalian' },
    { key: 'shipper', label: 'Shipper' },
    { key: 'source_spare_part', label: 'Asal Spare Part' },
    { key: 'list_spare_part', label: 'List Barang' },
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
            placeholder="Search by Shipper, Asal Spare Part, List Barang, Notes, Tanggal..."
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
            {/* Shipper Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-shipper">Shipper</Label>
              <Input
                id="filter-shipper"
                placeholder="Masukkan shipper"
                value={localFilter.shipper}
                onChange={(e) => handleFilterChange('shipper', e.target.value)}
              />
            </div>

            {/* Source Spare Part Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-source">Asal Spare Part</Label>
              <Input
                id="filter-source"
                placeholder="Masukkan asal spare part"
                value={localFilter.source_spare_part}
                onChange={(e) => handleFilterChange('source_spare_part', e.target.value)}
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
              paginatedData.map((item) => {
                const listText = formatListSparePart(item.list_spare_part);
                
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{item.shipper || '-'}</TableCell>
                    <TableCell>{item.source_spare_part || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={listText}>
                      {listText.length > 50 ? `${listText.substring(0, 50)}...` : listText}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(item)}
                          title="View Detail (termasuk Notes)"
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
                );
              })
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
