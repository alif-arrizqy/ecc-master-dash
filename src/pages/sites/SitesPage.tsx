import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Edit, Trash2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { slaApi, BatteryVersion } from '@/lib/api';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PROVINCES = ['Maluku', 'Papua'];
const STATUS_OPTIONS = [
  { value: 'terestrial', label: 'Terestrial' },
  { value: 'non_terestrial', label: 'Non Terestrial' },
];
const SCC_TYPES = [
  { value: 'scc_srne', label: 'SCC SRNE' },
  { value: 'scc_epever', label: 'SCC EPEVER' },
];

// Helper function to format SCC type
const formatSccType = (sccType?: string) => {
  if (!sccType) return '-';
  return sccType.toUpperCase().replace(/_/g, ' ');
};

// Helper function to format site name
const formatSiteName = (siteName?: string) => {
  if (!siteName) return '-';
  return siteName.toUpperCase().replace(/_/g, ' ');
};

const BATTERY_VERSIONS: { value: BatteryVersion; label: string }[] = [
  { value: 'talis5', label: 'Talis5 Full' },
  { value: 'mix', label: 'Talis5 Mix' },
  { value: 'jspro', label: 'JS PRO' },
];

interface Site {
  prCode?: string | null;
  siteId: string;
  clusterId?: string | null;
  terminalId?: string;
  siteName: string;
  ipSite?: string | null;
  ipSnmp?: string | null;
  ipMiniPc?: string | null;
  webappUrl?: string;
  ehubVersion?: string;
  panel2Type?: string;
  sccType?: string;
  batteryVersion?: string;
  totalBattery?: number;
  statusSites?: string;
  isActive?: boolean;
  detail?: {
    village?: string | null;
    subdistrict?: string | null;
    regency?: string | null;
    province?: string;
    longitude?: string;
    latitude?: string;
    ipGatewayGs?: string | null;
    ipGatewayLc?: string | null;
    subnet?: string;
    batteryList?: unknown[];
    cabinetList?: unknown[];
    buildYear?: string;
    projectPhase?: string;
    onairDate?: string | null;
    gsSustainDate?: string | null;
    topoSustainDate?: string | null;
    talisInstalled?: string | null;
    providerGs?: string;
    beamProvider?: string;
    cellularOperator?: string;
    contactPerson?: Array<{ name: string; phone: string | null }>;
  };
  [key: string]: unknown;
}

const SitesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sccTypeFilter, setSccTypeFilter] = useState<string>('all');
  const [batteryVersionFilter, setBatteryVersionFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [viewingDetails, setViewingDetails] = useState<Site | null>(null);
  const [formData, setFormData] = useState<Partial<Site>>({
    siteId: '',
    siteName: '',
    ipSnmp: '',
    sccType: '',
    batteryVersion: '',
    totalBattery: undefined,
    statusSites: '',
    webappUrl: '',
    detail: {
      province: '',
      talisInstalled: '',
    },
  });
  const queryClient = useQueryClient();
  const ITEMS_PER_PAGE = 20;

  const queryParams = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    siteName: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sccType: sccTypeFilter !== 'all' ? sccTypeFilter : undefined,
    batteryVersion: batteryVersionFilter !== 'all' ? batteryVersionFilter : undefined,
    province: provinceFilter !== 'all' ? provinceFilter : undefined,
    sortOrder: 'asc',
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['sites', queryParams],
    queryFn: () => slaApi.getSites(queryParams),
  });

  const createMutation = useMutation({
    mutationFn: slaApi.createSite,
    onSuccess: () => {
      toast.success('Site berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal membuat site', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Site> }) => slaApi.updateSite(id, data),
    onSuccess: () => {
      toast.success('Site berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal mengupdate site', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: slaApi.deleteSite,
    onSuccess: () => {
      toast.success('Site berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Gagal menghapus site', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      siteId: '',
      siteName: '',
      ipSnmp: '',
      sccType: '',
      batteryVersion: '',
      totalBattery: undefined,
      statusSites: '',
      webappUrl: '',
      detail: {
        province: '',
        talisInstalled: '',
      },
    });
    setEditingId(null);
    setSelectedSite(null);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.siteId);
    setFormData({
      siteId: site.siteId,
      siteName: site.siteName,
      ipSnmp: site.ipSnmp || '',
      sccType: site.sccType || '',
      batteryVersion: site.batteryVersion || '',
      totalBattery: site.totalBattery,
      statusSites: site.statusSites || '',
      webappUrl: site.webappUrl || '',
      detail: {
        province: site.detail?.province || '',
        talisInstalled: site.detail?.talisInstalled || '',
      },
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (site: Site) => {
    setSelectedSite(site);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.siteId || !formData.siteName || !formData.detail?.province) {
      toast.error('Site ID, Site Name, dan Province wajib diisi');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData as Site);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSite) {
      deleteMutation.mutate(selectedSite.siteId);
    }
  };

  // Ensure sites is always an array
  // Handle different possible response structures
  let sites: Site[] = [];
  if (data) {
    if (Array.isArray(data.data)) {
      sites = data.data as Site[];
    } else if (Array.isArray(data)) {
      sites = data as Site[];
    }
  }
  
  const pagination = data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Sites Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Kelola data sites dengan filter dan pencarian lengkap
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Site
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Tambah'} Site</DialogTitle>
                  <DialogDescription>
                    Masukkan detail site
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Site ID *</Label>
                      <Input
                        value={formData.siteId || ''}
                        onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                        placeholder="PAP9999"
                        disabled={!!editingId}
                      />
                    </div>
                    <div>
                      <Label>Site Name *</Label>
                      <Input
                        value={formData.siteName?.toUpperCase() || ''}
                        onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                        placeholder="Site Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Province *</Label>
                      <Select
                        value={formData.detail?.province || ''}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          detail: { ...formData.detail, province: value } 
                        })}
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
                        onValueChange={(value) => setFormData({ ...formData, statusSites: value || undefined })}
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
                        onChange={(e) => setFormData({ ...formData, ipSnmp: e.target.value })}
                        placeholder="192.168.1.1"
                      />
                    </div>
                    <div>
                      <Label>SCC Type</Label>
                      <Select
                        value={formData.sccType || ''}
                        onValueChange={(value) => setFormData({ ...formData, sccType: value || undefined })}
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
                        onValueChange={(value) => setFormData({ ...formData, batteryVersion: value || undefined })}
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
                        onChange={(e) => setFormData({ ...formData, totalBattery: e.target.value ? parseInt(e.target.value) : undefined })}
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
                        value={formData.detail?.talisInstalled 
                          ? (formData.detail.talisInstalled.includes('T') 
                              ? formData.detail.talisInstalled.split('T')[0] 
                              : formData.detail.talisInstalled.length === 10 
                                ? formData.detail.talisInstalled 
                                : format(new Date(formData.detail.talisInstalled), 'yyyy-MM-dd'))
                          : ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          detail: { ...formData.detail, talisInstalled: e.target.value || undefined } 
                        })}
                      />
                    </div>
                    <div>
                      <Label>Webapp URL</Label>
                      <Input
                        type="text"
                        value={formData.webappUrl || ''}
                        onChange={(e) => setFormData({ ...formData, webappUrl: e.target.value })}
                        placeholder="site-name.sundaya.local"
                      />
                    </div>
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

        {/* Search and Filters */}
        <Card className="mb-6 card-shadow animate-slide-up">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari site name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
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
              <Select
                value={sccTypeFilter}
                onValueChange={(value) => {
                  setSccTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
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
              <Select
                value={batteryVersionFilter}
                onValueChange={(value) => {
                  setBatteryVersionFilter(value);
                  setCurrentPage(1);
                }}
              >
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
              <Select
                value={provinceFilter}
                onValueChange={(value) => {
                  setProvinceFilter(value);
                  setCurrentPage(1);
                }}
              >
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

        {/* Data Table */}
        <Card className="card-shadow animate-slide-up">
          <CardHeader>
            <CardTitle>Daftar Sites</CardTitle>
            <CardDescription>
              {isLoading ? 'Memuat data...' : `${pagination.total} site ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <p className="font-semibold">Error memuat data sites</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Site ID</TableHead>
                        <TableHead>Site Name</TableHead>
                        <TableHead>Province</TableHead>
                        <TableHead>IP SNMP</TableHead>
                        <TableHead>SCC Type</TableHead>
                        <TableHead>Battery Version</TableHead>
                        <TableHead>Total Battery</TableHead>
                        <TableHead>Talis Installed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Webapp URL</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                            Tidak ada data
                          </TableCell>
                        </TableRow>
                      ) : (
                        sites.map((site) => (
                          <TableRow key={site.siteId}>
                            <TableCell className="font-medium">{site.siteId}</TableCell>
                            <TableCell>{formatSiteName(site.siteName)}</TableCell>
                            <TableCell>{site.detail?.province || '-'}</TableCell>
                            <TableCell>{site.ipSnmp || '-'}</TableCell>
                            <TableCell>
                              {site.sccType ? (
                                <Badge variant="outline">{formatSccType(site.sccType)}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {site.batteryVersion ? (
                                <Badge variant="outline">
                                  {BATTERY_VERSIONS.find(bv => bv.value === site.batteryVersion)?.label || site.batteryVersion}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>{site.totalBattery ?? '-'}</TableCell>
                            <TableCell>
                              {site.detail?.talisInstalled
                                ? (() => {
                                    try {
                                      const date = site.detail.talisInstalled.includes('T') 
                                        ? new Date(site.detail.talisInstalled) 
                                        : new Date(site.detail.talisInstalled + 'T00:00:00');
                                      return format(date, 'dd/MM/yyyy');
                                    } catch {
                                      return site.detail.talisInstalled;
                                    }
                                  })()
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {site.statusSites ? (
                                <Badge variant={site.statusSites === 'terestrial' ? 'default' : 'secondary'}>
                                  {STATUS_OPTIONS.find(s => s.value === site.statusSites)?.label || site.statusSites}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {site.webappUrl ? (
                                <a 
                                  href={`http://${site.webappUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  {site.webappUrl.length > 30 ? `${site.webappUrl.substring(0, 30)}...` : site.webappUrl}
                                </a>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingDetails(site)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(site)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(site)}
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
                {pagination.totalPages > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} site)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
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
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={currentPage === pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Details Dialog */}
      <Dialog open={!!viewingDetails} onOpenChange={(open) => !open && setViewingDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Details</DialogTitle>
            <DialogDescription>
              Detail lengkap untuk site {viewingDetails?.siteId}
            </DialogDescription>
          </DialogHeader>
          {viewingDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(viewingDetails).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{key}</Label>
                    <p className="text-sm font-medium mt-1">
                      {value === null || value === undefined
                        ? '-'
                        : typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Site</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus site "{selectedSite?.siteName}" ({selectedSite?.siteId})?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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

export default SitesPage;

