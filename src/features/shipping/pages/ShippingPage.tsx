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
import { Plus, Download, Trash2 } from 'lucide-react';
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

  // Form data state
  const [shippingFormData, setShippingFormData] = useState<ShippingSparePartFormData>({
    date: new Date().toISOString().split('T')[0],
    site_id: '',
    status: 'request gudang',
  });
  const [returFormData, setReturFormData] = useState<ReturSparePartFormData>({});

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
    queryKey: ['shipping-spare-part', shippingPage],
    queryFn: () => shippingSparePartApi.getAll({ page: shippingPage, limit: 20 }),
  });

  // Fetch retur data
  const {
    data: returData,
    isLoading: isLoadingRetur,
    refetch: refetchRetur,
  } = useQuery({
    queryKey: ['return-spare-part', returPage],
    queryFn: () => returSparePartApi.getAll({ page: returPage, limit: 20 }),
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
    onError: (error) => {
      toast.error('Gagal menambahkan data shipping', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
    onError: (error) => {
      toast.error('Gagal mengupdate data shipping', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: 'request gudang' | 'proses kirim' | 'selesai';
    }) => shippingSparePartApi.update(id, { status }),
    onSuccess: () => {
      toast.success('Status berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-spare-part-statistics'] });
    },
    onError: (error) => {
      toast.error('Gagal mengupdate status', {
        description: error instanceof Error ? error.message : 'Unknown error',
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

  // Export to excel functions
  const handleExportShipping = async () => {
    try {
      const blob = await shippingSparePartApi.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-spare-part-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export berhasil');
    } catch (error) {
      toast.error('Gagal export data', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleExportRetur = async () => {
    try {
      const blob = await returSparePartApi.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retur-spare-part-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export berhasil');
    } catch (error) {
      toast.error('Gagal export data', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
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
    setReturFormData({});
    setEditingReturId(null);
  };

  // Handlers
  const handleOpenShippingForm = (item?: ShippingSparePart) => {
    if (item) {
      setShippingFormData({
        date: item.date,
        site_id: item.site_id,
        address_id: item.address_id,
        sparepart_note: item.sparepart_note,
        problem_id: item.problem_id,
        ticket_number: item.ticket_number,
        status: item.status,
        pr_code: item.pr_code,
      });
      setEditingShippingId(item.id);
    } else {
      resetShippingForm();
    }
    setShippingFormOpen(true);
  };

  const handleOpenReturForm = (item?: ReturSparePart) => {
    if (item) {
      setReturFormData(item as ReturSparePartFormData);
      setEditingReturId(item.id);
    } else {
      resetReturForm();
    }
    setReturFormOpen(true);
  };

  const handleViewDetail = (item: ShippingSparePart | ReturSparePart, type: 'shipping' | 'retur') => {
    setDetailData(item);
    setDetailType(type);
    setDetailModalOpen(true);
  };

  const handleShippingSubmit = (data: ShippingSparePartFormData) => {
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

  const handleStatusChange = (id: number, status: 'request gudang' | 'proses kirim' | 'selesai') => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shipping & Retur Spare Part</h1>
      </div>

      {/* Statistics */}
      <ShippingStatistics
        shippingStats={shippingStats}
        returStats={returStats}
        isLoading={isLoadingShippingStats || isLoadingReturStats}
      />

      {/* Shipping Spare Part Section */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shipping Spare Part</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportShipping}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => handleOpenShippingForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ShippingSparePartTable
            data={shippingData?.data || []}
            isLoading={isLoadingShipping}
            onView={(item) => handleViewDetail(item, 'shipping')}
            onEdit={(item) => handleOpenShippingForm(item)}
            onDelete={handleDeleteShipping}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>

      {/* Retur Spare Part Section */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Retur Spare Part</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportRetur}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => handleOpenReturForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReturSparePartTable
            data={returData?.data || []}
            isLoading={isLoadingRetur}
            onView={(item) => handleViewDetail(item, 'retur')}
            onEdit={(item) => handleOpenReturForm(item)}
            onDelete={handleDeleteRetur}
          />
        </CardContent>
      </Card>

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
              setShippingFormOpen(false);
              resetShippingForm();
            }}
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
            }}
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

