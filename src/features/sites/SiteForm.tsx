/**
 * Site Form Component
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, ChevronLeft, ChevronRight, Eye, Save } from 'lucide-react';
import { format } from 'date-fns';
import { SiteFormData } from '../types';
import {
  PROVINCES,
  STATUS_OPTIONS,
  SCC_TYPES,
  BATTERY_VERSIONS,
  EHUB_VERSIONS,
  PANEL2_TYPES,
} from '../constants';

interface SiteFormProps {
  formData: SiteFormData;
  editingId: string | number | null;
  isSubmitting: boolean;
  onChange: (data: SiteFormData) => void;
  onSubmit?: (data: SiteFormData) => void;
  onCancel?: () => void;
}

const TABS = ['basic', 'network', 'hardware', 'location', 'project', 'provider'] as const;
type TabType = (typeof TABS)[number];

export const SiteForm = ({ formData, editingId, isSubmitting, onChange, onSubmit, onCancel }: SiteFormProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Validation functions
  const validateLongitude = (value: number | undefined): string | null => {
    if (value === undefined || value === null) return null;
    if (value < -180 || value > 180) {
      return 'Longitude must be between -180 and 180';
    }
    return null;
  };

  const validateLatitude = (value: number | undefined): string | null => {
    if (value === undefined || value === null) return null;
    if (value < -90 || value > 90) {
      return 'Latitude must be between -90 and 90';
    }
    return null;
  };

  const validateRequired = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.siteId?.trim()) {
      newErrors.siteId = 'Site ID is required';
    }
    
    if (!formData.siteName?.trim()) {
      newErrors.siteName = 'Site Name is required';
    }
    
    if (!formData.detail?.province?.trim()) {
      newErrors.province = 'Province is required';
    }
    
    return newErrors;
  };

  const validateContactPerson = (): string | null => {
    const contacts = formData.detail?.contactPerson || [];
    for (const contact of contacts) {
      if (!contact.name?.trim()) {
        return 'Contact person name is required';
      }
    }
    return null;
  };

  // Convert empty strings to null for nullable fields
  const prepareFormData = (data: SiteFormData): SiteFormData => {
    return {
      ...data,
      prCode: data.prCode?.trim() || null,
      clusterId: data.clusterId?.trim() || null,
      terminalId: data.terminalId?.trim() || null,
      ipSnmp: data.ipSnmp?.trim() || null,
      ipMiniPc: data.ipMiniPc?.trim() || null,
      webappUrl: data.webappUrl?.trim() || null,
      totalBattery: data.totalBattery !== undefined && data.totalBattery !== null 
        ? Math.max(0, Math.floor(data.totalBattery)) 
        : null,
      detail: data.detail ? {
        ...data.detail,
        village: data.detail.village?.trim() || null,
        subdistrict: data.detail.subdistrict?.trim() || null,
        regency: data.detail.regency?.trim() || null,
        ipGatewayGs: data.detail.ipGatewayGs?.trim() || null,
        ipGatewayLc: data.detail.ipGatewayLc?.trim() || null,
        subnet: data.detail.subnet?.trim() || null,
        buildYear: data.detail.buildYear?.trim() || null,
        projectPhase: data.detail.projectPhase?.trim() || null,
        providerGs: data.detail.providerGs?.trim() || null,
        beamProvider: data.detail.beamProvider?.trim() || null,
        cellularOperator: data.detail.cellularOperator?.trim() || null,
        contactPerson: data.detail.contactPerson?.map(cp => ({
          name: cp.name?.trim() || '',
          phone: cp.phone?.trim() || null,
        })) || [],
      } : undefined,
    };
  };

  const handleChange = (field: keyof SiteFormData, value: unknown) => {
    // Clear error when field is changed
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    onChange({ ...formData, [field]: value });
  };

  const handleDetailChange = (field: string, value: unknown) => {
    // Clear error when field is changed
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }

    // Validate longitude/latitude in real-time
    if (field === 'longitude' && typeof value === 'number') {
      const error = validateLongitude(value);
      if (error) {
        setErrors({ ...errors, longitude: error });
      } else {
        const newErrors = { ...errors };
        delete newErrors.longitude;
        setErrors(newErrors);
      }
    }
    
    if (field === 'latitude' && typeof value === 'number') {
      const error = validateLatitude(value);
      if (error) {
        setErrors({ ...errors, latitude: error });
      } else {
        const newErrors = { ...errors };
        delete newErrors.latitude;
        setErrors(newErrors);
      }
    }

    onChange({
      ...formData,
      detail: { ...formData.detail, [field]: value },
    });
  };

  const handleArrayChange = (field: 'batteryList' | 'cabinetList', index: number, value: string) => {
    const currentArray = formData.detail?.[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleDetailChange(field, newArray);
  };

  const handleAddArrayItem = (field: 'batteryList' | 'cabinetList') => {
    const currentArray = formData.detail?.[field] || [];
    handleDetailChange(field, [...currentArray, '']);
  };

  const handleRemoveArrayItem = (field: 'batteryList' | 'cabinetList', index: number) => {
    const currentArray = formData.detail?.[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleDetailChange(field, newArray);
  };

  const handleContactPersonChange = (index: number, field: 'name' | 'phone', value: string) => {
    const currentContacts = formData.detail?.contactPerson || [];
    const newContacts = [...currentContacts];
    if (!newContacts[index]) {
      newContacts[index] = { name: '', phone: '' };
    }
    newContacts[index] = { ...newContacts[index], [field]: value };
    handleDetailChange('contactPerson', newContacts);
  };

  const handleAddContactPerson = () => {
    const currentContacts = formData.detail?.contactPerson || [];
    handleDetailChange('contactPerson', [...currentContacts, { name: '', phone: '' }]);
  };

  const handleRemoveContactPerson = (index: number) => {
    const currentContacts = formData.detail?.contactPerson || [];
    const newContacts = currentContacts.filter((_, i) => i !== index);
    handleDetailChange('contactPerson', newContacts);
  };

  const formatDateValue = (dateValue?: string | null) => {
    if (!dateValue) return '';
    if (dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    if (dateValue.length === 10) {
      return dateValue;
    }
    try {
      return format(new Date(dateValue), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  // Tab navigation
  const currentTabIndex = TABS.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TABS.length - 1;

  const handleNext = () => {
    if (!isLastTab) {
      const nextTab = TABS[currentTabIndex + 1];
      setActiveTab(nextTab);
      setShowPreview(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstTab) {
      const prevTab = TABS[currentTabIndex - 1];
      setActiveTab(prevTab);
      setShowPreview(false);
    }
  };

  const handleSubmit = () => {
    // Validate all required fields
    const requiredErrors = validateRequired();
    const lonError = validateLongitude(formData.detail?.longitude);
    const latError = validateLatitude(formData.detail?.latitude);
    const contactError = validateContactPerson();

    const allErrors: Record<string, string> = { ...requiredErrors };
    if (lonError) allErrors.longitude = lonError;
    if (latError) allErrors.latitude = latError;
    if (contactError) allErrors.contactPerson = contactError;

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Navigate to tab with error
      if (allErrors.siteId || allErrors.siteName) {
        setActiveTab('basic');
      } else if (allErrors.province || allErrors.longitude || allErrors.latitude) {
        setActiveTab('location');
      } else if (allErrors.contactPerson) {
        setActiveTab('provider');
      }
      return;
    }

    // Prepare and submit data
    const cleanedData = prepareFormData(formData);
    if (onSubmit) {
      onSubmit(cleanedData);
    }
  };

  const handleTabChange = (value: string) => {
    if (TABS.includes(value as TabType)) {
      setActiveTab(value as TabType);
      setShowPreview(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="provider">Provider</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>PR Code</Label>
              <Input
                value={formData.prCode?.toUpperCase() || ''}
                onChange={(e) => handleChange('prCode', e.target.value)}
                placeholder="PR Code"
              />
            </div>
            <div>
              <Label>Site ID *</Label>
              <Input
                value={formData.siteId.toUpperCase() || ''}
                onChange={(e) => handleChange('siteId', e.target.value)}
                placeholder="PAP9999"
                disabled={!!editingId}
                className={errors.siteId ? 'border-destructive' : ''}
              />
              {errors.siteId && (
                <p className="text-sm text-destructive mt-1">{errors.siteId}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cluster ID</Label>
              <Input
                value={formData.clusterId?.toUpperCase() || ''}
                onChange={(e) => handleChange('clusterId', e.target.value)}
                placeholder="Cluster ID"
              />
            </div>
            <div>
              <Label>Terminal ID</Label>
              <Input
                value={formData.terminalId?.toUpperCase() || ''}
                onChange={(e) => handleChange('terminalId', e.target.value)}
                placeholder="Terminal ID"
              />
            </div>
          </div>
          <div>
            <Label>Site Name *</Label>
            <Input
              value={formData.siteName?.toUpperCase() || ''}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="Site Name"
              className={errors.siteName ? 'border-destructive' : ''}
            />
            {errors.siteName && (
              <p className="text-sm text-destructive mt-1">{errors.siteName}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.statusSites || 'none'}
                onValueChange={(value) => handleChange('statusSites', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
        </TabsContent>

        {/* Network & IP Tab */}
        <TabsContent value="network" className="space-y-4 mt-4">
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
              <Label>IP Mini PC</Label>
              <Input
                value={formData.ipMiniPc || ''}
                onChange={(e) => handleChange('ipMiniPc', e.target.value)}
                placeholder="192.168.1.2"
              />
            </div>
          </div>
          <div>
            <Label>Webapp URL</Label>
            <Input
              value={formData.webappUrl || ''}
              onChange={(e) => handleChange('webappUrl', e.target.value)}
              placeholder="site-name.sundaya.local"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>IP Gateway GS</Label>
              <Input
                value={formData.detail?.ipGatewayGs || ''}
                onChange={(e) => handleDetailChange('ipGatewayGs', e.target.value)}
                placeholder="192.168.1.254"
              />
            </div>
            <div>
              <Label>IP Gateway LC</Label>
              <Input
                value={formData.detail?.ipGatewayLc || ''}
                onChange={(e) => handleDetailChange('ipGatewayLc', e.target.value)}
                placeholder="192.168.1.253"
              />
            </div>
          </div>
          <div>
            <Label>Subnet</Label>
            <Input
              value={formData.detail?.subnet || ''}
              onChange={(e) => handleDetailChange('subnet', e.target.value)}
              placeholder="/29"
            />
          </div>
        </TabsContent>

        {/* Hardware & Configuration Tab */}
        <TabsContent value="hardware" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>EHub Version</Label>
              <Select
                value={formData.ehubVersion || 'none'}
                onValueChange={(value) => handleChange('ehubVersion', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih EHub Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {EHUB_VERSIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Panel2 Type</Label>
              <Select
                value={formData.panel2Type || 'none'}
                onValueChange={(value) => handleChange('panel2Type', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Panel2 Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {PANEL2_TYPES.map((opt) => (
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
              <Label>SCC Type</Label>
              <Select
                value={formData.sccType || 'none'}
                onValueChange={(value) => handleChange('sccType', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih SCC Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {SCC_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Battery Version</Label>
              <Select
                value={formData.batteryVersion || 'none'}
                onValueChange={(value) => handleChange('batteryVersion', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Battery Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {BATTERY_VERSIONS.map((bv) => (
                    <SelectItem key={bv.value} value={bv.value}>
                      {bv.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <Separator />
          <div>
            <Label>Battery List</Label>
            <div className="space-y-2">
              {(formData.detail?.batteryList || []).map((battery, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={battery || ''}
                    onChange={(e) => handleArrayChange('batteryList', index, e.target.value)}
                    placeholder={`Battery ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveArrayItem('batteryList', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddArrayItem('batteryList')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Battery
              </Button>
            </div>
          </div>
          <div>
            <Label>Cabinet List</Label>
            <div className="space-y-2">
              {(formData.detail?.cabinetList || []).map((cabinet, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={cabinet || ''}
                    onChange={(e) => handleArrayChange('cabinetList', index, e.target.value)}
                    placeholder={`Cabinet ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveArrayItem('cabinetList', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddArrayItem('cabinetList')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Cabinet
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Location Details Tab */}
        <TabsContent value="location" className="space-y-4 mt-4">
          <div>
            <Label>Province *</Label>
            <Select
              value={formData.detail?.province || ''}
              onValueChange={(value) => handleDetailChange('province', value)}
            >
              <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
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
            {errors.province && (
              <p className="text-sm text-destructive mt-1">{errors.province}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Regency</Label>
              <Input
                value={formData.detail?.regency?.toUpperCase() || ''}
                onChange={(e) => handleDetailChange('regency', e.target.value)}
                placeholder="Regency"
              />
            </div>
            <div>
              <Label>Subdistrict</Label>
              <Input
                value={formData.detail?.subdistrict?.toUpperCase() || ''}
                onChange={(e) => handleDetailChange('subdistrict', e.target.value)}
                placeholder="Subdistrict"
              />
            </div>
          </div>
          <div>
            <Label>Village</Label>
            <Input
              value={formData.detail?.village?.toUpperCase() || ''}
              onChange={(e) => handleDetailChange('village', e.target.value)}
              placeholder="Village"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.detail?.longitude || ''}
                onChange={(e) =>
                  handleDetailChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="0.000000"
                min={-180}
                max={180}
                className={errors.longitude ? 'border-destructive' : ''}
              />
              {errors.longitude && (
                <p className="text-sm text-destructive mt-1">{errors.longitude}</p>
              )}
            </div>
            <div>
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.detail?.latitude || ''}
                onChange={(e) =>
                  handleDetailChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="0.000000"
                min={-90}
                max={90}
                className={errors.latitude ? 'border-destructive' : ''}
              />
              {errors.latitude && (
                <p className="text-sm text-destructive mt-1">{errors.latitude}</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Project & Dates Tab */}
        <TabsContent value="project" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Build Year</Label>
              <Input
                value={formData.detail?.buildYear || ''}
                onChange={(e) => handleDetailChange('buildYear', e.target.value)}
                placeholder="2024"
              />
            </div>
            <div>
              <Label>Project Phase</Label>
              <Input
                value={formData.detail?.projectPhase?.toUpperCase() || ''}
                onChange={(e) => handleDetailChange('projectPhase', e.target.value)}
                placeholder="Phase 1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>On Air Date</Label>
              <Input
                type="date"
                value={formatDateValue(formData.detail?.onairDate)}
                onChange={(e) => handleDetailChange('onairDate', e.target.value || undefined)}
              />
            </div>
            <div>
              <Label>Talis Installed</Label>
              <Input
                type="date"
                value={formatDateValue(formData.detail?.talisInstalled)}
                onChange={(e) => handleDetailChange('talisInstalled', e.target.value || undefined)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>GS Sustain Date</Label>
              <Input
                type="date"
                value={formatDateValue(formData.detail?.gsSustainDate)}
                onChange={(e) => handleDetailChange('gsSustainDate', e.target.value || undefined)}
              />
            </div>
            <div>
              <Label>Topo Sustain Date</Label>
              <Input
                type="date"
                value={formatDateValue(formData.detail?.topoSustainDate)}
                onChange={(e) => handleDetailChange('topoSustainDate', e.target.value || undefined)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Provider & Contact Tab */}
        <TabsContent value="provider" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Provider GS</Label>
              <Input
                value={formData.detail?.providerGs?.toUpperCase() || ''}
                onChange={(e) => handleDetailChange('providerGs', e.target.value)}
                placeholder="Provider GS"
              />
            </div>
            <div>
              <Label>Beam Provider</Label>
              <Input
                value={formData.detail?.beamProvider?.toUpperCase() || ''}
                onChange={(e) => handleDetailChange('beamProvider', e.target.value)}
                placeholder="Beam Provider"
              />
            </div>
          </div>
          <div>
            <Label>Cellular Operator</Label>
            <Input
              value={formData.detail?.cellularOperator?.toUpperCase() || ''}
              onChange={(e) => handleDetailChange('cellularOperator', e.target.value)}
              placeholder="Cellular Operator"
            />
          </div>
          <Separator />
          <div>
            <Label>Contact Person</Label>
            <div className="space-y-2">
              {(formData.detail?.contactPerson || []).map((contact, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                  <div>
                    <Input
                      value={contact.name || ''}
                      onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                      placeholder="Name"
                      className={errors.contactPerson && !contact.name?.trim() ? 'border-destructive' : ''}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={contact.phone || ''}
                      onChange={(e) => handleContactPersonChange(index, 'phone', e.target.value)}
                      placeholder="Phone"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveContactPerson(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContactPerson}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Contact Person
              </Button>
              {errors.contactPerson && (
                <p className="text-sm text-destructive mt-1">{errors.contactPerson}</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {!isFirstTab && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {!isLastTab && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={isSubmitting}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {isLastTab && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : editingId ? 'Update Site' : 'Save Site'}
            </Button>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Site ID:</strong> {formData.siteId || '-'}
              </div>
              <div>
                <strong>Site Name:</strong> {formData.siteName || '-'}
              </div>
              <div>
                <strong>Province:</strong> {formData.detail?.province || '-'}
              </div>
              <div>
                <strong>Status:</strong> {formData.statusSites || '-'}
              </div>
              <div>
                <strong>Longitude:</strong> {formData.detail?.longitude ?? '-'}
              </div>
              <div>
                <strong>Latitude:</strong> {formData.detail?.latitude ?? '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            <strong>Please fix the following errors:</strong>
            <ul className="list-disc list-inside mt-2">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
