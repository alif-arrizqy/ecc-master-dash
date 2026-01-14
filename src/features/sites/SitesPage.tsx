/**
 * Sites Management Page
 * Main page component for managing sites
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [isActiveFilter, setIsActiveFilter] = useState<string>('true'); // Default hanya aktif
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<'delete' | 'activate' | 'deactivate'>('delete');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [viewingDetails, setViewingDetails] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    siteId: '',
    siteName: '',
    isActive: true,
    detail: {
      province: '',
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

  // Add isActive filter (default true - hanya aktif)
  if (isActiveFilter !== 'all') {
    queryParams.isActive = isActiveFilter === 'true';
  }

  // Data fetching
  const { data, isLoading, error } = useSitesQuery(queryParams);
  const { data: statisticsData, isLoading: isLoadingStats, error: statisticsError } = useSiteStatistics();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const deleteMutation = useDeleteSite();

  // Helper function to map Site to SiteFormData
  const mapSiteToFormData = (site: Site): SiteFormData => {
    return {
      prCode: site.prCode || '',
      siteId: site.siteId,
      clusterId: site.clusterId || '',
      terminalId: site.terminalId || '',
      siteName: site.siteName,
      ipSnmp: site.ipSnmp || '',
      ipMiniPc: site.ipMiniPc || '',
      webappUrl: site.webappUrl || '',
      ehubVersion: site.ehubVersion || '',
      panel2Type: site.panel2Type || '',
      sccType: site.sccType || '',
      batteryVersion: site.batteryVersion || '',
      totalBattery: site.totalBattery,
      statusSites: site.statusSites || '',
      isActive: site.isActive ?? true,
      detail: {
        village: site.detail?.village || '',
        subdistrict: site.detail?.subdistrict || '',
        regency: site.detail?.regency || '',
        province: site.detail?.province || '',
        longitude: site.detail?.longitude ? parseFloat(String(site.detail.longitude)) : undefined,
        latitude: site.detail?.latitude ? parseFloat(String(site.detail.latitude)) : undefined,
        ipGatewayGs: site.detail?.ipGatewayGs || '',
        ipGatewayLc: site.detail?.ipGatewayLc || '',
        subnet: site.detail?.subnet || '',
        batteryList: (site.detail?.batteryList || []) as string[],
        cabinetList: (site.detail?.cabinetList || []) as string[],
        buildYear: site.detail?.buildYear || '',
        projectPhase: site.detail?.projectPhase || '',
        onairDate: site.detail?.onairDate || '',
        gsSustainDate: site.detail?.gsSustainDate || '',
        topoSustainDate: site.detail?.topoSustainDate || '',
        talisInstalled: site.detail?.talisInstalled || '',
        providerGs: site.detail?.providerGs || '',
        beamProvider: site.detail?.beamProvider || '',
        cellularOperator: site.detail?.cellularOperator || '',
        contactPerson: (site.detail?.contactPerson || []).map((cp) => ({
          name: cp.name || '',
          phone: cp.phone || '',
        })),
      },
    };
  };

  // Handlers
  const resetForm = () => {
    setFormData({
      siteId: '',
      siteName: '',
      isActive: true,
      detail: {
        province: '',
      },
    });
    setEditingId(null);
    setSelectedSite(null);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.siteId);
    setFormData(mapSiteToFormData(site));
    setIsDialogOpen(true);
  };

  const handleDelete = (site: Site) => {
    setSelectedSite(site);
    // Set default action berdasarkan status site
    if (site.isActive) {
      setDeleteAction('deactivate'); // Default untuk site aktif adalah deactivate
    } else {
      setDeleteAction('activate'); // Default untuk site nonaktif adalah activate
    }
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
    if (!selectedSite) return;

    if (deleteAction === 'delete') {
      // Hard delete
      deleteMutation.mutate(
        { id: selectedSite.siteId, hard: true },
        {
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setSelectedSite(null);
          },
        }
      );
    } else if (deleteAction === 'activate' || deleteAction === 'deactivate') {
      // Update isActive status
      updateMutation.mutate(
        {
          id: selectedSite.siteId,
          data: { isActive: deleteAction === 'activate' },
        },
        {
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setSelectedSite(null);
          },
        }
      );
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
      case 'isActive':
        setIsActiveFilter(value);
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
    <div className="container mx-auto px-4 py-8">
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
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Tambah'} Site</DialogTitle>
                  <DialogDescription>Masukkan detail site</DialogDescription>
                </DialogHeader>
                <SiteForm
                  formData={formData}
                  editingId={editingId}
                  isSubmitting={createMutation.isPending || updateMutation.isPending}
                  onChange={setFormData}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  onSubmit={(data) => {
                    if (editingId) {
                      updateMutation.mutate(
                        { id: editingId, data },
                        {
                          onSuccess: () => {
                            setIsDialogOpen(false);
                            resetForm();
                          },
                        }
                      );
                    } else {
                      createMutation.mutate(data, {
                        onSuccess: () => {
                          setIsDialogOpen(false);
                          resetForm();
                        },
                      });
                    }
                  }}
                />
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
          isActiveFilter={isActiveFilter}
          onSearchChange={(value) => handleFilterChange('search', value)}
          onStatusChange={(value) => handleFilterChange('status', value)}
          onSccTypeChange={(value) => handleFilterChange('sccType', value)}
          onBatteryVersionChange={(value) => handleFilterChange('batteryVersion', value)}
          onProvinceChange={(value) => handleFilterChange('province', value)}
          onIsActiveChange={(value) => handleFilterChange('isActive', value)}
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
    </div>
  );
};

export default SitesPage;
