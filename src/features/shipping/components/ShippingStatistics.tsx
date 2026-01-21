/**
 * Shipping Statistics Component
 * Menampilkan summary data shipping dan retur spare part
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import type { ShippingStatistics as IShippingStatistics } from '../types/shipping.types';

interface ShippingStatisticsProps {
  shippingStats?: IShippingStatistics;
  returStats?: IShippingStatistics;
  isLoading?: boolean;
  error?: Error | null;
}

export const ShippingStatistics = ({
  shippingStats,
  returStats,
  isLoading,
  error,
}: ShippingStatisticsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="card-shadow animate-slide-up">
            <CardContent className="pt-6">
              <Loading />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 card-shadow animate-slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Error memuat statistics: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const shippingTotal = shippingStats?.total_shipping || 0;
  const requestGudang = shippingStats?.request_gudang || 0;
  const prosesKirim = shippingStats?.proses_kirim || 0;
  const selesai = shippingStats?.selesai || 0;
  const returTotal = returStats?.total_retur || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {/* Total Shipping */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Shipping</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{shippingTotal}</div>
          <p className="text-xs text-muted-foreground">Total pengiriman spare part</p>
        </CardContent>
      </Card>

      {/* Request Gudang */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Request Gudang</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{requestGudang}</div>
          <p className="text-xs text-muted-foreground">Menunggu dari gudang</p>
        </CardContent>
      </Card>

      {/* Proses Kirim */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proses Kirim</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{prosesKirim}</div>
          <p className="text-xs text-muted-foreground">Sedang dalam pengiriman</p>
        </CardContent>
      </Card>

      {/* Selesai */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{selesai}</div>
          <p className="text-xs text-muted-foreground">Sudah sampai tujuan</p>
        </CardContent>
      </Card>

      {/* Total Retur */}
      <Card className="card-shadow animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Retur</CardTitle>
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{returTotal}</div>
          <p className="text-xs text-muted-foreground">Total retur spare part</p>
        </CardContent>
      </Card>
    </div>
  );
};

