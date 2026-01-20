/**
 * Shipping Spare Part Form Component
 * Form untuk create dan update shipping spare part
 */

import { useState, useMemo } from 'react';
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
}: ShippingSparePartFormProps) => {
  const [sitePopoverOpen, setSitePopoverOpen] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [problemPopoverOpen, setProblemPopoverOpen] = useState(false);
  const [problemSearchQuery, setProblemSearchQuery] = useState('');
  const [showNewProblemInput, setShowNewProblemInput] = useState(false);
  const [addressPopoverOpen, setAddressPopoverOpen] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch sites
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesApi.getSites({ page: 1, limit: 100 }),
    enabled: sitePopoverOpen,
  });

  // Fetch problems
  const { data: problemsData, isLoading: isLoadingProblems } = useQuery({
    queryKey: ['problem-master'],
    queryFn: () => problemMasterApi.getAll({ page: 1, limit: 100 }),
    enabled: problemPopoverOpen,
  });

  // Fetch addresses
  const { data: addressesData, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['address'],
    queryFn: () => addressApi.getAll({ page: 1, limit: 100 }),
    enabled: addressPopoverOpen,
  });

  // Create problem mutation
  const createProblemMutation = useMutation({
    mutationFn: problemMasterApi.create,
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
      .map((site): Site => {
        const s = site as Record<string, unknown>;
        return {
          id: (s.id as number) || undefined,
          site_id: (s.siteId as string) || (s.site_id as string) || '',
          site_name: (s.siteName as string) || (s.site_name as string) || '',
          province: (s.province as string) || undefined,
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
      const problemText = (problem.problem || '').toLowerCase();
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
      const addressText = (address.address || '').toLowerCase();
      return addressText.includes(searchLower);
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
                              onChange({ ...formData, site_id: site.site_id });
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
        <div>
          <Label>Alamat</Label>
          <Popover open={addressPopoverOpen} onOpenChange={setAddressPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={addressPopoverOpen}
                className="w-full justify-between"
              >
                {selectedAddress
                  ? `${selectedAddress.address || ''} ${selectedAddress.cluster ? `(${selectedAddress.cluster})` : ''}`
                  : 'Pilih alamat...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                          value={`${address.address}-${address.id}`}
                          onSelect={() => {
                            onChange({ ...formData, address_id: address.id });
                            setAddressPopoverOpen(false);
                            setAddressSearchQuery('');
                          }}
                        >
                          {address.address || 'N/A'}
                          {address.cluster && ` (${address.cluster})`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
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
                ? selectedProblem.problem || 'Pilih problem...'
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
                            value={`${problem.problem}-${problem.id}`}
                            onSelect={() => {
                              onChange({ ...formData, problem_id: problem.id, problem_new: '' });
                              setProblemPopoverOpen(false);
                              setProblemSearchQuery('');
                              setShowNewProblemInput(false);
                            }}
                          >
                            {problem.problem || 'N/A'}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ticket Image</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange('ticket_image', file);
              }}
            />
            {formData.ticket_image && (
              <p className="text-sm text-muted-foreground mt-1">
                {formData.ticket_image.name}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label>Resi Image</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange('resi_image', file);
              }}
            />
            {formData.resi_image && (
              <p className="text-sm text-muted-foreground mt-1">
                {formData.resi_image.name}
              </p>
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

