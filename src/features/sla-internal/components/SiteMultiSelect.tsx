import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/lib/utils';
import type { ResolvedLoggerSite } from '../lib/resolve-logger-sites';

interface SiteMultiSelectProps {
  label?: string;
  options: ResolvedLoggerSite[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export function SiteMultiSelect({
  label = 'Site',
  options,
  selectedIds,
  onChange,
  disabled,
  className,
}: SiteMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const summary =
    selectedIds.length === 0
      ? 'Pilih satu atau lebih site…'
      : `${selectedIds.length} site dipilih`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || options.length === 0}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{summary}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,440px)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Cari site…" />
            <CommandList>
              <CommandEmpty>Tidak ada site (periksa filter baterai / join master sites).</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const sel = selectedIds.includes(o.loggerId);
                  return (
                    <CommandItem key={o.loggerId} value={o.label} onSelect={() => toggle(o.loggerId)}>
                      <Check className={cn('mr-2 h-4 w-4', sel ? 'opacity-100' : 'opacity-0')} />
                      {o.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
