/**
 * Shipping Detail Modal Component
 * Menampilkan detail data shipping dan gambar
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import type { ShippingSparePart, ReturSparePart } from '../types/shipping.types';
import { shippingApiClient } from '@/shared/lib/api';

interface ShippingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShippingSparePart | ReturSparePart | null;
  type: 'shipping' | 'retur';
}

export const ShippingDetailModal = ({
  open,
  onOpenChange,
  data,
  type,
}: ShippingDetailModalProps) => {
  if (!data) return null;

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    // Jika imagePath sudah full URL, return langsung
    if (imagePath.startsWith('http')) return imagePath;
    // Jika relative path, gabungkan dengan base URL
    const baseURL = import.meta.env.VITE_SHIPPING_SERVICES_URL || '';
    return `${baseURL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  const shippingData = type === 'shipping' ? (data as ShippingSparePart) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detail {type === 'shipping' ? 'Shipping' : 'Retur'} Spare Part
          </DialogTitle>
          <DialogDescription>Informasi lengkap data {type === 'shipping' ? 'shipping' : 'retur'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {type === 'shipping' && shippingData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Kirim</Label>
                  <p className="text-sm mt-1">
                    {shippingData.date ? format(new Date(shippingData.date), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <Label>Site ID</Label>
                  <p className="text-sm mt-1">{shippingData.site_id || '-'}</p>
                </div>
                <div>
                  <Label>Site Name</Label>
                  <p className="text-sm mt-1">{shippingData.site_name || '-'}</p>
                </div>
                <div>
                  <Label>Kode PR</Label>
                  <p className="text-sm mt-1">{shippingData.pr_code || '-'}</p>
                </div>
                <div>
                  <Label>Cluster</Label>
                  <p className="text-sm mt-1">{shippingData.cluster || shippingData.address?.cluster || '-'}</p>
                </div>
                <div>
                  <Label>Alamat</Label>
                  <p className="text-sm mt-1">{shippingData.address?.address || '-'}</p>
                </div>
                <div>
                  <Label>Problem</Label>
                  <p className="text-sm mt-1">{shippingData.problem?.problem || '-'}</p>
                </div>
                <div>
                  <Label>Sparepart Note</Label>
                  <p className="text-sm mt-1">{shippingData.sparepart_note || '-'}</p>
                </div>
                <div>
                  <Label>Ticket Number</Label>
                  <p className="text-sm mt-1">{shippingData.ticket_number || '-'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm mt-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        shippingData.status === 'selesai'
                          ? 'bg-green-100 text-green-800'
                          : shippingData.status === 'proses kirim'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {shippingData.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {shippingData.ticket_image && (
                  <div>
                    <Label>Ticket Image</Label>
                    <div className="mt-2">
                      <img
                        src={getImageUrl(shippingData.ticket_image) || ''}
                        alt="Ticket"
                        className="w-full h-auto rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  </div>
                )}
                {shippingData.resi_image && (
                  <div>
                    <Label>Resi Image</Label>
                    <div className="mt-2">
                      <img
                        src={getImageUrl(shippingData.resi_image) || ''}
                        alt="Resi"
                        className="w-full h-auto rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'retur' && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data).map(([key, value]) => {
                if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;
                return (
                  <div key={key}>
                    <Label>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Label>
                    <p className="text-sm mt-1">
                      {value !== null && value !== undefined ? String(value) : '-'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

