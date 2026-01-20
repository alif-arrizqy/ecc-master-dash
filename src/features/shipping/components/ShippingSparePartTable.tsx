/**
 * Shipping Spare Part Table Component
 * Table untuk menampilkan data shipping spare part dengan status update
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { ShippingSparePart } from '../types/shipping.types';

interface ShippingSparePartTableProps {
  data: ShippingSparePart[];
  isLoading?: boolean;
  onView: (item: ShippingSparePart) => void;
  onEdit: (item: ShippingSparePart) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: 'request gudang' | 'proses kirim' | 'selesai') => void;
}

export const ShippingSparePartTable = ({
  data,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: ShippingSparePartTableProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Memuat data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak ada data
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal Kirim</TableHead>
            <TableHead>Site ID</TableHead>
            <TableHead>Site Name</TableHead>
            <TableHead>Kode PR</TableHead>
            <TableHead>Cluster</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Problem</TableHead>
            <TableHead>Sparepart Note</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell className="font-medium">{item.site_id || '-'}</TableCell>
              <TableCell>{item.site_name || '-'}</TableCell>
              <TableCell>{item.pr_code || '-'}</TableCell>
              <TableCell>{item.cluster || item.address?.cluster || '-'}</TableCell>
              <TableCell>{item.address?.address || '-'}</TableCell>
              <TableCell>{item.problem?.problem || '-'}</TableCell>
              <TableCell className="max-w-xs truncate">
                {item.sparepart_note || '-'}
              </TableCell>
              <TableCell>
                <Select
                  value={item.status}
                  onValueChange={(value: 'request gudang' | 'proses kirim' | 'selesai') =>
                    onStatusChange(item.id, value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="request gudang">Request Gudang</SelectItem>
                    <SelectItem value="proses kirim">Proses Kirim</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

