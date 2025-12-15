import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { slaApi } from '@/lib/api';
import { format } from 'date-fns';
import { getSLADateRange } from '@/lib/dateUtils';
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

const ProblemPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    siteId: '',
    prCode: '',
    problems: [{ pic: '', problem: '', notes: '' }],
  });
  const queryClient = useQueryClient();
  const { startDate, endDate } = getSLADateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['sla-problems', startDate, endDate],
    queryFn: () => slaApi.getSLAProblems({ startDate, endDate, limit: 100 }),
  });

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
    mutationFn: ({ id, data }: { id: number; data: any }) => slaApi.updateSLAProblem(id, data),
    onSuccess: () => {
      toast.success('SLA Problem berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: ['sla-problems'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal mengupdate SLA Problem', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      date: item.date,
      siteId: item.siteId,
      prCode: item.prCode || '',
      problems: item.problems.length > 0 ? item.problems : [{ pic: '', problem: '', notes: '' }],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.date || !formData.siteId) {
      toast.error('Date dan Site ID wajib diisi');
      return;
    }

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

  const filteredData = data?.data?.filter((item) =>
    item.siteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.prCode?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <Label>Site ID *</Label>
                      <Input
                        value={formData.siteId}
                        onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                        placeholder="PAP9999"
                      />
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
                  placeholder="Cari Site ID atau PR Code..."
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
              {isLoading ? 'Memuat data...' : `${filteredData.length} problem ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Site ID</TableHead>
                    <TableHead>PR Code</TableHead>
                    <TableHead>Problems</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{item.siteId}</TableCell>
                        <TableCell>{item.prCode || '-'}</TableCell>
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

