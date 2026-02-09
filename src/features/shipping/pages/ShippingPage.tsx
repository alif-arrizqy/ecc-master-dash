/**
 * Shipping Page
 * Halaman utama untuk Shipping Spare Part dan Retur Spare Part
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Download, Package, Truck, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { ShippingStatistics } from '../components/ShippingStatistics';
import { ShippingSparePartTable } from '../components/ShippingSparePartTable';
import { ReturSparePartTable } from '../components/ReturSparePartTable';
import { ShippingSparePartForm } from '../components/ShippingSparePartForm';
import { ReturSparePartForm } from '../components/ReturSparePartForm';
import { ShippingDetailModal } from '../components/ShippingDetailModal';
import {
  shippingSparePartApi,
  returSparePartApi,
} from '../services/shipping.api';
import type {
  ShippingSparePart,
  ReturSparePart,
  ShippingSparePartFormData,
  ReturSparePartFormData,
} from '../types/shipping.types';

const ShippingPage = () => {
  const queryClient = useQueryClient();
  const [shippingPage, setShippingPage] = useState(1);
  const [returPage, setReturPage] = useState(1);
  const [shippingFormOpen, setShippingFormOpen] = useState(false);
  const [returFormOpen, setReturFormOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<ShippingSparePart | ReturSparePart | null>(null);
  const [detailType, setDetailType] = useState<'shipping' | 'retur'>('shipping');
  const [editingShippingId, setEditingShippingId] = useState<number | null>(null);
  const [editingReturId, setEditingReturId] = useState<number | null>(null);

  // Filter state for shipping
  const [shippingFilter, setShippingFilter] = useState<{
    status?: string;
    site_id?: string;
    province?: string;
    cluster?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});

  // Filter state for retur
  const [returFilter, setReturFilter] = useState<{
    startDate?: string;
    endDate?: string;
    shipper?: string;
    source_spare_part?: string;
    search?: string;
  }>({});

  // Form data state
  const [shippingFormData, setShippingFormData] = useState<ShippingSparePartFormData>({
    date: new Date().toISOString().split('T')[0],
    site_id: '',
    status: 'request gudang',
  });
  const [returFormData, setReturFormData] = useState<ReturSparePartFormData>({
    date: new Date().toISOString().split('T')[0],
    shipper: '',
    source_spare_part: '',
  });

  // Fetch statistics
  const { data: shippingStats, isLoading: isLoadingShippingStats } = useQuery({
    queryKey: ['shipping-spare-part-statistics'],
    queryFn: () => shippingSparePartApi.getStatistics(),
  });

  const { data: returStats, isLoading: isLoadingReturStats } = useQuery({
    queryKey: ['return-spare-part-statistics'],
    queryFn: () => returSparePartApi.getStatistics(),
  });

  // Fetch shipping data
  const {
    data: shippingData,
    isLoading: isLoadingShipping,
    refetch: refetchShipping,
  } = useQuery({
    queryKey: ['shipping-spare-part', shippingPage, shippingFilter],
    queryFn: () => shippingSparePartApi.getAll({ 
      page: shippingPage, 
      limit: 20,
      ...shippingFilter,
    }),
  });

  // Fetch retur data
  const {
    data: returData,
    isLoading: isLoadingRetur,
    refetch: refetchRetur,
  } = useQuery({
    queryKey: ['return-spare-part', returPage, returFilter],
    queryFn: () => returSparePartApi.getAll({ 
      page: returPage, 
      limit: 20,
      ...returFilter,
    }),
  });

  // Create shipping mutation
  const createShippingMutation = useMutation({
    mutationFn: (data: ShippingSparePartFormData) => shippingSparePartApi.create(data),
    onSuccess: () => {
      toast.success('Data shipping berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part-statistics'] });
      setShippingFormOpen(false);
      resetShippingForm();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Gagal menambahkan data shipping';
      let errorDescription = 'Terjadi kesalahan saat menambahkan data';

      // Handle Axios error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        const responseData = axiosError.response?.data;

        if (responseData?.message) {
          errorDescription = responseData.message;
        } else if (responseData?.error) {
          errorDescription = responseData.error;
        }
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    },
  });

  // Update shipping mutation
  const updateShippingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShippingSparePartFormData> }) =>
      shippingSparePartApi.update(id, data),
    onSuccess: () => {
      toast.success('Data shipping berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part-statistics'] });
      setShippingFormOpen(false);
      resetShippingForm();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Gagal mengupdate data shipping';
      let errorDescription = 'Terjadi kesalahan saat mengupdate data';

      // Handle Axios error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        const responseData = axiosError.response?.data;

        if (responseData?.message) {
          errorDescription = responseData.message;
        } else if (responseData?.error) {
          errorDescription = responseData.error;
        }
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    },
  });

  // Delete shipping mutation
  const deleteShippingMutation = useMutation({
    mutationFn: (id: number) => shippingSparePartApi.delete(id),
    onSuccess: () => {
      toast.success('Data shipping berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part-statistics'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus data shipping', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: 'request gudang' | 'proses kirim' | 'selesai';
    }) => {
      console.log('Updating status:', { id, status });
      try {
        const result = await shippingSparePartApi.update(id, { status });
        console.log('Status update success:', result);
        return result;
      } catch (error) {
        console.error('Status update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Status berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part-statistics'] });
    },
    onError: (error: unknown) => {
      console.error('Update status error details:', error);
      
      let errorMessage = 'Gagal mengupdate status';
      let errorDescription = 'Terjadi kesalahan saat mengupdate status';
      
      // Handle Axios error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; errors?: unknown } } };
        const responseData = axiosError.response?.data;
        
        if (responseData?.message) {
          errorMessage = 'Gagal mengupdate status';
          
          // Check if it's a validation error about status transition
          if (typeof responseData.message === 'string') {
            if (responseData.message.includes('SELESAI') || responseData.message.includes('selesai')) {
              errorDescription = 'Status yang sudah "Selesai" tidak dapat diubah kembali ke status lain.';
            } else if (responseData.message.includes('status') || responseData.message.includes('Status')) {
              errorDescription = responseData.message;
            } else {
              errorDescription = responseData.message;
            }
          }
          
          // Check errors array for more details
          if (responseData.errors && Array.isArray(responseData.errors)) {
            const statusError = responseData.errors.find(
              (err: unknown) => 
                typeof err === 'object' && 
                err !== null && 
                'path' in err && 
                Array.isArray((err as { path: unknown }).path) &&
                (err as { path: string[] }).path.includes('status')
            );
            
            if (statusError && typeof statusError === 'object' && 'message' in statusError) {
              errorDescription = String(statusError.message);
            }
          }
        }
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    },
  });

  // Create retur mutation
  const createReturMutation = useMutation({
    mutationFn: (data: ReturSparePartFormData) => returSparePartApi.create(data),
    onSuccess: () => {
      toast.success('Data retur berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['return-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['return-spare-part-statistics'] });
      setReturFormOpen(false);
      resetReturForm();
    },
    onError: (error) => {
      toast.error('Gagal menambahkan data retur', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Update retur mutation
  const updateReturMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ReturSparePartFormData> }) =>
      returSparePartApi.update(id, data),
    onSuccess: () => {
      toast.success('Data retur berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['return-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['return-spare-part-statistics'] });
      setReturFormOpen(false);
      resetReturForm();
    },
    onError: (error) => {
      toast.error('Gagal mengupdate data retur', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Delete retur mutation
  const deleteReturMutation = useMutation({
    mutationFn: (id: number) => returSparePartApi.delete(id),
    onSuccess: () => {
      toast.success('Data retur berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['return-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['return-spare-part-statistics'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus data retur', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Export state
  const [isExportingShipping, setIsExportingShipping] = useState(false);
  const [isExportingRetur, setIsExportingRetur] = useState(false);

  // Helper function to download file
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Export to Excel functions with filters
  const handleExportShippingExcel = async () => {
    setIsExportingShipping(true);
    try {
      // Convert status to backend format if needed
      const exportParams: any = { ...shippingFilter };
      if (exportParams.status) {
        // Convert to uppercase with underscore if needed
        const statusMap: Record<string, string> = {
          'request gudang': 'REQUEST_GUDANG',
          'proses kirim': 'PROSES_KIRIM',
          'selesai': 'SELESAI',
        };
        exportParams.status = statusMap[exportParams.status.toLowerCase()] || exportParams.status.toUpperCase().replace(/\s+/g, '_');
      }
      
      const result = await shippingSparePartApi.exportToExcel(exportParams);
      downloadFile(result.blob, result.filename);
      toast.success('Export Excel berhasil');
    } catch (error) {
      toast.error('Gagal export Excel', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExportingShipping(false);
    }
  };

  const handleExportShippingPDF = async () => {
    setIsExportingShipping(true);
    try {
      // Convert status to backend format if needed
      const exportParams: any = { ...shippingFilter };
      if (exportParams.status) {
        // Convert to uppercase with underscore if needed
        const statusMap: Record<string, string> = {
          'request gudang': 'REQUEST_GUDANG',
          'proses kirim': 'PROSES_KIRIM',
          'selesai': 'SELESAI',
        };
        exportParams.status = statusMap[exportParams.status.toLowerCase()] || exportParams.status.toUpperCase().replace(/\s+/g, '_');
      }
      
      const result = await shippingSparePartApi.exportToPDF(exportParams);
      downloadFile(result.blob, result.filename);
      toast.success('Export PDF berhasil');
    } catch (error) {
      toast.error('Gagal export PDF', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExportingShipping(false);
    }
  };

  const handleExportReturExcel = async () => {
    setIsExportingRetur(true);
    try {
      const result = await returSparePartApi.exportToExcel(returFilter);
      downloadFile(result.blob, result.filename);
      toast.success('Export Excel berhasil');
    } catch (error) {
      toast.error('Gagal export Excel', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExportingRetur(false);
    }
  };

  const handleExportReturPDF = async () => {
    setIsExportingRetur(true);
    try {
      const result = await returSparePartApi.exportToPDF(returFilter);
      downloadFile(result.blob, result.filename);
      toast.success('Export PDF berhasil');
    } catch (error) {
      toast.error('Gagal export PDF', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExportingRetur(false);
    }
  };

  // Reset form functions
  const resetShippingForm = () => {
    setShippingFormData({
      date: new Date().toISOString().split('T')[0],
      site_id: '',
      status: 'request gudang',
    });
    setEditingShippingId(null);
  };

  const resetReturForm = () => {
    setReturFormData({
      date: new Date().toISOString().split('T')[0],
      shipper: '',
      source_spare_part: '',
    });
    setEditingReturId(null);
  };

  // State untuk existing images (untuk edit mode)
  const [existingTicketImage, setExistingTicketImage] = useState<string | undefined>();
  const [existingResiImage, setExistingResiImage] = useState<string | undefined>();
  const [existingReturImage, setExistingReturImage] = useState<string | Array<string> | null>(null);

  // Handlers
  const handleOpenShippingForm = (item?: ShippingSparePart) => {
    if (item) {
      // Normalize status untuk form
      const normalizeStatus = (status: string): 'request gudang' | 'proses kirim' | 'selesai' => {
        if (status === 'REQUEST_GUDANG' || status === 'request gudang') return 'request gudang';
        if (status === 'PROSES_KIRIM' || status === 'proses kirim') return 'proses kirim';
        if (status === 'SELESAI' || status === 'selesai') return 'selesai';
        return 'request gudang';
      };

      setShippingFormData({
        date: item.date,
        site_id: item.site?.site_id || '',
        address_id: item.address?.address_id,
        sparepart_note: item.sparepart_note,
        problem_id: item.problem?.problem_id,
        ticket_number: item.ticket?.ticket_number,
        resi_number: item.resi?.resi_number,
        status: normalizeStatus(item.status),
        pr_code: item.site?.pr_code || undefined,
      });
      // Set existing images untuk preview
      setExistingTicketImage(item.ticket?.ticket_image);
      setExistingResiImage(item.resi?.resi_image);
      setEditingShippingId(item.id);
    } else {
      resetShippingForm();
      setExistingTicketImage(undefined);
      setExistingResiImage(undefined);
    }
    setShippingFormOpen(true);
  };

  const handleOpenReturForm = (item?: ReturSparePart) => {
    if (item) {
      // Format list_spare_part jika array
      let listSparePart = item.list_spare_part;
      if (Array.isArray(listSparePart)) {
        listSparePart = JSON.stringify(listSparePart);
      } else if (typeof listSparePart !== 'string') {
        listSparePart = String(listSparePart || '');
      }
      
      setReturFormData({
        date: item.date,
        shipper: item.shipper,
        source_spare_part: item.source_spare_part,
        list_spare_part: listSparePart,
        notes: item.notes,
      });
      // Set existing image untuk preview
      setExistingReturImage(item.image || null);
      setEditingReturId(item.id);
    } else {
      resetReturForm();
      setExistingReturImage(null);
    }
    setReturFormOpen(true);
  };

  const handleViewDetail = (item: ShippingSparePart | ReturSparePart, type: 'shipping' | 'retur') => {
    setDetailData(item);
    setDetailType(type);
    setDetailModalOpen(true);
  };

  const handleShippingSubmit = (data: ShippingSparePartFormData) => {
    // Validasi: resi_number wajib diisi untuk status "proses kirim" atau "selesai"
    if ((data.status === 'proses kirim' || data.status === 'selesai') && !data.resi_number?.trim()) {
      toast.error('Resi Number wajib diisi', {
        description: 'Resi Number harus diisi untuk status "Proses Kirim" dan "Selesai".',
      });
      return;
    }

    if (editingShippingId) {
      updateShippingMutation.mutate({ id: editingShippingId, data });
    } else {
      createShippingMutation.mutate(data);
    }
  };

  const handleReturSubmit = (data: ReturSparePartFormData) => {
    if (editingReturId) {
      updateReturMutation.mutate({ id: editingReturId, data });
    } else {
      createReturMutation.mutate(data);
    }
  };

  const handleDeleteShipping = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteShippingMutation.mutate(id);
    }
  };

  const handleDeleteRetur = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteReturMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Shipping & Retur Spare Part
              </h1>
              <p className="text-muted-foreground mt-1">
                Kelola data shipping dan retur spare part
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <section className="mb-6 animate-slide-up">
        <ShippingStatistics
          shippingStats={shippingStats}
          returStats={returStats}
          isLoading={isLoadingShippingStats || isLoadingReturStats}
        />
      </section>

      {/* Shipping Spare Part Section */}
      <section className="mb-6 animate-slide-up">
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Shipping Spare Part</h3>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isExportingShipping}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExportingShipping ? 'Exporting...' : 'Export'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportShippingExcel} disabled={isExportingShipping}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export ke Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportShippingPDF} disabled={isExportingShipping}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export ke PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => handleOpenShippingForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          </div>
          <ShippingSparePartTable
            data={Array.isArray(shippingData?.data) ? shippingData.data : []}
            isLoading={isLoadingShipping}
            onView={(item) => handleViewDetail(item, 'shipping')}
            onEdit={(item) => handleOpenShippingForm(item)}
            onDelete={handleDeleteShipping}
            filter={shippingFilter}
            onFilterChange={(filter) => {
              setShippingFilter(filter);
              setShippingPage(1); // Reset to page 1 when filter changes
            }}
          />
        </div>
      </section>

      {/* Retur Spare Part Section */}
      <section className="mb-6 animate-slide-up">
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Retur Spare Part</h3>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isExportingRetur}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExportingRetur ? 'Exporting...' : 'Export'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportReturExcel} disabled={isExportingRetur}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export ke Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportReturPDF} disabled={isExportingRetur}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export ke PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => handleOpenReturForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          </div>
          <ReturSparePartTable
            data={Array.isArray(returData?.data) ? returData.data : []}
            isLoading={isLoadingRetur}
            onView={(item) => handleViewDetail(item, 'retur')}
            onEdit={(item) => handleOpenReturForm(item)}
            onDelete={handleDeleteRetur}
            filter={returFilter}
            onFilterChange={(filter) => {
              setReturFilter(filter);
              setReturPage(1); // Reset to page 1 when filter changes
            }}
          />
        </div>
      </section>

      {/* Shipping Form Dialog */}
      <Dialog open={shippingFormOpen} onOpenChange={setShippingFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShippingId ? 'Edit Shipping Spare Part' : 'Tambah Shipping Spare Part'}
            </DialogTitle>
            <DialogDescription>
              {editingShippingId
                ? 'Edit data shipping spare part'
                : 'Tambahkan data shipping spare part baru'}
            </DialogDescription>
          </DialogHeader>
          <ShippingSparePartForm
            formData={shippingFormData}
            editingId={editingShippingId}
            isSubmitting={
              createShippingMutation.isPending || updateShippingMutation.isPending
            }
            onChange={setShippingFormData}
            onSubmit={handleShippingSubmit}
            onCancel={() => {
              resetShippingForm();
              setShippingFormOpen(false);
            }}
            existingTicketImage={existingTicketImage}
            existingResiImage={existingResiImage}
          />
        </DialogContent>
      </Dialog>

      {/* Retur Form Dialog */}
      <Dialog open={returFormOpen} onOpenChange={setReturFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReturId ? 'Edit Retur Spare Part' : 'Tambah Retur Spare Part'}
            </DialogTitle>
            <DialogDescription>
              {editingReturId
                ? 'Edit data retur spare part'
                : 'Tambahkan data retur spare part baru'}
            </DialogDescription>
          </DialogHeader>
          <ReturSparePartForm
            formData={returFormData}
            editingId={editingReturId}
            isSubmitting={createReturMutation.isPending || updateReturMutation.isPending}
            onChange={setReturFormData}
            onSubmit={handleReturSubmit}
            onCancel={() => {
              setReturFormOpen(false);
              resetReturForm();
              setExistingReturImage(null);
            }}
            existingImage={existingReturImage}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <ShippingDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        data={detailData}
        type={detailType}
      />
    </div>
  );
};

export default ShippingPage;

