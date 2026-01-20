/**
 * Retur Spare Part Table Component
 * Table untuk menampilkan data retur spare part
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
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { ReturSparePart } from '../types/shipping.types';

interface ReturSparePartTableProps {
  data: ReturSparePart[];
  isLoading?: boolean;
  onView: (item: ReturSparePart) => void;
  onEdit: (item: ReturSparePart) => void;
  onDelete: (id: number) => void;
}

export const ReturSparePartTable = ({
  data,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: ReturSparePartTableProps) => {
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

  // Karena struktur table return_spare_part belum diketahui,
  // kita tampilkan semua field yang ada
  const getTableHeaders = () => {
    if (data.length === 0) return [];
    
    const firstItem = data[0];
    const headers = Object.keys(firstItem).filter(
      (key) => key !== 'id' && key !== 'created_at' && key !== 'updated_at'
    );
    
    return headers.slice(0, 8); // Limit to 8 columns untuk readability
  };

  const headers = getTableHeaders();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>
                {header.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {headers.map((header) => (
                <TableCell key={header}>
                  {item[header] !== null && item[header] !== undefined
                    ? String(item[header])
                    : '-'}
                </TableCell>
              ))}
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

