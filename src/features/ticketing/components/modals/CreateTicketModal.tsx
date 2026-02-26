/**
 * Create Ticket Modal
 * Modal untuk membuat ticket baru dengan 8 fields
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSLADateRange } from "@/shared/lib/dateUtils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { siteApi, slaApi } from "../../services/ticketing.api";
import { SLABadge } from "../SLABadge";
import type {
    CreateTicketFormData,
    TicketType,
    Problem,
    PIC,
    Site,
} from "../../types/ticketing.types";

interface CreateTicketModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticketTypes: TicketType[];
    problems: Problem[];
    pics: PIC[];
    isSubmitting?: boolean;
    onSubmit: (data: CreateTicketFormData) => void;
}

export const CreateTicketModal = ({
    open,
    onOpenChange,
    ticketTypes,
    problems,
    pics,
    isSubmitting = false,
    onSubmit,
}: CreateTicketModalProps) => {
    const [formData, setFormData] = useState<CreateTicketFormData>({
        ticket_type_id: 0,
        date_down: new Date().toISOString().split("T")[0],
        site_id: "",
        problem_ids: [],
        plan_cm: "",
        pic_id: 0,
        action: "",
        sla_avg: null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [siteSearch, setSiteSearch] = useState("");
    const [siteOpen, setSiteOpen] = useState(false);
    const [slaLoading, setSlaLoading] = useState(false);

    const { data: sitesData, isLoading: sitesLoading } = useQuery({
        queryKey: ["sites-all"], // fixed key - only fetch once
        queryFn: () =>
            siteApi.getAll({
                page: 1,
                limit: 100, // fetch all sites
            }),
        enabled: open,
        staleTime: 5 * 60 * 1000, // cache for 5 minutes
    });

    // Client-side only filtering - NO API calls during search
    const filteredSites = useMemo(() => {
        const base: Site[] = sitesData?.data || [];
        if (!siteSearch.trim()) return base;
        const term = siteSearch.toUpperCase().trim();
        // Search BOTH site_id and site_name
        return base.filter(
            (s) =>
                (s.site_id || "").toUpperCase().includes(term) ||
                (s.site_name || "").toUpperCase().includes(term),
        );
    }, [sitesData?.data, siteSearch]);
    // Fetch SLA when site changes - use proper date range from dateUtils
    useEffect(() => {
        if (formData.site_id && open) {
            setSlaLoading(true);
            // Get proper date range for SLA query (automatically handles date logic based on today)
            const dateRange = getSLADateRange();
            slaApi
                .getSLAByDate({
                    siteId: formData.site_id,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                })
                .then((sla) => {
                    setFormData((prev) => ({
                        ...prev,
                        sla_avg: sla?.sla_avg ?? null, // use ?? to preserve 0 values
                    }));
                })
                .catch((error) => {
                    console.warn("Failed to fetch SLA:", error);
                    setFormData((prev) => ({
                        ...prev,
                        sla_avg: null,
                    }));
                })
                .finally(() => setSlaLoading(false));
        }
    }, [formData.site_id, open]);

    useEffect(() => {
        if (open) {
            setFormData({
                ticket_type_id: 0,
                date_down: new Date().toISOString().split("T")[0],
                site_id: "",
                problem_ids: [],
                plan_cm: "",
                pic_id: 0,
                action: "",
                sla_avg: null,
            });
            setSiteSearch("");
            setErrors({});
            setSlaLoading(false);
        }
    }, [open]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.ticket_type_id) {
            newErrors.ticket_type_id = "Pilih ticket type";
        }
        if (!formData.date_down) {
            newErrors.date_down = "Pilih date down";
        }
        const selectedDate = new Date(formData.date_down);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
            newErrors.date_down = "Date tidak boleh melebihi hari ini";
        }
        if (!formData.site_id) {
            newErrors.site_id = "Pilih site";
        }
        if (formData.problem_ids.length === 0) {
            newErrors.problem_ids = "Pilih minimal 1 problem";
        }
        if (formData.plan_cm.length > 255) {
            newErrors.plan_cm = "Plan CM maksimal 255 karakter";
        }
        if (!formData.pic_id) {
            newErrors.pic_id = "Pilih PIC";
        }
        if (!formData.action.trim()) {
            newErrors.action = "Action tidak boleh kosong";
        }
        if (formData.action.length > 1000) {
            newErrors.action = "Action maksimal 1000 karakter";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    const handleToggleProblem = (problemId: number) => {
        setFormData((prev) => ({
            ...prev,
            problem_ids: prev.problem_ids.includes(problemId)
                ? prev.problem_ids.filter((id) => id !== problemId)
                : [...prev.problem_ids, problemId],
        }));
    };

    const allSites: Site[] = sitesData?.data || [];
    const selectedSite = allSites.find((s) => s.site_id === formData.site_id);
    const selectedTicketType = ticketTypes.find(
        (t) => t.id === formData.ticket_type_id,
    );
    const selectedPic = pics.find((p) => p.id === formData.pic_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Trouble Ticket</DialogTitle>
                    <DialogDescription>
                        Buat ticket baru untuk trouble ticket system
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Ticket & Date info */}
                    <div className="border-b pb-4">
                        <h3 className="font-semibold mb-4">
                            Ticket & Date Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Ticket Type */}
                            <div>
                                <Label htmlFor="ticket_type">
                                    Ticket Type *
                                    {ticketTypes.length > 0 && (
                                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                                            — {ticketTypes.length} tersedia
                                        </span>
                                    )}
                                </Label>
                                <Select
                                    value={
                                        formData.ticket_type_id > 0
                                            ? String(formData.ticket_type_id)
                                            : ""
                                    }
                                    onValueChange={(value) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            ticket_type_id: Number(value),
                                        }));
                                        if (errors.ticket_type_id) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                ticket_type_id: "",
                                            }));
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis ticket..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ticketTypes.map((type) => (
                                            <SelectItem
                                                key={type.id}
                                                value={String(type.id)}
                                            >
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.ticket_type_id && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.ticket_type_id}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Date Down */}
                            <div>
                                <Label htmlFor="date_down">Date Down *</Label>
                                <Input
                                    id="date_down"
                                    type="date"
                                    value={formData.date_down}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            date_down: e.target.value,
                                        }));
                                        if (errors.date_down) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                date_down: "",
                                            }));
                                        }
                                    }}
                                    max={new Date().toISOString().split("T")[0]}
                                />
                                {errors.date_down && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.date_down}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Site & SLA info */}
                    <div className="border-b pb-4">
                        <h3 className="font-semibold mb-4">Site & SLA Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Name Site */}
                            <div>
                                <Label>Select Site *</Label>
                                {sitesLoading && (
                                    <div className="text-xs text-muted-foreground mb-2">
                                        Loading sites...
                                    </div>
                                )}
                                <Popover
                                    open={siteOpen}
                                    onOpenChange={setSiteOpen}
                                    modal={false}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={siteOpen}
                                            className="w-full justify-between"
                                            disabled={sitesLoading}
                                        >
                                            {selectedSite
                                                ? `${selectedSite.site_id?.toUpperCase()} - ${selectedSite.site_name?.toUpperCase().replace("_", " ")}`
                                                : "Select site..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search by site ID or name..."
                                                value={siteSearch}
                                                onValueChange={setSiteSearch}
                                            />
                                            <CommandEmpty>
                                                {sitesLoading
                                                    ? "Loading sites..."
                                                    : "No site found."}
                                            </CommandEmpty>
                                            <CommandList>
                                                <CommandGroup>
                                                    {filteredSites.length ===
                                                        0 && !sitesLoading ? (
                                                        <div className="p-2 text-xs text-muted-foreground">
                                                            No results matching
                                                            "{siteSearch}"
                                                        </div>
                                                    ) : (
                                                        filteredSites.map(
                                                            (site) => (
                                                                <CommandItem
                                                                    key={
                                                                        site.site_id
                                                                    }
                                                                    value={
                                                                        site.site_id
                                                                    }
                                                                    onSelect={(
                                                                        currentValue,
                                                                    ) => {
                                                                        setFormData(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                site_id:
                                                                                    currentValue,
                                                                            }),
                                                                        );
                                                                        setSiteOpen(
                                                                            false,
                                                                        );
                                                                        if (
                                                                            errors.site_id
                                                                        ) {
                                                                            setErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    site_id:
                                                                                        "",
                                                                                }),
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.site_id ===
                                                                                site.site_id
                                                                                ? "opacity-100"
                                                                                : "opacity-0",
                                                                        )}
                                                                    />
                                                                    {site.site_id?.toUpperCase()}{" "}
                                                                    -{" "}
                                                                    {site.site_name
                                                                        ?.toUpperCase()
                                                                        .replace(
                                                                            "_",
                                                                            " ",
                                                                        )}
                                                                </CommandItem>
                                                            ),
                                                        )
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.site_id && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.site_id}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* SLA Avg */}
                            <div>
                                <Label>SLA Avg</Label>
                                <div className="mt-2 p-3 border rounded flex items-center justify-between">
                                    {slaLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">
                                                Loading...
                                            </span>
                                        </div>
                                    ) : (
                                        <SLABadge value={formData.sla_avg} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Problem & Plan CM */}
                    <div className="border-b pb-4">
                        <h3 className="font-semibold mb-4">
                            Problem & Plan CM
                        </h3>
                        <div className="space-y-4">
                            {/* Problem */}
                            <div>
                                <Label className="mb-2 block">
                                    Select Problems *
                                    {formData.problem_ids.length > 0 && (
                                        <span className="ml-2 text-xs font-normal text-primary">
                                            ({formData.problem_ids.length}{" "}
                                            dipilih)
                                        </span>
                                    )}
                                </Label>
                                <ScrollArea className="border rounded-md p-3 h-40">
                                    <div className="space-y-2">
                                        {problems.map((problem) => (
                                            <div
                                                key={problem.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={`problem-${problem.id}`}
                                                    checked={formData.problem_ids.includes(
                                                        problem.id,
                                                    )}
                                                    onCheckedChange={() => {
                                                        handleToggleProblem(
                                                            problem.id,
                                                        );
                                                        if (
                                                            errors.problem_ids
                                                        ) {
                                                            setErrors(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    problem_ids:
                                                                        "",
                                                                }),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`problem-${problem.id}`}
                                                    className="text-sm cursor-pointer flex-grow"
                                                >
                                                    {problem.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                {errors.problem_ids && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.problem_ids}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Plan CM */}
                            <div>
                                <Label htmlFor="plan_cm">Plan CM <span className="text-muted-foreground font-normal text-xs">(opsional)</span></Label>
                                <Input
                                    id="plan_cm"
                                    value={formData.plan_cm}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            plan_cm: e.target.value,
                                        }));
                                        if (errors.plan_cm) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                plan_cm: "",
                                            }));
                                        }
                                    }}
                                    placeholder="e.g., Replace battery tomorrow"
                                    maxLength={255}
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    {formData.plan_cm.length}/255
                                </div>
                                {errors.plan_cm && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.plan_cm}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact & Action */}
                    <div className="border-b pb-4">
                        <h3 className="font-semibold mb-4">Contact & Action</h3>
                        <div className="space-y-4">
                            {/* PIC */}
                            <div>
                                <Label htmlFor="pic">
                                    PIC (Person In Charge) *
                                    {pics.length > 0 && (
                                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                                            — {pics.length} tersedia
                                        </span>
                                    )}
                                </Label>
                                <Select
                                    value={
                                        formData.pic_id > 0
                                            ? String(formData.pic_id)
                                            : ""
                                    }
                                    onValueChange={(value) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            pic_id: Number(value),
                                        }));
                                        if (errors.pic_id) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                pic_id: "",
                                            }));
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih penanggung jawab..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pics.map((pic) => (
                                            <SelectItem
                                                key={pic.id}
                                                value={String(pic.id)}
                                            >
                                                {pic.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.pic_id && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.pic_id}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Action */}
                            <div>
                                <Label htmlFor="action">Action *</Label>
                                <Textarea
                                    id="action"
                                    value={formData.action}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            action: e.target.value,
                                        }));
                                        if (errors.action) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                action: "",
                                            }));
                                        }
                                    }}
                                    placeholder="Describe the issue and initial action taken..."
                                    maxLength={1000}
                                    rows={4}
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    {formData.action.length}/1000
                                </div>
                                {errors.action && (
                                    <Alert
                                        variant="destructive"
                                        className="mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                        <AlertDescription className="text-xs">
                                            {errors.action}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Ticket"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
