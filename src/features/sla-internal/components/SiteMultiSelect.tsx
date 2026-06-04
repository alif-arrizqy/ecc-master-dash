import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
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
  /** Gunakan `setState` langsung agar multi-pilih tidak tertimpa state lama (stale closure). */
  onChange: Dispatch<SetStateAction<number[]>>;
  /** Jika false, hanya satu site (SLA 2 / SLA 3). Default true (SLA 1). */
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SiteMultiSelect({
  label = 'Site',
  options,
  selectedIds,
  onChange,
  multiple = true,
  disabled,
  className,
}: SiteMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    if (!multiple) {
      onChange((prev) => {
        if (prev.length === 1 && prev[0] === id) return [];
        return [id];
      });
      setOpen(false);
      return;
    }
    onChange((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const singleLabel = useMemo(() => {
    if (multiple || selectedIds.length !== 1) return null;
    return options.find((o) => o.loggerId === selectedIds[0])?.label ?? null;
  }, [multiple, selectedIds, options]);

  const summary = multiple
    ? selectedIds.length === 0
      ? 'Pilih satu atau lebih site…'
      : `${selectedIds.length} site dipilih`
    : singleLabel
      ? singleLabel
      : 'Pilih satu site…';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <Popover modal={false} open={open} onOpenChange={setOpen}>
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
              <CommandEmpty>Tidak ada site (periksa filter baterai, status terestrial, dan join master sites).</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const sel = selectedIds.includes(o.loggerId);
                  return (
                    <CommandItem
                      key={o.loggerId}
                      value={`logger-${o.loggerId}`}
                      keywords={[o.label, o.siteName, o.siteId, o.nojsCode]}
                      onSelect={() => toggle(o.loggerId)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
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
