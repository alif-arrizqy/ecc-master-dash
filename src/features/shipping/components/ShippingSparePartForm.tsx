/**
 * Shipping Spare Part Form Component
 * Form untuk create dan update shipping spare part
 */

import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Plus, X, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sitesApi } from '@/shared/lib/api';
import { problemMasterApi, addressApi } from '../services/shipping.api';
import type { ShippingSparePartFormData, Site, ProblemMaster, Address } from '../types/shipping.types';

interface ShippingSparePartFormProps {
  formData: ShippingSparePartFormData;
  editingId?: number | null;
  isSubmitting?: boolean;
  onChange: (data: ShippingSparePartFormData) => void;
  onSubmit: (data: ShippingSparePartFormData) => void;
  onCancel: () => void;
  existingTicketImage?: string; // URL gambar ticket dari database (untuk edit mode)
  existingResiImage?: string; // URL gambar resi dari database (untuk edit mode)
}

const formatSiteName = (siteName: string | null | undefined): string => {
  if (!siteName) return '';
  return siteName.toUpperCase().replace(/_/g, ' ');
};

export const ShippingSparePartForm = ({
  formData,
  editingId,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
  existingTicketImage,
  existingResiImage,
}: ShippingSparePartFormProps) => {
  const [sitePopoverOpen, setSitePopoverOpen] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [problemPopoverOpen, setProblemPopoverOpen] = useState(false);
  const [problemSearchQuery, setProblemSearchQuery] = useState('');
  const [showNewProblemInput, setShowNewProblemInput] = useState(false);
  const [addressPopoverOpen, setAddressPopoverOpen] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [showNewAddressInput, setShowNewAddressInput] = useState(false);
  const [newAddressData, setNewAddressData] = useState<{
    address_shipping: string;
    province: string;
    cluster: string;
  }>({
    address_shipping: '',
    province: '',
    cluster: '',
  });

  // Province enum values
  const provinces = [
    { value: 'PAPUA_BARAT', label: 'Papua Barat' },
    { value: 'PAPUA_BARAT_DAYA', label: 'Papua Barat Daya' },
    { value: 'PAPUA_SELATAN', label: 'Papua Selatan' },
    { value: 'PAPUA', label: 'Papua' },
    { value: 'MALUKU', label: 'Maluku' },
    { value: 'MALUKU_UTARA', label: 'Maluku Utara' },
  ] as const;
  const queryClient = useQueryClient();

  // Fetch sites - enable when popover is open OR when editing (to populate selectedSite)
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesApi.getSites({ page: 1, limit: 100 }),
    enabled: sitePopoverOpen || !!editingId,
  });

  // Fetch problems - enable when popover is open OR when editing (to populate selectedProblem)
  const { data: problemsData, isLoading: isLoadingProblems } = useQuery({
    queryKey: ['problem-master'],
    queryFn: () => problemMasterApi.getAll({ page: 1, limit: 100 }),
    enabled: problemPopoverOpen || !!editingId,
  });

  // Fetch addresses - enable when popover is open OR when editing (to populate selectedAddress)
  const { data: addressesData, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['address'],
    queryFn: () => addressApi.getAll({ page: 1, limit: 100 }),
    enabled: addressPopoverOpen || !!editingId,
  });

  // Create problem mutation
  const createProblemMutation = useMutation({
    mutationFn: (data: { problem: string }) => problemMasterApi.create(data),
    onSuccess: (newProblem) => {
      toast.success('Problem berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['problem-master'] });
      onChange({ ...formData, problem_id: newProblem.id });
      setShowNewProblemInput(false);
      setProblemSearchQuery('');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan problem', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: addressApi.create,
    onSuccess: (newAddress) => {
      toast.success('Alamat berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['address'] });
      onChange({ ...formData, address_id: newAddress.id });
      setShowNewAddressInput(false);
      setNewAddressData({ address_shipping: '', province: '', cluster: '' });
      setAddressSearchQuery('');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan alamat', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Transform sites
  const sites = useMemo(() => {
    const data = sitesData?.data;
    if (!data || !Array.isArray(data)) return [];
    
    const allSites = data
      .filter((site: unknown): site is Record<string, unknown> => {
        if (site == null || typeof site !== 'object') return false;
        const s = site as Record<string, unknown>;
        return s.siteId != null || s.site_id != null;
      })
      .map((site): Site & { pr_code?: string | null } => {
        const s = site as Record<string, unknown>;
        return {
          id: (s.id as number) || undefined,
          site_id: (s.siteId as string) || (s.site_id as string) || '',
          site_name: (s.siteName as string) || (s.site_name as string) || '',
          province: (s.province as string) || undefined,
          pr_code: (s.prCode as string) || (s.pr_code as string) || undefined,
        };
      })
      .sort((a, b) => {
        const nameA = (a.site_name || '').toLowerCase();
        const nameB = (b.site_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    
    if (!siteSearchQuery.trim()) return allSites;
    
    const searchLower = siteSearchQuery.toLowerCase().trim();
    return allSites.filter((site) => {
      const siteName = (site.site_name || '').toLowerCase();
      return siteName.includes(searchLower);
    });
  }, [sitesData, siteSearchQuery]);

  // Transform problems
  const problems = useMemo(() => {
    const data = problemsData?.data;
    if (!data || !Array.isArray(data)) return [];
    
    if (!problemSearchQuery.trim()) return data as ProblemMaster[];
    
    const searchLower = problemSearchQuery.toLowerCase().trim();
    return (data as ProblemMaster[]).filter((problem) => {
      const problemText = (problem.problem_name || '').toLowerCase();
      return problemText.includes(searchLower);
    });
  }, [problemsData, problemSearchQuery]);

  // Transform addresses
  const addresses = useMemo(() => {
    const data = addressesData?.data;
    if (!data || !Array.isArray(data)) return [];
    
    if (!addressSearchQuery.trim()) return data as Address[];
    
    const searchLower = addressSearchQuery.toLowerCase().trim();
    return (data as Address[]).filter((address) => {
      const addressText = (address.address_shipping || '').toLowerCase();
      const clusterText = (address.cluster || '').toLowerCase();
      const provinceText = (address.province || '').toLowerCase();
      return addressText.includes(searchLower) || 
             clusterText.includes(searchLower) || 
             provinceText.includes(searchLower);
    });
  }, [addressesData, addressSearchQuery]);

  const handleFileChange = (field: 'ticket_image' | 'resi_image', file: File | null) => {
    onChange({ ...formData, [field]: file });
  };

  const handleCreateProblem = () => {
    if (!formData.problem_new?.trim()) {
      toast.error('Problem baru harus diisi');
      return;
    }
    createProblemMutation.mutate({ problem: formData.problem_new });
  };

  const selectedProblem = problems.find((p) => p.id === formData.problem_id);
  const selectedAddress = addresses.find((a) => a.id === formData.address_id);

  // Sync selectedSite dengan formData saat form dibuka untuk edit
  useEffect(() => {
    if (formData.site_id && sites.length > 0) {
      const site = sites.find((s) => s.site_id === formData.site_id);
      if (site && (!selectedSite || selectedSite.site_id !== site.site_id)) {
        setSelectedSite(site);
      }
    } else if (!formData.site_id) {
      setSelectedSite(null);
    }
  }, [formData.site_id, sites, selectedSite]);

  // Get image URLs from database (for edit mode)
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseURL = import.meta.env.VITE_SHIPPING_SERVICES_URL || '';
    if (!baseURL) return null;
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    const cleanImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${cleanBaseURL}${cleanImagePath}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tanggal Kirim *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => onChange({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <Label>Site ID *</Label>
          <Popover open={sitePopoverOpen} onOpenChange={setSitePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={sitePopoverOpen}
                className="w-full justify-between"
              >
                {selectedSite
                  ? formatSiteName(selectedSite.site_name)
                  : 'Pilih site...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Cari nama site..."
                  value={siteSearchQuery}
                  onValueChange={setSiteSearchQuery}
                />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  {isLoadingSites ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Memuat...
                    </div>
                  ) : sites.length === 0 ? (
                    <CommandEmpty>Site tidak ditemukan.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {sites.map((site, index) => {
                        const uniqueKey = `site-${site.id || 'no-id'}-${site.site_id || 'no-site-id'}-${index}`;
                        const uniqueValue = `${site.site_name}-${site.site_id}`;
                        const isSelected = selectedSite?.id === site.id || selectedSite?.site_id === site.site_id;
                        
                        return (
                          <CommandItem
                            key={uniqueKey}
                            value={uniqueValue}
                            onSelect={() => {
                              setSelectedSite(site);
                              // Auto-fill PR code jika site memiliki pr_code
                              const siteWithPrCode = site as Site & { pr_code?: string | null };
                              const updatedFormData = { 
                                ...formData, 
                                site_id: site.site_id,
                                pr_code: siteWithPrCode.pr_code || formData.pr_code, // Auto-fill jika ada, atau tetap gunakan yang sudah ada
                              };
                              onChange(updatedFormData);
                              setSitePopoverOpen(false);
                              setSiteSearchQuery('');
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{formatSiteName(site.site_name) || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">
                                {site.site_id || 'N/A'}
                                {site.province && ` • ${site.province}`}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Alamat</Label>
          <Popover open={addressPopoverOpen} onOpenChange={setAddressPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={addressPopoverOpen}
                className="w-full justify-between h-auto min-h-10 py-2 px-3"
              >
                <span className="flex-1 text-left truncate mr-2">
                  {selectedAddress
                    ? `${selectedAddress.address_shipping || ''} ${selectedAddress.cluster ? `(${selectedAddress.cluster})` : ''}`
                    : 'Pilih alamat...'}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Cari alamat..."
                  value={addressSearchQuery}
                  onValueChange={setAddressSearchQuery}
                />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  {isLoadingAddresses ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Memuat...
                    </div>
                  ) : addresses.length === 0 ? (
                    <CommandEmpty>Alamat tidak ditemukan.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {addresses.map((address) => (
                        <CommandItem
                          key={address.id}
                          value={`${address.address_shipping || ''}-${address.id}`}
                          onSelect={() => {
                            onChange({ ...formData, address_id: address.id });
                            setAddressPopoverOpen(false);
                            setAddressSearchQuery('');
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{address.address_shipping || 'N/A'}</span>
                            {(address.cluster || address.province) && (
                              <span className="text-xs text-muted-foreground">
                                {address.cluster && `Cluster: ${address.cluster}`}
                                {address.cluster && address.province && ' • '}
                                {address.province && `Province: ${address.province}`}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowNewAddressInput(true);
                      setAddressPopoverOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Alamat Baru
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showNewAddressInput && (
        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Tambah Alamat Baru</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNewAddressInput(false);
                  setNewAddressData({ address_shipping: '', province: '', cluster: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Alamat Lengkap *</Label>
                <Textarea
                  placeholder="Masukkan alamat lengkap..."
                  value={newAddressData.address_shipping}
                  onChange={(e) => setNewAddressData({ ...newAddressData, address_shipping: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Province</Label>
                  <Select
                    value={newAddressData.province}
                    onValueChange={(value) => setNewAddressData({ ...newAddressData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cluster</Label>
                  <Input
                    placeholder="Cluster"
                    value={newAddressData.cluster}
                    onChange={(e) => setNewAddressData({ ...newAddressData, cluster: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newAddressData.address_shipping.trim()) {
                      toast.error('Alamat lengkap harus diisi');
                      return;
                    }
                    createAddressMutation.mutate(newAddressData);
                  }}
                  disabled={createAddressMutation.isPending}
                >
                  {createAddressMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewAddressInput(false);
                    setNewAddressData({ address_shipping: '', province: '', cluster: '' });
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Kode PR</Label>
          <Input
            value={formData.pr_code || ''}
            onChange={(e) => onChange({ ...formData, pr_code: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <Label>Problem</Label>
        <Popover open={problemPopoverOpen} onOpenChange={setProblemPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={problemPopoverOpen}
              className="w-full justify-between"
            >
              {selectedProblem
                ? selectedProblem.problem_name || 'Pilih problem...'
                : 'Pilih problem...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Cari problem..."
                value={problemSearchQuery}
                onValueChange={setProblemSearchQuery}
              />
              <CommandList className="max-h-[300px] overflow-y-auto">
                {isLoadingProblems ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Memuat...
                  </div>
                ) : (
                  <>
                    <CommandGroup>
                      {problems.length === 0 ? (
                        <CommandEmpty>Problem tidak ditemukan.</CommandEmpty>
                      ) : (
                        problems.map((problem) => (
                          <CommandItem
                            key={problem.id}
                            value={`${problem.problem_name || ''}-${problem.id}`}
                            onSelect={() => {
                              onChange({ ...formData, problem_id: problem.id, problem_new: '' });
                              setProblemPopoverOpen(false);
                              setProblemSearchQuery('');
                              setShowNewProblemInput(false);
                            }}
                          >
                            {problem.problem_name || 'N/A'}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setShowNewProblemInput(true);
                          setProblemPopoverOpen(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Problem Baru
                      </Button>
                    </div>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {showNewProblemInput && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Masukkan problem baru..."
              value={formData.problem_new || ''}
              onChange={(e) => onChange({ ...formData, problem_new: e.target.value, problem_id: undefined })}
            />
            <Button
              size="sm"
              onClick={handleCreateProblem}
              disabled={createProblemMutation.isPending}
            >
              Simpan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowNewProblemInput(false);
                onChange({ ...formData, problem_new: '' });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label>Sparepart Note</Label>
        <Textarea
          value={formData.sparepart_note || ''}
          onChange={(e) => onChange({ ...formData, sparepart_note: e.target.value })}
          placeholder="Catatan sparepart"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ticket Number</Label>
          <Input
            value={formData.ticket_number || ''}
            onChange={(e) => onChange({ ...formData, ticket_number: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label>Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'request gudang' | 'proses kirim' | 'selesai') =>
              onChange({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="request gudang">Request Gudang</SelectItem>
              <SelectItem value="proses kirim">Proses Kirim</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resi Number - required for "proses kirim" and "selesai", optional for "request gudang" */}
      {(formData.status === 'proses kirim' || formData.status === 'selesai' || formData.resi_number || editingId) && (
        <div>
          <Label>
            Resi Number {formData.status === 'proses kirim' || formData.status === 'selesai' ? '*' : ''}
          </Label>
          <Input
            value={formData.resi_number || ''}
            onChange={(e) => onChange({ ...formData, resi_number: e.target.value })}
            placeholder="Masukkan nomor resi"
            required={formData.status === 'proses kirim' || formData.status === 'selesai'}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.status === 'proses kirim' || formData.status === 'selesai'
              ? 'Resi number wajib diisi untuk status "Proses Kirim" dan "Selesai"'
              : 'Resi number (opsional untuk status "Request Gudang")'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ticket Image</Label>
          <div className="mt-2 space-y-2">
            {/* Preview existing image from database */}
            {existingTicketImage && !formData.ticket_image && (
              <div className="relative">
                <img
                  src={getImageUrl(existingTicketImage) || ''}
                  alt="Existing Ticket"
                  className="w-full h-auto max-h-48 rounded-lg border object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">Gambar saat ini</p>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange('ticket_image', file);
              }}
            />
            {formData.ticket_image && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  File baru: {formData.ticket_image.name}
                </p>
                {existingTicketImage && (
                  <p className="text-xs text-muted-foreground">
                    (Gambar lama akan diganti)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label>Resi Image</Label>
          <div className="mt-2 space-y-2">
            {/* Preview existing image from database */}
            {existingResiImage && !formData.resi_image && (
              <div className="relative">
                <img
                  src={getImageUrl(existingResiImage) || ''}
                  alt="Existing Resi"
                  className="w-full h-auto max-h-48 rounded-lg border object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">Gambar saat ini</p>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange('resi_image', file);
              }}
            />
            {formData.resi_image && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  File baru: {formData.resi_image.name}
                </p>
                {existingResiImage && (
                  <p className="text-xs text-muted-foreground">
                    (Gambar lama akan diganti)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button onClick={() => onSubmit(formData)} disabled={isSubmitting}>
          {editingId ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </div>
  );
};

