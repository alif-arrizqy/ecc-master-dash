/**
 * Shipping Detail Modal Component
 * Menampilkan detail data shipping dan gambar dengan UI yang lebih cantik
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Package, MapPin, AlertCircle, FileText, Truck, CheckCircle, Clock, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ShippingSparePart, ReturSparePart } from '../types/shipping.types';

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
    if (!imagePath) {
      console.warn('Image path is empty');
      return null;
    }
    
    // Jika imagePath sudah full URL, return langsung
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('Image URL (full):', imagePath);
      return imagePath;
    }
    
    // Jika relative path, gabungkan dengan base URL
    const baseURL = import.meta.env.VITE_SHIPPING_SERVICES_URL || '';
    
    if (!baseURL) {
      console.error('VITE_SHIPPING_SERVICES_URL is not set in environment variables!');
      console.warn('Image path:', imagePath);
      return null;
    }
    
    // Pastikan baseURL tidak ada trailing slash dan imagePath sudah ada leading slash
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    const cleanImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    const fullUrl = `${cleanBaseURL}${cleanImagePath}`;
    console.log('Image URL constructed:', {
      baseURL,
      cleanBaseURL,
      imagePath,
      cleanImagePath,
      fullUrl
    });
    return fullUrl;
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
      'SELESAI': { label: 'Selesai', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', icon: CheckCircle },
      'selesai': { label: 'Selesai', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', icon: CheckCircle },
      'PROSES_KIRIM': { label: 'Proses Kirim', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Truck },
      'proses kirim': { label: 'Proses Kirim', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Truck },
      'REQUEST_GUDANG': { label: 'Request Gudang', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: Clock },
      'request gudang': { label: 'Request Gudang', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: Clock },
    };
    
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: AlertCircle };
  };

  const shippingData = type === 'shipping' ? (data as ShippingSparePart) : null;
  const statusInfo = shippingData ? getStatusInfo(shippingData.status) : null;
  const StatusIcon = statusInfo?.icon || AlertCircle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={data?.id || 'modal'}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {type === 'shipping' ? (
                  <Truck className="h-5 w-5 text-primary" />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  Detail {type === 'shipping' ? 'Shipping' : 'Retur'} Spare Part
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Informasi lengkap data {type === 'shipping' ? 'shipping' : 'retur'} spare part
                </DialogDescription>
              </div>
            </div>
            {statusInfo && (
              <Badge className={cn('px-3 py-1.5 flex items-center gap-2 border', statusInfo.color)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusInfo.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {type === 'shipping' && shippingData && (
            <>
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Package className="h-4 w-4" />
                  Shipping
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tanggal Kirim</Label>
                    <p className="text-sm font-medium">
                      {shippingData.date ? format(new Date(shippingData.date), 'dd MMMM yyyy') : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{statusInfo?.label || shippingData.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Site Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <MapPin className="h-4 w-4" />
                  Site
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Site ID</Label>
                    <p className="text-sm font-medium">{shippingData.site?.site_id || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nama Site</Label>
                    <p className="text-sm font-medium">{shippingData.site?.site_name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Kode PR</Label>
                    <p className="text-sm font-medium">{shippingData.site?.pr_code || '-'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <MapPin className="h-4 w-4" />
                  Alamat
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Province</Label>
                    <p className="text-sm font-medium">{shippingData.address?.province || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cluster</Label>
                    <p className="text-sm font-medium">{shippingData.address?.cluster || '-'}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Alamat Lengkap</Label>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {shippingData.address?.address_shipping || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Spare Part Notes */}
              {shippingData.sparepart_note && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <FileText className="h-4 w-4" />
                    Spare Part Notes
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {shippingData.sparepart_note}
                    </p>
                  </div>
                </div>
              )}

              {/* Problem */}
              {shippingData.problem?.problem_name && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <AlertCircle className="h-4 w-4" />
                      Problem
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-sm font-medium">{shippingData.problem.problem_name}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Tiket */}
              {(shippingData.ticket?.ticket_number || shippingData.ticket?.ticket_image) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <FileText className="h-4 w-4" />
                      Tiket
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {shippingData.ticket?.ticket_number && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nomor Tiket</Label>
                          <div className="p-3 bg-muted/50 rounded-lg border">
                            <p className="text-sm font-medium">{shippingData.ticket.ticket_number}</p>
                          </div>
                        </div>
                      )}
                      {shippingData.ticket?.ticket_image && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Capture Tiket</Label>
                          <div className="relative group">
                            <img
                              src={getImageUrl(shippingData.ticket.ticket_image) || ''}
                              alt="Capture Tiket"
                              className="w-full h-auto rounded-lg border-2 border-border shadow-sm object-cover max-h-96 cursor-pointer hover:opacity-90 transition-all hover:shadow-md"
                              onClick={() => {
                                const url = getImageUrl(shippingData.ticket?.ticket_image);
                                if (url) window.open(url, '_blank');
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const url = getImageUrl(shippingData.ticket?.ticket_image);
                                console.error('Failed to load ticket image:', {
                                  url,
                                  originalPath: shippingData.ticket?.ticket_image,
                                  error: e
                                });
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                                      <ImageIcon class="h-12 w-12 text-muted-foreground/50 mb-2" />
                                      <p class="text-sm text-muted-foreground text-center font-medium">Gambar tidak dapat dimuat</p>
                                      <p class="text-xs text-muted-foreground/70 text-center mt-2 break-all px-2">URL: ${url || 'N/A'}</p>
                                      <p class="text-xs text-muted-foreground/50 text-center mt-1">Path: ${shippingData.ticket?.ticket_image || 'N/A'}</p>
                                      <p class="text-xs text-muted-foreground/50 text-center mt-1">Base URL: ${import.meta.env.VITE_SHIPPING_SERVICES_URL || 'Not set'}</p>
                                    </div>
                                  `;
                                }
                              }}
                              onLoad={() => {
                                console.log('Ticket image loaded successfully:', getImageUrl(shippingData.ticket?.ticket_image));
                              }}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                Klik untuk full size
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Resi */}
              {(shippingData.resi?.resi_number || shippingData.resi?.resi_image) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Truck className="h-4 w-4" />
                      Resi
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {shippingData.resi?.resi_number && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nomor Resi</Label>
                          <div className="p-3 bg-muted/50 rounded-lg border">
                            <p className="text-sm font-medium">{shippingData.resi.resi_number}</p>
                          </div>
                        </div>
                      )}
                      {shippingData.resi?.resi_image && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Capture Resi</Label>
                          <div className="relative group">
                            <img
                              src={getImageUrl(shippingData.resi.resi_image) || ''}
                              alt="Capture Resi"
                              className="w-full h-auto rounded-lg border-2 border-border shadow-sm object-cover max-h-96 cursor-pointer hover:opacity-90 transition-all hover:shadow-md"
                              onClick={() => {
                                const url = getImageUrl(shippingData.resi?.resi_image);
                                if (url) window.open(url, '_blank');
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const url = getImageUrl(shippingData.resi?.resi_image);
                                console.error('Failed to load resi image:', {
                                  url,
                                  originalPath: shippingData.resi?.resi_image,
                                  error: e
                                });
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                                      <ImageIcon class="h-12 w-12 text-muted-foreground/50 mb-2" />
                                      <p class="text-sm text-muted-foreground text-center font-medium">Gambar tidak dapat dimuat</p>
                                      <p class="text-xs text-muted-foreground/70 text-center mt-2 break-all px-2">URL: ${url || 'N/A'}</p>
                                      <p class="text-xs text-muted-foreground/50 text-center mt-1">Path: ${shippingData.resi?.resi_image || 'N/A'}</p>
                                      <p class="text-xs text-muted-foreground/50 text-center mt-1">Base URL: ${import.meta.env.VITE_SHIPPING_SERVICES_URL || 'Not set'}</p>
                                    </div>
                                  `;
                                }
                              }}
                              onLoad={() => {
                                console.log('Resi image loaded successfully:', getImageUrl(shippingData.resi?.resi_image));
                              }}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                Klik untuk full size
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {type === 'retur' && (() => {
            const returData = data as ReturSparePart;
            
            // Format list_spare_part
            const formatListSparePart = (list?: string | Array<unknown>) => {
              if (!list) return '-';
              if (typeof list === 'string') {
                try {
                  const parsed = JSON.parse(list);
                  if (Array.isArray(parsed)) {
                    return parsed.map((item: unknown) => {
                      if (typeof item === 'object' && item !== null) {
                        return JSON.stringify(item);
                      }
                      return String(item);
                    }).join(', ');
                  }
                  return String(parsed);
                } catch {
                  return list;
                }
              }
              if (Array.isArray(list)) {
                return list.map((item) => {
                  if (typeof item === 'object' && item !== null) {
                    return JSON.stringify(item);
                  }
                  return String(item);
                }).join(', ');
              }
              return String(list);
            };

            // Get image URLs
            const getImageUrls = (image?: string | Array<string>) => {
              if (!image) return [];
              const baseURL = import.meta.env.VITE_SHIPPING_SERVICES_URL || '';
              
              if (Array.isArray(image)) {
                return image.map((img) => {
                  if (typeof img === 'string') {
                    if (img.startsWith('http')) return img;
                    const cleanBaseURL = baseURL.replace(/\/$/, '');
                    const cleanImagePath = img.startsWith('/') ? img : `/${img}`;
                    return `${cleanBaseURL}${cleanImagePath}`;
                  }
                  return null;
                }).filter((url): url is string => url !== null);
              }
              
              if (typeof image === 'string') {
                if (image.startsWith('http')) return [image];
                const cleanBaseURL = baseURL.replace(/\/$/, '');
                const cleanImagePath = image.startsWith('/') ? image : `/${image}`;
                return [`${cleanBaseURL}${cleanImagePath}`];
              }
              
              return [];
            };

            const imageUrls = getImageUrls(returData.image);
            const listText = formatListSparePart(returData.list_spare_part);

            return (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <Package className="h-4 w-4" />
                    Informasi Retur
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tanggal Pengembalian</Label>
                      <p className="text-sm font-medium">
                        {returData.date ? format(new Date(returData.date), 'dd MMMM yyyy') : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Shipper</Label>
                      <p className="text-sm font-medium">{returData.shipper || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Asal Spare Part</Label>
                      <p className="text-sm font-medium">{returData.source_spare_part || '-'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">List Barang</Label>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{listText || '-'}</p>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{returData.notes || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images */}
                {imageUrls.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <ImageIcon className="h-4 w-4" />
                        Gambar
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="space-y-2">
                            {/* <Label className="text-xs text-muted-foreground">Gambar {index + 1}</Label> */}
                            <div className="relative group">
                              <img
                                src={url}
                                alt={`Retur Spare Part ${index + 1}`}
                                className="w-full h-auto rounded-lg border-2 border-border shadow-sm object-cover max-h-96 cursor-pointer hover:opacity-90 transition-all hover:shadow-md"
                                onClick={() => window.open(url, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                                        <ImageIcon class="h-12 w-12 text-muted-foreground/50 mb-2" />
                                        <p class="text-sm text-muted-foreground text-center">Gambar tidak dapat dimuat</p>
                                        <p class="text-xs text-muted-foreground/70 text-center mt-1">URL: ${url}</p>
                                      </div>
                                    `;
                                  }
                                }}
                                loading="lazy"
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                  Klik untuk full size
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
