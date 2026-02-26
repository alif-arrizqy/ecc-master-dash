/**
 * Ticket Filters Component
 * Filter section untuk tickets
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { TicketType } from '../types/ticketing.types';
import type { TicketFilterParams } from '../types/ticketing.types';

interface TicketFiltersProps {
  ticketTypes: TicketType[];
  onFilterChange: (filters: Partial<TicketFilterParams>) => void;
  onApply: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TicketFilters = ({ ticketTypes, onFilterChange, onApply: _onApply }: TicketFiltersProps) => {
  const [filters, setFilters] = useState({
    siteName: '',
    status: '',
    ticketType: '',
    province: '',
  });

  const handleFilterChange = (key: string, value: string) => {
    const normalizedValue = value === 'all' ? '' : value;
    setFilters((prev) => ({ ...prev, [key]: normalizedValue }));
    onFilterChange({ [key]: normalizedValue === '' ? undefined : normalizedValue });
  };

  const handleClear = () => {
    setFilters({
      siteName: '',
      status: '',
      ticketType: '',
      province: '',
    });
    onFilterChange({
      siteName: undefined,
      status: undefined,
      ticketType: undefined,
      province: undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== '');

  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up mb-6">
      <div className="flex flex-col gap-4">
        {/* Filter bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Site Name Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari Nama Site..."
              value={filters.siteName}
              onChange={(e) => handleFilterChange('siteName', e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Province Filter */}
          <Select value={filters.province || 'all'} onValueChange={(val) => handleFilterChange('province', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Provinsi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Provinsi</SelectItem>
              <SelectItem value="MALUKU">MALUKU</SelectItem>
              <SelectItem value="MALUKU UTARA">MALUKU UTARA</SelectItem>
              <SelectItem value="PAPUA BARAT">PAPUA BARAT</SelectItem>
              <SelectItem value="PAPUA BARAT DAYA">PAPUA BARAT DAYA</SelectItem>
              <SelectItem value="PAPUA SELATAN">PAPUA SELATAN</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filters.status || 'all'} onValueChange={(val) => handleFilterChange('status', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Ticket Type Filter */}
          <Select
            value={filters.ticketType || 'all'}
            onValueChange={(val) => handleFilterChange('ticketType', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {ticketTypes.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
