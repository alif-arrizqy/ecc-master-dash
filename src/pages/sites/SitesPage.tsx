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
const BATTERY_VERSIONS: { value: BatteryVersion; label: string }[] = [
  { value: 'talis5', label: 'Talis5 Full' },
  { value: 'mix', label: 'Talis5 Mix' },
  { value: 'jspro', label: 'JS PRO' },
];

interface Site {
  id: number;
  site_id: string;
  site_name: string;
  province: string;
  ip_snmp?: string;
  scc_type?: string;
  battery_version?: string;
  total_battery?: number;
  talis_installed?: string;
  status?: string;
  webapp_url?: string;
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
    site_id: '',
    site_name: '',
    province: '',
    ip_snmp: '',
    scc_type: '',
    battery_version: '',
    total_battery: undefined,
    talis_installed: '',
    status: '',
    webapp_url: '',
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
  };

  const { data, isLoading } = useQuery({
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
      site_id: '',
      site_name: '',
      province: '',
      ip_snmp: '',
      scc_type: '',
      battery_version: '',
      total_battery: undefined,
      talis_installed: '',
      status: '',
      webapp_url: '',
    });
    setEditingId(null);
    setSelectedSite(null);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.id);
    setFormData({
      site_id: site.site_id,
      site_name: site.site_name,
      province: site.province,
      ip_snmp: site.ip_snmp || '',
      scc_type: site.scc_type || '',
      battery_version: site.battery_version || '',
      total_battery: site.total_battery,
      talis_installed: site.talis_installed || '',
      status: site.status || '',
      webapp_url: site.webapp_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (site: Site) => {
    setSelectedSite(site);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.site_id || !formData.site_name || !formData.province) {
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
      deleteMutation.mutate(selectedSite.id);
    }
  };

  const sites = data?.data || [];
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
                        value={formData.site_id}
                        onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                        placeholder="PAP9999"
                        disabled={!!editingId}
                      />
                    </div>
                    <div>
                      <Label>Site Name *</Label>
                      <Input
                        value={formData.site_name}
                        onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                        placeholder="Site Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Province *</Label>
                      <Select
                        value={formData.province}
                        onValueChange={(value) => setFormData({ ...formData, province: value })}
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
                        value={formData.status || ''}
                        onValueChange={(value) => setFormData({ ...formData, status: value || undefined })}
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
                        value={formData.ip_snmp}
                        onChange={(e) => setFormData({ ...formData, ip_snmp: e.target.value })}
                        placeholder="192.168.1.1"
                      />
                    </div>
                    <div>
                      <Label>SCC Type</Label>
                      <Select
                        value={formData.scc_type || ''}
                        onValueChange={(value) => setFormData({ ...formData, scc_type: value || undefined })}
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
                        value={formData.battery_version || ''}
                        onValueChange={(value) => setFormData({ ...formData, battery_version: value || undefined })}
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
                        value={formData.total_battery || ''}
                        onChange={(e) => setFormData({ ...formData, total_battery: e.target.value ? parseInt(e.target.value) : undefined })}
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
                        value={formData.talis_installed 
                          ? (formData.talis_installed.includes('T') 
                              ? formData.talis_installed.split('T')[0] 
                              : formData.talis_installed.length === 10 
                                ? formData.talis_installed 
                                : format(new Date(formData.talis_installed), 'yyyy-MM-dd'))
                          : ''}
                        onChange={(e) => setFormData({ ...formData, talis_installed: e.target.value || undefined })}
                      />
                    </div>
                    <div>
                      <Label>Webapp URL</Label>
                      <Input
                        type="url"
                        value={formData.webapp_url}
                        onChange={(e) => setFormData({ ...formData, webapp_url: e.target.value })}
                        placeholder="https://..."
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
                          <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.site_id}</TableCell>
                            <TableCell>{site.site_name}</TableCell>
                            <TableCell>{site.province}</TableCell>
                            <TableCell>{site.ip_snmp || '-'}</TableCell>
                            <TableCell>
                              {site.scc_type ? (
                                <Badge variant="outline">{site.scc_type}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {site.battery_version ? (
                                <Badge variant="outline">
                                  {BATTERY_VERSIONS.find(bv => bv.value === site.battery_version)?.label || site.battery_version}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>{site.total_battery ?? '-'}</TableCell>
                            <TableCell>
                              {site.talis_installed
                                ? (() => {
                                    try {
                                      const date = site.talis_installed.includes('T') 
                                        ? new Date(site.talis_installed) 
                                        : new Date(site.talis_installed + 'T00:00:00');
                                      return format(date, 'dd/MM/yyyy');
                                    } catch {
                                      return site.talis_installed;
                                    }
                                  })()
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {site.status ? (
                                <Badge variant={site.status === 'terestrial' ? 'default' : 'secondary'}>
                                  {STATUS_OPTIONS.find(s => s.value === site.status)?.label || site.status}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {site.webapp_url ? (
                                <a
                                  href={site.webapp_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  {site.webapp_url.length > 30 ? `${site.webapp_url.substring(0, 30)}...` : site.webapp_url}
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
              Detail lengkap untuk site {viewingDetails?.site_id}
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
              Apakah Anda yakin ingin menghapus site "{selectedSite?.site_name}" ({selectedSite?.site_id})?
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

