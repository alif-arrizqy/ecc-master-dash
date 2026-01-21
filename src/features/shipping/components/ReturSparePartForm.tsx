/**
 * Retur Spare Part Form Component
 * Form untuk create dan update retur spare part
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ReturSparePartFormData } from '../types/shipping.types';

interface ReturSparePartFormProps {
  formData: ReturSparePartFormData;
  editingId?: number | null;
  isSubmitting?: boolean;
  onChange: (data: ReturSparePartFormData) => void;
  onSubmit: (data: ReturSparePartFormData) => void;
  onCancel: () => void;
  existingImage?: string | Array<string> | null; // URL gambar dari database (untuk edit mode)
}

export const ReturSparePartForm = ({
  formData,
  editingId,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
  existingImage,
}: ReturSparePartFormProps) => {
  const handleFileChange = (file: File | null) => {
    onChange({ ...formData, image: file });
  };

  // Create object URL for new uploaded file preview
  const newImageUrl = formData.image && formData.image instanceof File 
    ? URL.createObjectURL(formData.image) 
    : null;

  // Get image URLs from database (for edit mode)
  const getImageUrls = (image?: string | Array<string> | null) => {
    if (!image) return [];
    
    const baseURL = import.meta.env.VITE_SHIPPING_SERVICES_URL || '';
    const cleanBaseURL = baseURL.replace(/\/$/, '');

    if (Array.isArray(image)) {
      return image.map((img) => {
        if (typeof img === 'string') {
          if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
          const cleanImagePath = img.startsWith('/') ? img : `/${img}`;
          return `${cleanBaseURL}${cleanImagePath}`;
        }
        return '';
      }).filter(Boolean);
    }

    if (typeof image === 'string') {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return [image];
      }
      const cleanImagePath = image.startsWith('/') ? image : `/${image}`;
      return [`${cleanBaseURL}${cleanImagePath}`];
    }

    return [];
  };

  const existingImageUrls = getImageUrls(existingImage);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tanggal Pengembalian *</Label>
          <Input
            type="date"
            value={formData.date || ''}
            onChange={(e) => onChange({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Shipper *</Label>
          <Input
            value={formData.shipper || ''}
            onChange={(e) => onChange({ ...formData, shipper: e.target.value })}
            placeholder="Nama shipper"
            required
          />
        </div>
      </div>

      <div>
        <Label>Asal Spare Part *</Label>
        <Input
          value={formData.source_spare_part || ''}
          onChange={(e) => onChange({ ...formData, source_spare_part: e.target.value })}
          placeholder="Asal spare part"
          required
        />
      </div>

      <div>
        <Label>List Barang *</Label>
        <Textarea
          value={formData.list_spare_part || ''}
          onChange={(e) => onChange({ ...formData, list_spare_part: e.target.value })}
          placeholder="Masukkan list barang (bisa JSON array atau string)"
          rows={4}
          required
        />
      </div>

      <div>
        <Label>Gambar</Label>
        <div className="mt-2 space-y-2">
          {/* Preview existing images from database */}
          {existingImageUrls.length > 0 && !formData.image && (
            <div className="space-y-2">
              {existingImageUrls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-auto rounded-lg border-2 border-border shadow-sm object-cover max-h-96 cursor-pointer hover:opacity-90 transition-all hover:shadow-md"
                      onClick={() => {
                        window.open(url, '_blank');
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                              <svg class="h-12 w-12 text-muted-foreground/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p class="text-sm text-muted-foreground text-center font-medium">Gambar tidak dapat dimuat</p>
                              <p class="text-xs text-muted-foreground/70 text-center mt-2 break-all px-2">URL: ${url || 'N/A'}</p>
                            </div>
                          `;
                        }
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
                  {existingImageUrls.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Gambar {index + 1} dari {existingImageUrls.length}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Gambar saat ini</p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              handleFileChange(file);
            }}
          />
          {/* Preview new uploaded file */}
          {formData.image && formData.image instanceof File && newImageUrl && (
            <div className="space-y-2">
              <div className="relative group">
                <img
                  src={newImageUrl}
                  alt="New Preview"
                  className="w-full h-auto rounded-lg border-2 border-border shadow-sm object-cover max-h-96 cursor-pointer hover:opacity-90 transition-all hover:shadow-md"
                  onClick={() => {
                    window.open(newImageUrl, '_blank');
                  }}
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                    Klik untuk full size
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  File baru: {formData.image.name}
                </p>
                {existingImageUrls.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    (Gambar lama akan diganti)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          placeholder="Catatan tambahan (opsional)"
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button onClick={() => onSubmit(formData)} disabled={isSubmitting}>
          {editingId ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </div>
  );
};
