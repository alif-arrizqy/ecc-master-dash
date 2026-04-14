import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/lib/utils';

export interface DateTimeParts {
  date: Date | undefined;
  time: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseHm(time: string): { h: string; m: string } {
  const [a, b] = (time || '00:00').split(':');
  const hn = Math.min(23, Math.max(0, parseInt(a || '0', 10) || 0));
  const mn = Math.min(59, Math.max(0, parseInt(b || '0', 10) || 0));
  return { h: String(hn).padStart(2, '0'), m: String(mn).padStart(2, '0') };
}

export function combineDateTime(parts: DateTimeParts): Date | null {
  if (!parts.date || !parts.time) return null;
  const { h, m } = parseHm(parts.time);
  const hi = parseInt(h, 10);
  const mi = parseInt(m, 10);
  const d = new Date(parts.date);
  d.setHours(hi, mi, 0, 0);
  return d;
}

interface DateTimePickerFieldProps {
  label: string;
  value: DateTimeParts;
  onChange: (v: DateTimeParts) => void;
  className?: string;
}

export function DateTimePickerField({ label, value, onChange, className }: DateTimePickerFieldProps) {
  const { h, m } = parseHm(value.time);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('justify-start text-left font-normal sm:min-w-[200px]')}>
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {value.date ? (
                format(value.date, 'd MMM yyyy', { locale: id })
              ) : (
                <span className="text-muted-foreground">Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value.date}
              onSelect={(d) => onChange({ ...value, date: d })}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Jam</span>
            <Select
              value={h}
              onValueChange={(nh) => onChange({ ...value, time: `${nh}:${m}` })}
            >
              <SelectTrigger className="w-[88px]">
                <SelectValue placeholder="Jam" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                {HOURS.map((hh) => (
                  <SelectItem key={hh} value={hh}>
                    {hh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="hidden sm:inline pb-2 text-muted-foreground">:</span>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Menit</span>
            <Select
              value={m}
              onValueChange={(nm) => onChange({ ...value, time: `${h}:${nm}` })}
            >
              <SelectTrigger className="w-[88px]">
                <SelectValue placeholder="Menit" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                {MINUTES.map((mm) => (
                  <SelectItem key={mm} value={mm}>
                    {mm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
