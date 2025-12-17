import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Plus, Edit, Trash2, Search, Calendar, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { slaApi } from '@/lib/api';
import { format } from 'date-fns';
import { getProblemDateRange } from '@/lib/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/loading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

interface Site {
  id?: number;
  site_id: string;
  site_name: string;
  province?: string;
}

interface SLAProblemItem {
  id: number;
  date: string;
  siteId: string;
  prCode?: string | null;
  problems: Array<{
    id?: number;
    pic?: string | null;
    problem?: string | null;
    notes?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface UpdateSLAProblemData {
  date?: string;
  siteId?: string;
  prCode?: string | null;
  problems?: Array<{
    pic?: string | null;
    problem?: string | null;
    notes?: string | null;
  }>;
}

/**
 * Format site name: uppercase dan replace underscore dengan spasi
 */
const formatSiteName = (siteName: string | null | undefined): string => {
  if (!siteName) return '';
  return siteName.toUpperCase().replace(/_/g, ' ');
};

const ProblemPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [sitePopoverOpen, setSitePopoverOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const ITEMS_PER_PAGE = 20;
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    siteId: '',
    prCode: '',
    problems: [{ pic: '', problem: '', notes: '' }],
  });
  const queryClient = useQueryClient();
  const { startDate, endDate } = getProblemDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['sla-problems', startDate, endDate],
    queryFn: () => slaApi.getSLAProblems({ startDate, endDate, limit: 100 }),
  });

  // Fetch all sites data untuk mapping siteId ke siteName
  const { data: allSitesData } = useQuery({
    queryKey: ['all-sites'],
    queryFn: () => slaApi.getSites({ page: 1, limit: 100 }),
  });

  // Create site name mapping untuk table display
  const siteNameMap = useMemo(() => {
    if (!allSitesData?.data || !Array.isArray(allSitesData.data)) {
      return new Map<string, string>();
    }
    const map = new Map<string, string>();
    allSitesData.data.forEach((site: unknown) => {
      if (site != null && typeof site === 'object') {
        const s = site as Record<string, unknown>;
        const siteId = (s.siteId as string) || (s.site_id as string);
        const siteName = (s.siteName as string) || (s.site_name as string) || (s.name as string);
        if (siteId && siteName) {
          map.set(siteId, siteName);
        }
      }
    });
    return map;
  }, [allSitesData]);

  /**
   * Fetch sites data - hanya di-fetch sekali saat dropdown dibuka
   * Pencarian dilakukan di client-side tanpa API call tambahan
   */
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => slaApi.getSites({
      page: 1,
      limit: 100, // Fetch sites untuk client-side filtering
    }),
    enabled: sitePopoverOpen, // Hanya fetch saat dropdown dibuka
  });

  /**
   * Transform dan filter sites data
   * - Transform API response (camelCase: siteName, siteId) ke interface kita
   * - Sort ascending berdasarkan site_name
   * - Filter client-side berdasarkan search query (case-insensitive)
   */
  const sites = useMemo(() => {
    const data = sitesData?.data;
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    // Transform API response ke interface Site
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
          site_name: (s.siteName as string) || (s.site_name as string) || (s.name as string) || '',
          province: (s.province as string) || undefined,
        };
      })
      // Sort ascending berdasarkan site_name (case-insensitive)
      .sort((a, b) => {
        const nameA = (a.site_name || '').toLowerCase();
        const nameB = (b.site_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    
    // Client-side filtering: pencarian berdasarkan site name saja (case-insensitive)
    // Tidak perlu API call tambahan, gunakan data yang sudah di-fetch
    if (!siteSearchQuery.trim()) {
      return allSites;
    }
    
    const searchLower = siteSearchQuery.toLowerCase().trim();
    return allSites.filter((site) => {
      const siteName = (site.site_name || '').toLowerCase();
      return siteName.includes(searchLower);
    });
  }, [sitesData, siteSearchQuery]);

  const createMutation = useMutation({
    mutationFn: slaApi.createSLAProblem,
    onSuccess: () => {
      toast.success('SLA Problem berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['sla-problems'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal membuat SLA Problem', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSLAProblemData }) => slaApi.updateSLAProblem(id, data),
    onSuccess: () => {
      toast.success('SLA Problem berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['sla-problems'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isCorsError = errorMessage.includes('CORS');
      
      toast.error('Gagal mengupdate SLA Problem', {
        description: isCorsError 
          ? 'Error CORS: Backend belum mengkonfigurasi method PATCH. Silakan hubungi administrator.'
          : errorMessage,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: slaApi.deleteSLAProblem,
    onSuccess: () => {
      toast.success('SLA Problem berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['sla-problems'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus SLA Problem', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      siteId: '',
      prCode: '',
      problems: [{ pic: '', problem: '', notes: '' }],
    });
    setSelectedSite(null);
    setSiteSearchQuery('');
    setEditingId(null);
  };

  const handleEdit = async (item: SLAProblemItem) => {
    setEditingId(item.id);
    setFormData({
      date: item.date,
      siteId: item.siteId,
      prCode: item.prCode || '',
      problems: item.problems.length > 0 
        ? item.problems.map(p => ({ 
            pic: p.pic || '', 
            problem: p.problem || '', 
            notes: p.notes || '' 
          }))
        : [{ pic: '', problem: '', notes: '' }],
    });
    
    // Try to fetch and set the site info for display
    try {
      const sitesResult = await slaApi.getSites({ siteId: item.siteId, limit: 1 });
      if (sitesResult?.data && sitesResult.data.length > 0) {
        setSelectedSite(sitesResult.data[0] as Site);
      }
    } catch (error) {
      // If site not found, just leave selectedSite as null
      setSelectedSite(null);
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.date) { toast.error('Date harus diisi'); return; }
    if (!formData.siteId) { toast.error('Site Name harus diisi'); return; }
    if (!formData.problems.some(p => p.pic)) { toast.error('PIC harus diisi'); return; }
    if (!formData.problems.some(p => p.problem)) { toast.error('Problem harus diisi'); return; }

    const submitData = {
      date: formData.date,
      siteId: formData.siteId,
      prCode: formData.prCode || null,
      problems: formData.problems.map(p => ({
        pic: p.pic || null,
        problem: p.problem || null,
        notes: p.notes || null,
      })),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    const allData = data?.data || [];
    if (!searchTerm.trim()) {
      return allData;
    }
    const searchLower = searchTerm.toLowerCase();
    return allData.filter((item) => {
      const siteId = item.siteId?.toLowerCase() || '';
      const siteName = siteNameMap.get(item.siteId)?.toLowerCase() || '';
      const prCode = item.prCode?.toLowerCase() || '';
      return siteId.includes(searchLower) || siteName.includes(searchLower) || prCode.includes(searchLower);
    });
  }, [data, searchTerm, siteNameMap]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SLA Problem
                </h1>
                <p className="text-muted-foreground mt-1">
                  Kelola problem yang terjadi di site
                </p>
              </div>
            </div>
            <Dialog 
              open={isDialogOpen} 
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setSiteSearchQuery('');
                  setSitePopoverOpen(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Tambah'} SLA Problem</DialogTitle>
                  <DialogDescription>
                    Masukkan detail problem yang terjadi di site
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Site Name *</Label>
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
                              : "Pilih site..."}
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
                            <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                              {isLoadingSites ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Memuat...
                                </div>
                              ) : sites.length === 0 ? (
                                <CommandEmpty>Site tidak ditemukan.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {Array.isArray(sites) && sites.map((site, index) => {
                                    if (!site) return null;
                                    
                                    // Ensure unique key untuk React list rendering
                                    const uniqueKey = `site-${site.id || 'no-id'}-${site.site_id || 'no-site-id'}-${index}`;
                                    // Value untuk Command component (digunakan untuk internal filtering, tapi kita disable dengan shouldFilter={false})
                                    const uniqueValue = `${site.site_name}-${site.site_id}`;
                                    const isSelected = selectedSite?.id === site.id || selectedSite?.site_id === site.site_id;
                                    
                                    return (
                                      <CommandItem
                                        key={uniqueKey}
                                        value={uniqueValue}
                                        onSelect={() => {
                                          setSelectedSite(site);
                                          setFormData({ ...formData, siteId: site.site_id });
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
                  <div>
                    <Label>PR Code</Label>
                    <Input
                      value={formData.prCode}
                      onChange={(e) => setFormData({ ...formData, prCode: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Problems</Label>
                    {formData.problems.map((problem, idx) => (
                      <div key={idx} className="border rounded-lg p-4 mb-2 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>PIC</Label>
                            <Select
                              value={problem.pic}
                              onValueChange={(value) => {
                                const newProblems = [...formData.problems];
                                newProblems[idx].pic = value;
                                setFormData({ ...formData, problems: newProblems });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih PIC" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VSAT">VSAT</SelectItem>
                                <SelectItem value="POWER">POWER</SelectItem>
                                <SelectItem value="SNMP">SNMP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label>Problem</Label>
                            <Input
                              value={problem.problem}
                              onChange={(e) => {
                                const newProblems = [...formData.problems];
                                newProblems[idx].problem = e.target.value;
                                setFormData({ ...formData, problems: newProblems });
                              }}
                              placeholder="Deskripsi problem"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            value={problem.notes}
                            onChange={(e) => {
                              const newProblems = [...formData.problems];
                              newProblems[idx].notes = e.target.value;
                              setFormData({ ...formData, problems: newProblems });
                            }}
                            placeholder="Catatan tambahan"
                          />
                        </div>
                        {formData.problems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newProblems = formData.problems.filter((_, i) => i !== idx);
                              setFormData({ ...formData, problems: newProblems });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus Problem
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          problems: [...formData.problems, { pic: '', problem: '', notes: '' }],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Problem
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? 'Update' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 card-shadow animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari Site ID, Site Name, atau PR Code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="card-shadow animate-slide-up">
          <CardHeader>
            <CardTitle>Daftar SLA Problem</CardTitle>
            <CardDescription>
              {isLoading ? 'Memuat data...' : `${filteredData.length} problem ditemukan${totalPages > 1 ? ` (Halaman ${currentPage} dari ${totalPages})` : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Site ID</TableHead>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Problems</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-medium">{item.siteId}</TableCell>
                          <TableCell>{formatSiteName(siteNameMap.get(item.siteId)) || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.problems.map((p, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded text-xs bg-primary/10 text-primary"
                                >
                                  {p.pic || 'N/A'}: {p.problem || '-'}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ECC Master Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProblemPage;

