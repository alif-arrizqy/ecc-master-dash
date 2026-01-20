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
}

export const ReturSparePartForm = ({
  formData,
  editingId,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: ReturSparePartFormProps) => {
  // Karena struktur table return_spare_part belum diketahui,
  // kita buat form generic yang bisa diisi semua field
  // User bisa menambahkan field sesuai kebutuhan

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  // Daftar field yang umum digunakan (bisa disesuaikan)
  const commonFields = [
    { key: 'date', label: 'Tanggal Retur', type: 'date' },
    { key: 'site_id', label: 'Site ID', type: 'text' },
    { key: 'sparepart_name', label: 'Nama Sparepart', type: 'text' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'reason', label: 'Alasan Retur', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'text' },
  ];

  return (
    <div className="space-y-4">
      {commonFields.map((field) => {
        const value = formData[field.key];
        
        if (field.type === 'textarea') {
          return (
            <div key={field.key}>
              <Label>{field.label}</Label>
              <Textarea
                value={value !== null && value !== undefined ? String(value) : ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={`Masukkan ${field.label.toLowerCase()}`}
              />
            </div>
          );
        }
        
        if (field.type === 'number') {
          return (
            <div key={field.key}>
              <Label>{field.label}</Label>
              <Input
                type="number"
                value={value !== null && value !== undefined ? String(value) : ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : null)}
                placeholder={`Masukkan ${field.label.toLowerCase()}`}
              />
            </div>
          );
        }
        
        return (
          <div key={field.key}>
            <Label>{field.label}</Label>
            <Input
              type={field.type}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Masukkan ${field.label.toLowerCase()}`}
            />
          </div>
        );
      })}

      {/* Field tambahan bisa ditambahkan di sini */}
      {/* Contoh: */}
      {/* 
      <div>
        <Label>Field Tambahan</Label>
        <Input
          value={formData.field_tambahan || ''}
          onChange={(e) => handleFieldChange('field_tambahan', e.target.value)}
        />
      </div>
      */}

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

