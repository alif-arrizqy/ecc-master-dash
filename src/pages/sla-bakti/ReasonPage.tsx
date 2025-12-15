import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { slaApi } from '@/lib/api';
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
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/loading';

const ReasonPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ reason: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sla-reasons'],
    queryFn: () => slaApi.getSLAReasons({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: slaApi.createSLAReason,
    onSuccess: () => {
      toast.success('SLA Reason berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['sla-reasons'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal membuat SLA Reason', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { reason: string } }) => slaApi.updateSLAReason(id, data),
    onSuccess: () => {
      toast.success('SLA Reason berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['sla-reasons'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal mengupdate SLA Reason', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: slaApi.deleteSLAReason,
    onSuccess: () => {
      toast.success('SLA Reason berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['sla-reasons'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus SLA Reason', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const resetForm = () => {
    setFormData({ reason: '' });
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ reason: item.reason });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.reason.trim()) {
      toast.error('Reason wajib diisi');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredData = data?.data?.filter((item) =>
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SLA Reason
                </h1>
                <p className="text-muted-foreground mt-1">
                  Alasan kenapa SLA kurang dari 95.5% dari battery version
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Reason
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Tambah'} SLA Reason</DialogTitle>
                  <DialogDescription>
                    Masukkan alasan kenapa SLA kurang dari 95.5%
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Reason *</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ reason: e.target.value })}
                      placeholder="Masukkan alasan..."
                      rows={4}
                    />
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

        {/* Search */}
        <Card className="mb-6 card-shadow animate-slide-up">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="card-shadow animate-slide-up">
          <CardHeader>
            <CardTitle>Daftar SLA Reason</CardTitle>
            <CardDescription>
              {isLoading ? 'Memuat data...' : `${filteredData.length} reason ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="max-w-md">{item.reason}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString('id-ID')}</TableCell>
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

export default ReasonPage;

