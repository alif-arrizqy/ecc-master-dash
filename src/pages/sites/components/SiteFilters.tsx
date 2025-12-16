/**
 * Site Filters Component
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PROVINCES, STATUS_OPTIONS, SCC_TYPES, BATTERY_VERSIONS } from '../constants';

interface SiteFiltersProps {
  searchTerm: string;
  statusFilter: string;
  sccTypeFilter: string;
  batteryVersionFilter: string;
  provinceFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSccTypeChange: (value: string) => void;
  onBatteryVersionChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
}

export const SiteFilters = ({
  searchTerm,
  statusFilter,
  sccTypeFilter,
  batteryVersionFilter,
  provinceFilter,
  onSearchChange,
  onStatusChange,
  onSccTypeChange,
  onBatteryVersionChange,
  onProvinceChange,
}: SiteFiltersProps) => {
  return (
    <Card className="mb-6 card-shadow animate-slide-up">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari site name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sccTypeFilter} onValueChange={onSccTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="SCC Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua SCC Type</SelectItem>
              {SCC_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={batteryVersionFilter} onValueChange={onBatteryVersionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Battery Version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Battery</SelectItem>
              {BATTERY_VERSIONS.map((bv) => (
                <SelectItem key={bv.value} value={bv.value}>
                  {bv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={provinceFilter} onValueChange={onProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Province</SelectItem>
              {PROVINCES.map((prov) => (
                <SelectItem key={prov} value={prov}>
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

