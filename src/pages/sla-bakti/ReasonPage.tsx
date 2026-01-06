import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Edit, Trash2, Search, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { slaApi, BatteryVersion } from '@/lib/api';
import { getSLADateRange, getSLAMonthPeriod } from '@/lib/dateUtils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ReasonWithBatteryVersion {
  id: number;
  reason: string;
  batteryVersion: BatteryVersion;
  createdAt: string;
  updatedAt: string;
  period?: string; // Period in YYYY-MM format
  batteryVersionId?: number; // ID of the battery-version relationship for deletion
}

const BATTERY_VERSIONS: { value: BatteryVersion; label: string }[] = [
  { value: 'talis5', label: 'Talis5 Full' },
  { value: 'mix', label: 'Talis5 Mix' },
  { value: 'jspro', label: 'JS PRO' },
];

const ReasonPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatteryVersion, setSelectedBatteryVersion] = useState<BatteryVersion | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    batteryVersion: '' as BatteryVersion | '',
    reason: '',
    useExisting: false,
    existingReasonId: null as number | null,
  });
  const queryClient = useQueryClient();
  const { startDate, endDate } = getSLADateRange();
  const currentPeriod = getSLAMonthPeriod(); // Get current period (YYYY-MM)

  // Fetch all reasons (for dropdown)
  const { data: allReasonsData } = useQuery({
    queryKey: ['sla-reasons-all'],
    queryFn: () => slaApi.getSLAReasons({ limit: 20 }),
  });

  // Fetch reasons by battery version (using period for more efficient query)
  const { data: talis5Reasons } = useQuery({
    queryKey: ['sla-reasons', 'talis5', currentPeriod],
    queryFn: () => slaApi.getSLAReasonsByBatteryVersion('talis5', { period: currentPeriod }),
    enabled: selectedBatteryVersion === 'all' || selectedBatteryVersion === 'talis5',
  });

  const { data: mixReasons } = useQuery({
    queryKey: ['sla-reasons', 'mix', currentPeriod],
    queryFn: () => slaApi.getSLAReasonsByBatteryVersion('mix', { period: currentPeriod }),
    enabled: selectedBatteryVersion === 'all' || selectedBatteryVersion === 'mix',
  });

  const { data: jsproReasons } = useQuery({
    queryKey: ['sla-reasons', 'jspro', currentPeriod],
    queryFn: () => slaApi.getSLAReasonsByBatteryVersion('jspro', { period: currentPeriod }),
    enabled: selectedBatteryVersion === 'all' || selectedBatteryVersion === 'jspro',
  });

  // Combine all reasons with battery version info
  const allReasonsWithBattery: ReasonWithBatteryVersion[] = [];
  if (talis5Reasons && Array.isArray(talis5Reasons)) {
    talis5Reasons.forEach((reason) => {
      allReasonsWithBattery.push({ ...reason, batteryVersion: 'talis5', period: currentPeriod });
    });
  }
  if (mixReasons && Array.isArray(mixReasons)) {
    mixReasons.forEach((reason) => {
      allReasonsWithBattery.push({ ...reason, batteryVersion: 'mix', period: currentPeriod });
    });
  }
  if (jsproReasons && Array.isArray(jsproReasons)) {
    jsproReasons.forEach((reason) => {
      allReasonsWithBattery.push({ ...reason, batteryVersion: 'jspro', period: currentPeriod });
    });
  }

  const isLoading = !talis5Reasons && !mixReasons && !jsproReasons;

  // Get existing reasons for selected battery version in form
  const existingReasonsForBattery = formData.batteryVersion
    ? (formData.batteryVersion === 'talis5' ? talis5Reasons : 
       formData.batteryVersion === 'mix' ? mixReasons : 
       jsproReasons) || []
    : [];

  const createReasonMutation = useMutation({
    mutationFn: slaApi.createSLAReason,
    onError: (error) => {
      toast.error('Gagal membuat SLA Reason', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const linkToBatteryVersionMutation = useMutation({
    mutationFn: slaApi.createSLAReasonBatteryVersion,
    onSuccess: () => {
      toast.success('SLA Reason berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['sla-reasons'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal menambahkan reason ke battery version', {
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

  const deleteFromBatteryVersionMutation = useMutation({
    mutationFn: slaApi.deleteSLAReasonBatteryVersion,
    onSuccess: () => {
      toast.success('SLA Reason berhasil dihapus dari battery version');
      queryClient.invalidateQueries({ queryKey: ['sla-reasons'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus reason dari battery version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      batteryVersion: '',
      reason: '',
      useExisting: false,
      existingReasonId: null,
    });
    setEditingId(null);
  };

  const handleEdit = (item: ReasonWithBatteryVersion) => {
    setEditingId(item.id);
    setFormData({
      batteryVersion: item.batteryVersion,
      reason: item.reason,
      useExisting: false,
      existingReasonId: null,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.batteryVersion) {
      toast.error('Battery version wajib dipilih');
      return;
    }

    if (editingId) {
      // Update existing reason
      if (!formData.reason.trim()) {
        toast.error('Reason wajib diisi');
        return;
      }
      updateMutation.mutate({ id: editingId, data: { reason: formData.reason } });
      return;
    }

    // Create new or link existing
    if (formData.useExisting) {
      if (!formData.existingReasonId) {
        toast.error('Pilih reason yang sudah ada');
        return;
      }
      // Link existing reason to battery version (period will default to current month on backend)
      linkToBatteryVersionMutation.mutate({
        batteryVersion: formData.batteryVersion,
        reasonId: formData.existingReasonId,
        period: currentPeriod, // Explicitly set period to current month
      });
    } else {
      if (!formData.reason.trim()) {
        toast.error('Reason wajib diisi');
        return;
      }
      // Create new reason and link to battery version
      try {
        const newReason = await createReasonMutation.mutateAsync({ reason: formData.reason });
        // The API should return the created reason with ID
        // We need to extract the ID from the response
        const reasonId = (newReason as { id?: number })?.id;
        if (reasonId) {
          linkToBatteryVersionMutation.mutate({
            batteryVersion: formData.batteryVersion,
            reasonId: reasonId,
            period: currentPeriod, // Explicitly set period to current month
          });
        } else {
          toast.error('Gagal mendapatkan ID reason yang baru dibuat');
        }
      } catch (error) {
        // Error already handled in mutation
      }
    }
  };

  const handleDelete = (item: ReasonWithBatteryVersion) => {
    if (confirm(`Apakah Anda yakin ingin menghapus reason "${item.reason}" dari ${BATTERY_VERSIONS.find(bv => bv.value === item.batteryVersion)?.label}?`)) {
      // Note: We need the battery-version relationship ID to delete
      // For now, we'll delete the reason itself if it's only linked to one battery version
      // In a real implementation, you'd need to track the relationship ID
      deleteFromBatteryVersionMutation.mutate(item.batteryVersionId || item.id);
    }
  };

  // Filter data based on search and battery version
  const filteredData = allReasonsWithBattery.filter((item) => {
    const matchesSearch = item.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBattery = selectedBatteryVersion === 'all' || item.batteryVersion === selectedBatteryVersion;
    return matchesSearch && matchesBattery;
  });

  // Group by battery version for display
  const groupedData = {
    talis5: filteredData.filter((item) => item.batteryVersion === 'talis5'),
    mix: filteredData.filter((item) => item.batteryVersion === 'mix'),
    jspro: filteredData.filter((item) => item.batteryVersion === 'jspro'),
  };

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
                  Alasan kenapa SLA kurang dari 95.5% berdasarkan battery version
                  <span className="ml-2 text-xs">(Periode: {currentPeriod})</span>
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Tambah'} SLA Reason</DialogTitle>
                  <DialogDescription>
                    {editingId 
                      ? 'Edit alasan kenapa SLA kurang dari 95.5%'
                      : 'Pilih battery version dan masukkan atau pilih alasan kenapa SLA kurang dari 95.5%'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Battery Version *</Label>
                    <Select
                      value={formData.batteryVersion}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          batteryVersion: value as BatteryVersion,
                          useExisting: false,
                          existingReasonId: null,
                        });
                      }}
                      disabled={!!editingId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih battery version" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATTERY_VERSIONS.map((bv) => (
                          <SelectItem key={bv.value} value={bv.value}>
                            {bv.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!editingId && formData.batteryVersion && (
                    <div>
                      <Label>Gunakan reason yang sudah ada?</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant={formData.useExisting ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, useExisting: true, reason: '' })}
                        >
                          Pilih dari yang sudah ada
                        </Button>
                        <Button
                          type="button"
                          variant={!formData.useExisting ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, useExisting: false, existingReasonId: null })}
                        >
                          Tulis baru
                        </Button>
                      </div>
                    </div>
                  )}

                  {formData.useExisting && !editingId && formData.batteryVersion ? (
                    <div>
                      <Label>Pilih Reason *</Label>
                      <Select
                        value={formData.existingReasonId?.toString() || ''}
                        onValueChange={(value) => {
                          const reasonId = parseInt(value);
                          const selectedReason = allReasonsData?.data?.find((r) => r.id === reasonId);
                          setFormData({
                            ...formData,
                            existingReasonId: reasonId,
                            reason: selectedReason?.reason || '',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih reason yang sudah ada" />
                        </SelectTrigger>
                        <SelectContent>
                          {allReasonsData?.data
                            ?.filter((reason) => {
                              // Filter out reasons that are already linked to this battery version
                              const alreadyLinked = Array.isArray(existingReasonsForBattery) 
                                ? existingReasonsForBattery.some((r) => r.id === reason.id)
                                : false;
                              return !alreadyLinked;
                            })
                            .map((reason) => (
                              <SelectItem key={reason.id} value={reason.id.toString()}>
                                {reason.reason}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {formData.existingReasonId && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Reason yang dipilih: {allReasonsData?.data?.find((r) => r.id === formData.existingReasonId)?.reason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label>Reason *</Label>
                      <Textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Masukkan alasan kenapa SLA kurang dari 95.5%..."
                        rows={4}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={
                      createReasonMutation.isPending || 
                      linkToBatteryVersionMutation.isPending || 
                      updateMutation.isPending
                    }
                  >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedBatteryVersion}
                onValueChange={(value) => setSelectedBatteryVersion(value as BatteryVersion | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Battery Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Battery Version</SelectItem>
                  {BATTERY_VERSIONS.map((bv) => (
                    <SelectItem key={bv.value} value={bv.value}>
                      {bv.label}
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
            <CardTitle>Daftar SLA Reason</CardTitle>
            <CardDescription>
              {isLoading ? 'Memuat data...' : `${filteredData.length} reason ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Semua ({filteredData.length})</TabsTrigger>
                  <TabsTrigger value="talis5">Talis5 Full ({groupedData.talis5.length})</TabsTrigger>
                  <TabsTrigger value="mix">Talis5 Mix ({groupedData.mix.length})</TabsTrigger>
                  <TabsTrigger value="jspro">JS PRO ({groupedData.jspro.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Battery Version</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Period</TableHead>
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
                          <TableRow key={`${item.id}-${item.batteryVersion}`}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {BATTERY_VERSIONS.find((bv) => bv.value === item.batteryVersion)?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md">{item.reason}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {item.period || currentPeriod}
                              </Badge>
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
                                  onClick={() => handleDelete(item)}
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
                </TabsContent>
                {BATTERY_VERSIONS.map((bv) => (
                  <TabsContent key={bv.value} value={bv.value} className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedData[bv.value].length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Tidak ada data untuk {bv.label}
                            </TableCell>
                          </TableRow>
                        ) : (
                          groupedData[bv.value].map((item) => (
                            <TableRow key={`${item.id}-${item.batteryVersion}`}>
                              <TableCell>{item.id}</TableCell>
                              <TableCell className="max-w-md">{item.reason}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {item.period || currentPeriod}
                                </Badge>
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
                                    onClick={() => handleDelete(item)}
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
                  </TabsContent>
                ))}
              </Tabs>
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
