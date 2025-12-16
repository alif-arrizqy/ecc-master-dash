/**
 * Sites Management Page
 * Main page component for managing sites
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Loading } from '@/components/ui/loading';
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

// Local imports
import { Site, SiteFormData, SiteQueryParams } from './types';
import { ITEMS_PER_PAGE } from './constants';
import { useSitesQuery, useCreateSite, useUpdateSite, useDeleteSite, useSiteStatistics } from './hooks';
import { SiteFilters } from './components/SiteFilters';
import { SiteTable } from './components/SiteTable';
import { Pagination } from './components/Pagination';
import { SiteForm } from './components/SiteForm';
import { SiteStatistics } from './components/SiteStatistics';
import { SiteDetailsDialog } from './components/SiteDetailsDialog';

const SitesPage = () => {
  // State management
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
  const [formData, setFormData] = useState<SiteFormData>({
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

  // Query params - build query object, filtering out undefined/empty values
  const queryParams: SiteQueryParams = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sortBy: 'siteName',
    sortOrder: 'asc',
  };

  // Add search if provided
  if (searchTerm && searchTerm.trim()) {
    queryParams.search = searchTerm.trim();
  }

  // Add filters only if not 'all'
  if (statusFilter !== 'all' && statusFilter) {
    queryParams.status = statusFilter;
  }

  if (sccTypeFilter !== 'all' && sccTypeFilter) {
    queryParams.sccType = sccTypeFilter;
  }

  if (batteryVersionFilter !== 'all' && batteryVersionFilter) {
    queryParams.batteryVersion = batteryVersionFilter;
  }

  // Normalize province to lowercase to match API expectations (papua/maluku)
  if (provinceFilter !== 'all' && provinceFilter) {
    queryParams.province = provinceFilter.toLowerCase();
  }

  // Data fetching
  const { data, isLoading, error } = useSitesQuery(queryParams);
  const { data: statisticsData, isLoading: isLoadingStats, error: statisticsError } = useSiteStatistics();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const deleteMutation = useDeleteSite();

  // Handlers
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
      updateMutation.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSite) {
      deleteMutation.mutate(selectedSite.siteId, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
        },
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filter: string, value: string) => {
    setCurrentPage(1);
    switch (filter) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'sccType':
        setSccTypeFilter(value);
        break;
      case 'batteryVersion':
        setBatteryVersionFilter(value);
        break;
      case 'province':
        setProvinceFilter(value);
        break;
    }
  };

  // Process data
  let sites: Site[] = [];
  if (data) {
    if (Array.isArray(data.data)) {
      sites = data.data as Site[];
    } else if (Array.isArray(data)) {
      sites = data as Site[];
    }
  }

  const pagination =
    data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 };

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
                  <DialogDescription>Masukkan detail site</DialogDescription>
                </DialogHeader>
                <SiteForm
                  formData={formData}
                  editingId={editingId}
                  isSubmitting={createMutation.isPending || updateMutation.isPending}
                  onChange={setFormData}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? 'Update' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="mb-8">
          <SiteStatistics
            data={statisticsData}
            isLoading={isLoadingStats}
            error={statisticsError}
          />
        </div>

        {/* Search and Filters */}
        <SiteFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sccTypeFilter={sccTypeFilter}
          batteryVersionFilter={batteryVersionFilter}
          provinceFilter={provinceFilter}
          onSearchChange={(value) => handleFilterChange('search', value)}
          onStatusChange={(value) => handleFilterChange('status', value)}
          onSccTypeChange={(value) => handleFilterChange('sccType', value)}
          onBatteryVersionChange={(value) => handleFilterChange('batteryVersion', value)}
          onProvinceChange={(value) => handleFilterChange('province', value)}
        />

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
                      <SiteTable
                        sites={sites}
                        onView={setViewingDetails}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Details Dialog */}
      <SiteDetailsDialog
        site={viewingDetails}
        open={!!viewingDetails}
        onOpenChange={(open) => !open && setViewingDetails(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Site</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus site "{selectedSite?.siteName}" (
              {selectedSite?.siteId})? Tindakan ini tidak dapat dibatalkan.
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
