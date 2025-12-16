/**
 * Site Form Component
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { SiteFormData } from '../types';
import { PROVINCES, STATUS_OPTIONS, SCC_TYPES, BATTERY_VERSIONS } from '../constants';

interface SiteFormProps {
  formData: SiteFormData;
  editingId: string | number | null;
  isSubmitting: boolean;
  onChange: (data: SiteFormData) => void;
}

export const SiteForm = ({ formData, editingId, isSubmitting, onChange }: SiteFormProps) => {
  const handleChange = (field: keyof SiteFormData, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  const handleDetailChange = (field: string, value: unknown) => {
    onChange({
      ...formData,
      detail: { ...formData.detail, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Site ID *</Label>
          <Input
            value={formData.siteId || ''}
            onChange={(e) => handleChange('siteId', e.target.value)}
            placeholder="PAP9999"
            disabled={!!editingId}
          />
        </div>
        <div>
          <Label>Site Name *</Label>
          <Input
            value={formData.siteName?.toUpperCase() || ''}
            onChange={(e) => handleChange('siteName', e.target.value)}
            placeholder="Site Name"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Province *</Label>
          <Select
            value={formData.detail?.province || ''}
            onValueChange={(value) => handleDetailChange('province', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Province" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((prov) => (
                <SelectItem key={prov} value={prov}>
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={formData.statusSites || ''}
            onValueChange={(value) => handleChange('statusSites', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">-</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>IP SNMP</Label>
          <Input
            value={formData.ipSnmp || ''}
            onChange={(e) => handleChange('ipSnmp', e.target.value)}
            placeholder="192.168.1.1"
          />
        </div>
        <div>
          <Label>SCC Type</Label>
          <Select
            value={formData.sccType || ''}
            onValueChange={(value) => handleChange('sccType', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih SCC Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">-</SelectItem>
              {SCC_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Battery Version</Label>
          <Select
            value={formData.batteryVersion || ''}
            onValueChange={(value) => handleChange('batteryVersion', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Battery Version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">-</SelectItem>
              {BATTERY_VERSIONS.map((bv) => (
                <SelectItem key={bv.value} value={bv.value}>
                  {bv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Total Battery</Label>
          <Input
            type="number"
            value={formData.totalBattery || ''}
            onChange={(e) =>
              handleChange('totalBattery', e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="0"
            min={0}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Talis Installed</Label>
          <Input
            type="date"
            value={
              formData.detail?.talisInstalled
                ? formData.detail.talisInstalled.includes('T')
                  ? formData.detail.talisInstalled.split('T')[0]
                  : formData.detail.talisInstalled.length === 10
                    ? formData.detail.talisInstalled
                    : format(new Date(formData.detail.talisInstalled), 'yyyy-MM-dd')
                : ''
            }
            onChange={(e) => handleDetailChange('talisInstalled', e.target.value || undefined)}
          />
        </div>
        <div>
          <Label>Webapp URL</Label>
          <Input
            type="text"
            value={formData.webappUrl || ''}
            onChange={(e) => handleChange('webappUrl', e.target.value)}
            placeholder="site-name.sundaya.local"
          />
        </div>
      </div>
    </div>
  );
};

