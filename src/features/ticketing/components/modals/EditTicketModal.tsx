/**
 * Edit Ticket Modal
 * Modal untuk edit: Site, Problem, PIC, Plan CM, Action
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertCircle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { siteApi, slaApi } from '../../services/ticketing.api';
import { SLABadge } from '../SLABadge';
import type { Ticket, EditTicketFormData, Problem, PIC, TicketType } from '../../types/ticketing.types';

interface EditTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket;
  ticketTypes: TicketType[];
  problems: Problem[];
  pics: PIC[];
  isSubmitting?: boolean;
  onSubmit: (data: EditTicketFormData) => void;
}

export const EditTicketModal = ({
  open,
  onOpenChange,
  ticket,
  ticketTypes,
  problems,
  pics,
  isSubmitting = false,
  onSubmit,
}: EditTicketModalProps) => {
  const [formData, setFormData] = useState<EditTicketFormData>({
    ticket_type_id: 0,
    date_down: '',
    site_id: '',
    problem_ids: [],
    pic_id: 0,
    plan_cm: '',
    action: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [siteSearch, setSiteSearch] = useState('');
  const [siteOpen, setSiteOpen] = useState(false);
  const [slaLoading, setSlaLoading] = useState(false);
  const [slaAvg, setSlaAvg] = useState<number | null | undefined>(undefined);

  // Fetch sites for combobox
  const { data: sitesData } = useQuery({
    queryKey: ['sites', siteSearch],
    queryFn: () => siteApi.getAll({ search: siteSearch, page: 1, limit: 50 }),
    enabled: open,
  });
  const sites = sitesData?.data ?? [];

  // Pre-populate form when modal opens
  useEffect(() => {
    if (open && ticket) {
      setFormData({
        ticket_type_id: ticket.ticket_type_id,
        date_down: ticket.date_down || '',
        site_id: ticket.site_id,
        problem_ids: ticket.problems?.map((p) => p.id).filter((id) => id > 0) ?? [],
        pic_id: ticket.pic_id ?? 0,
        plan_cm: ticket.plan_cm,
        action: ticket.action,
      });
      setSiteSearch('');
      setSlaAvg(ticket.sla_avg);
      setErrors({});
    }
  }, [open, ticket]);

  // Fetch SLA when site changes
  useEffect(() => {
    if (formData.site_id && open) {
      setSlaLoading(true);
      slaApi
        .getSLAByDate({ siteId: formData.site_id })
        .then((sla) => setSlaAvg(sla?.sla_avg ?? null))
        .catch(() => setSlaAvg(null))
        .finally(() => setSlaLoading(false));
    }
  }, [formData.site_id, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.ticket_type_id) newErrors.ticket_type_id = 'Pilih tipe ticket';
    if (!formData.date_down) newErrors.date_down = 'Pilih tanggal down';
    if (!formData.site_id) newErrors.site_id = 'Pilih site';
    if (formData.problem_ids.length === 0) newErrors.problem_ids = 'Pilih minimal 1 problem';
    if (!formData.pic_id) newErrors.pic_id = 'Pilih PIC';
    if (formData.plan_cm.length > 255) newErrors.plan_cm = 'Plan CM maksimal 255 karakter';
    if (!formData.action.trim()) newErrors.action = 'Action tidak boleh kosong';
    if (formData.action.length > 1000) newErrors.action = 'Action maksimal 1000 karakter';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleToggleProblem = (problemId: number) => {
    setFormData((prev) => ({
      ...prev,
      problem_ids: prev.problem_ids.includes(problemId)
        ? prev.problem_ids.filter((id) => id !== problemId)
        : [...prev.problem_ids, problemId],
    }));
  };

  const selectedSite = sites.find((s) => s.site_id === formData.site_id);

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ticket #{ticket.ticket_number}</DialogTitle>
          <DialogDescription>Ubah data ticket — tipe ticket, tanggal down, site, problem, PIC, plan CM, dan action</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Type */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-4">Tipe Ticket</h3>
            <div>
              <Label>
                Tipe Ticket *
                {ticketTypes.length > 0 && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    — {ticketTypes.length} tersedia
                  </span>
                )}
              </Label>
              <Select
                value={formData.ticket_type_id > 0 ? String(formData.ticket_type_id) : ''}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, ticket_type_id: Number(val) }));
                  setErrors((prev) => ({ ...prev, ticket_type_id: '' }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih tipe ticket" />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ticket_type_id && (
                <Alert variant="destructive" className="mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{errors.ticket_type_id}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Date Down & Site & SLA */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-4">Tanggal Down & Site & SLA</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-date_down">Tanggal Down *</Label>
                <Input
                  id="edit-date_down"
                  type="date"
                  value={formData.date_down}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, date_down: e.target.value }));
                    setErrors((prev) => ({ ...prev, date_down: '' }));
                  }}
                  className="mt-1"
                />
                {errors.date_down && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{errors.date_down}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div>
                <Label>Select Site *</Label>
                <Popover open={siteOpen} onOpenChange={setSiteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={siteOpen}
                      className="w-full justify-between mt-1"
                    >
                      {selectedSite
                        ? `${selectedSite.site_id} - ${selectedSite.site_name}`
                        : formData.site_id || 'Select site...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search site..."
                        value={siteSearch}
                        onValueChange={setSiteSearch}
                      />
                      <CommandEmpty>No site found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {sites.map((site) => (
                            <CommandItem
                              key={site.site_id}
                              value={site.site_id}
                              onSelect={(val) => {
                                setFormData((prev) => ({ ...prev, site_id: val }));
                                setSiteOpen(false);
                                setErrors((prev) => ({ ...prev, site_id: '' }));
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  formData.site_id === site.site_id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {site.site_id} - {site.site_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.site_id && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{errors.site_id}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label>SLA Avg</Label>
                <div className="mt-1 p-3 border rounded flex items-center">
                  {slaLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <SLABadge value={slaAvg} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Problem & Plan CM */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-4">
              Problems & Plan CM
              {formData.problem_ids.length > 0 && (
                <span className="ml-2 text-xs font-normal text-primary">
                  ({formData.problem_ids.length} dipilih)
                </span>
              )}
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Select Problems *</Label>
                <ScrollArea className="border rounded-md p-3 h-36">
                  <div className="space-y-2">
                    {problems.map((problem) => (
                      <div key={problem.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-problem-${problem.id}`}
                          checked={formData.problem_ids.includes(problem.id)}
                          onCheckedChange={() => {
                            handleToggleProblem(problem.id);
                            setErrors((prev) => ({ ...prev, problem_ids: '' }));
                          }}
                        />
                        <label
                          htmlFor={`edit-problem-${problem.id}`}
                          className="text-sm cursor-pointer flex-grow"
                        >
                          {problem.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {errors.problem_ids && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{errors.problem_ids}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="edit-plan_cm">Plan CM <span className="text-muted-foreground font-normal text-xs">(opsional)</span></Label>
                <Input
                  id="edit-plan_cm"
                  value={formData.plan_cm}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, plan_cm: e.target.value }));
                    setErrors((prev) => ({ ...prev, plan_cm: '' }));
                  }}
                  placeholder="Rencana corrective maintenance"
                  maxLength={255}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">{formData.plan_cm.length}/255</div>
                {errors.plan_cm && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{errors.plan_cm}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* PIC & Action */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-4">PIC & Action</h3>
            <div className="space-y-4">
              <div>
                <Label>
                  PIC (Person In Charge) *
                  {pics.length > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      — {pics.length} tersedia
                    </span>
                  )}
                </Label>
                <Select
                  value={formData.pic_id > 0 ? String(formData.pic_id) : ''}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, pic_id: Number(val) }));
                    setErrors((prev) => ({ ...prev, pic_id: '' }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih PIC" />
                  </SelectTrigger>
                  <SelectContent>
                    {pics.map((pic) => (
                      <SelectItem key={pic.id} value={String(pic.id)}>
                        {pic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pic_id && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{errors.pic_id}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="edit-action">Action *</Label>
                <Textarea
                  id="edit-action"
                  value={formData.action}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, action: e.target.value }));
                    setErrors((prev) => ({ ...prev, action: '' }));
                  }}
                  placeholder="Deskripsi action yang dilakukan"
                  maxLength={1000}
                  rows={4}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">{formData.action.length}/1000</div>
                {errors.action && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{errors.action}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
