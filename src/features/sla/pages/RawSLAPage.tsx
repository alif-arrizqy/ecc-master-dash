import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { slaApi } from '../services/sla.api';
import { format } from 'date-fns';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/loading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const RawSLAPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteId, setSiteId] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'all' | 'site' | null>(null);
  const queryClient = useQueryClient();
  const { startDate, endDate } = getSLADateRange();

  const queryParams = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : startDate,
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : endDate,
    page: 1,
    limit: 100,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['raw-sla', queryParams, siteId],
    queryFn: () => {
      if (siteId) {
        return slaApi.getRawSLABySiteId(siteId, queryParams);
      }
      return slaApi.getRawSLA(queryParams);
    },
  });

  const deleteByDateRangeMutation = useMutation({
    mutationFn: slaApi.deleteRawSLAByDateRange,
    onSuccess: () => {
      toast.success('Raw SLA berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['raw-sla'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Gagal menghapus Raw SLA', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const deleteBySiteIdMutation = useMutation({
    mutationFn: ({ siteId, params }: { siteId: string; params?: any }) =>
      slaApi.deleteRawSLABySiteId(siteId, params),
    onSuccess: () => {
      toast.success('Raw SLA berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['raw-sla'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Gagal menghapus Raw SLA', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const handleDelete = () => {
    if (deleteType === 'all') {
      if (!dateRange.from || !dateRange.to) {
        toast.error('Pilih date range terlebih dahulu');
        return;
      }
      deleteByDateRangeMutation.mutate({
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      });
    } else if (deleteType === 'site') {
      if (!siteId) {
        toast.error('Masukkan Site ID terlebih dahulu');
        return;
      }
      deleteBySiteIdMutation.mutate({
        siteId,
        params: dateRange.from && dateRange.to
          ? {
              startDate: format(dateRange.from, 'yyyy-MM-dd'),
              endDate: format(dateRange.to, 'yyyy-MM-dd'),
            }
          : undefined,
      });
    }
  };

  const rawData = data?.data || [];
  const filteredData = rawData.filter((item: any) => {
    const itemStr = JSON.stringify(item).toLowerCase();
    return itemStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Raw SLA
                </h1>
                <p className="text-muted-foreground mt-1">
                  Kelola raw data SLA Bakti
                </p>
              </div>
            </div>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Hapus Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Hapus Raw SLA</DialogTitle>
                  <DialogDescription>
                    Pilih metode penghapusan data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Metode Penghapusan</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={deleteType === 'all' ? 'default' : 'outline'}
                        onClick={() => setDeleteType('all')}
                        className="flex-1"
                      >
                        Hapus by Date Range
                      </Button>
                      <Button
                        variant={deleteType === 'site' ? 'default' : 'outline'}
                        onClick={() => setDeleteType('site')}
                        className="flex-1"
                      >
                        Hapus by Site ID
                      </Button>
                    </div>
                  </div>
                  {deleteType === 'site' && (
                    <div>
                      <Label>Site ID *</Label>
                      <Input
                        value={siteId}
                        onChange={(e) => setSiteId(e.target.value)}
                        placeholder="PAP9999"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Date Range {deleteType === 'all' ? '*' : '(Optional)'}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <span className="text-xs">
                                {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                              </span>
                            ) : (
                              format(dateRange.from, 'dd/MM/yyyy')
                            )
                          ) : (
                            <span className="text-muted-foreground">Pilih date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteByDateRangeMutation.isPending || deleteBySiteIdMutation.isPending}
                  >
                    Hapus
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 card-shadow animate-slide-up">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                placeholder="Filter by Site ID (optional)"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <span className="text-xs">
                          {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                        </span>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span className="text-muted-foreground">Date Range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="card-shadow animate-slide-up">
          <CardHeader>
            <CardTitle>Raw SLA Data</CardTitle>
            <CardDescription>
              {isLoading ? 'Memuat data...' : `${filteredData.length} data ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {rawData.length > 0 && Object.keys(rawData[0] as object).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={rawData.length > 0 ? Object.keys(rawData[0] as object).length : 1}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          {Object.entries(item).map(([key, value]) => (
                            <TableCell key={key} className="max-w-xs truncate">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default RawSLAPage;

