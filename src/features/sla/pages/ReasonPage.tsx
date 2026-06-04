import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { slaApi } from '../services/sla.api';
import type { BatteryVersion } from '@/shared/lib/api';
import { getSLADateRange } from '@/shared/lib/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';

interface ReasonWithBatteryVersion {
  id: number;
  reason: string;
  batteryVersion: BatteryVersion;
  createdAt: string;
  updatedAt: string;
  batteryVersionId?: number;
}

const BATTERY_VERSIONS: { value: BatteryVersion; label: string; color: string }[] = [
  { value: 'talis5', label: 'Talis5 Full', color: 'bg-blue-500/10 border-blue-500/30 text-blue-600' },
  { value: 'mix',    label: 'Talis5 Mix',  color: 'bg-violet-500/10 border-violet-500/30 text-violet-600' },
  { value: 'jspro',  label: 'JS PRO',      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' },
];

const ReasonPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
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

  // Fetch all reasons (for dropdown)
  const { data: allReasonsData } = useQuery({
    queryKey: ['sla-reasons-all'],
    queryFn: () => slaApi.getSLAReasons({ limit: 20 }),
  });

  // Fetch reasons by battery version
  const { data: talis5Reasons } = useQuery({
    queryKey: ['sla-reasons', 'talis5', startDate, endDate],
    queryFn: () => slaApi.getSLAReasonsByBatteryVersion('talis5', { startDate, endDate }),
  });

  const { data: mixReasons } = useQuery({
    queryKey: ['sla-reasons', 'mix', startDate, endDate],
    queryFn: () => slaApi.getSLAReasonsByBatteryVersion('mix', { startDate, endDate }),
  });

  const { data: jsproReasons } = useQuery({
    queryKey: ['sla-reasons', 'jspro', startDate, endDate],
    queryFn: () => slaApi.getSLAReasonsByBatteryVersion('jspro', { startDate, endDate }),
  });

  const isLoading = !talis5Reasons && !mixReasons && !jsproReasons;

  // Get filtered reasons per battery version
  const getFilteredReasons = (
    reasons: typeof talis5Reasons,
    bv: BatteryVersion
  ): ReasonWithBatteryVersion[] => {
    if (!Array.isArray(reasons)) return [];
    return reasons
      .filter((r) => r.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((r) => ({ ...r, batteryVersion: bv }));
  };

  const reasonsByBv: Record<BatteryVersion, ReasonWithBatteryVersion[]> = {
    talis5: getFilteredReasons(talis5Reasons, 'talis5'),
    mix:    getFilteredReasons(mixReasons, 'mix'),
    jspro:  getFilteredReasons(jsproReasons, 'jspro'),
  };

  const totalCount = reasonsByBv.talis5.length + reasonsByBv.mix.length + reasonsByBv.jspro.length;

  // Get existing reasons for selected battery version in form (to exclude already-linked)
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
    setFormData({ batteryVersion: '', reason: '', useExisting: false, existingReasonId: null });
    setEditingId(null);
  };

  const handleEdit = (item: ReasonWithBatteryVersion) => {
    setEditingId(item.id);
    setFormData({ batteryVersion: item.batteryVersion, reason: item.reason, useExisting: false, existingReasonId: null });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.batteryVersion) {
      toast.error('Battery version wajib dipilih');
      return;
    }

    if (editingId) {
      if (!formData.reason.trim()) { toast.error('Reason wajib diisi'); return; }
      updateMutation.mutate({ id: editingId, data: { reason: formData.reason } });
      return;
    }

    if (formData.useExisting) {
      if (!formData.existingReasonId) { toast.error('Pilih reason yang sudah ada'); return; }
      linkToBatteryVersionMutation.mutate({ batteryVersion: formData.batteryVersion, reasonId: formData.existingReasonId });
    } else {
      if (!formData.reason.trim()) { toast.error('Reason wajib diisi'); return; }
      try {
        const newReason = await createReasonMutation.mutateAsync({ reason: formData.reason });
        const reasonId = (newReason as { id?: number })?.id;
        if (reasonId) {
          linkToBatteryVersionMutation.mutate({ batteryVersion: formData.batteryVersion, reasonId });
        } else {
          toast.error('Gagal mendapatkan ID reason yang baru dibuat');
        }
      } catch {
        // Error already handled in mutation
      }
    }
  };

  const handleDelete = (item: ReasonWithBatteryVersion) => {
    const bvLabel = BATTERY_VERSIONS.find((bv) => bv.value === item.batteryVersion)?.label;
    if (confirm(`Apakah Anda yakin ingin menghapus reason "${item.reason}" dari ${bvLabel}?`)) {
      deleteFromBatteryVersionMutation.mutate(item.batteryVersionId || item.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
                    : 'Pilih battery version dan masukkan atau pilih alasan kenapa SLA kurang dari 95.5%'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Battery Version *</Label>
                  <Select
                    value={formData.batteryVersion}
                    onValueChange={(value) =>
                      setFormData({ ...formData, batteryVersion: value as BatteryVersion, useExisting: false, existingReasonId: null })
                    }
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih battery version" />
                    </SelectTrigger>
                    <SelectContent>
                      {BATTERY_VERSIONS.map((bv) => (
                        <SelectItem key={bv.value} value={bv.value}>{bv.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!editingId && formData.batteryVersion && (
                  <div>
                    <Label>Gunakan reason yang sudah ada?</Label>
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant={formData.useExisting ? 'default' : 'outline'} size="sm"
                        onClick={() => setFormData({ ...formData, useExisting: true, reason: '' })}>
                        Pilih dari yang sudah ada
                      </Button>
                      <Button type="button" variant={!formData.useExisting ? 'default' : 'outline'} size="sm"
                        onClick={() => setFormData({ ...formData, useExisting: false, existingReasonId: null })}>
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
                        setFormData({ ...formData, existingReasonId: reasonId, reason: selectedReason?.reason || '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih reason yang sudah ada" />
                      </SelectTrigger>
                      <SelectContent>
                        {allReasonsData?.data
                          ?.filter((reason) => {
                            const alreadyLinked = Array.isArray(existingReasonsForBattery)
                              ? existingReasonsForBattery.some((r) => r.id === reason.id)
                              : false;
                            return !alreadyLinked;
                          })
                          .map((reason) => (
                            <SelectItem key={reason.id} value={reason.id.toString()}>{reason.reason}</SelectItem>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createReasonMutation.isPending || linkToBatteryVersionMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Update' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 animate-slide-up">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 3-column Battery Version Cards */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          {BATTERY_VERSIONS.map((bv) => {
            const reasons = reasonsByBv[bv.value];
            return (
              <Card key={bv.value} className="card-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{bv.label}</span>
                    <Badge variant="secondary">{reasons.length} reason</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {reasons.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada reason'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {reasons.map((item) => (
                        <li
                          key={`${item.id}-${bv.value}`}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${bv.color}`}
                        >
                          <span className="flex-1 break-words leading-snug pt-0.5">{item.reason}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && totalCount === 0 && !searchTerm && (
        <p className="text-center text-muted-foreground mt-8">Belum ada data SLA Reason.</p>
      )}
    </div>
  );
};

export default ReasonPage;
