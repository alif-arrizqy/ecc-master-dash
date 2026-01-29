import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Plus,
    X,
    Upload,
    Trash2,
    ChevronsUpDown,
    Check,
    Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { sparepartApi } from "../services/sparepart.api";
import { PhotoGalleryModal } from "./PhotoGalleryModal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type {
    SparepartFormData,
    SparepartItem,
    SparepartType,
    SparepartRegion,
    Location,
    ContactPerson,
    SparepartMaster,
    SparepartPhoto,
} from "../types/sparepart.types";

interface SparepartFormProps {
    formData: SparepartFormData;
    editingId?: number | null;
    isSubmitting?: boolean;
    onChange: (data: SparepartFormData) => void;
    onSubmit: (data: SparepartFormData) => void;
    onCancel: () => void;
    existingPhotosStok?: SparepartPhoto[]; // Untuk edit mode - foto stok
    existingPhotosBekas?: SparepartPhoto[]; // Untuk edit mode - foto bekas
}

// SPAREPART_TYPES_OPTIONS sekarang diambil dari API (sparepartMasters)

export const SparepartForm = ({
    formData,
    editingId,
    isSubmitting,
    onChange,
    onSubmit,
    onCancel,
    existingPhotosStok = [],
    existingPhotosBekas = [],
}: SparepartFormProps) => {
    const [stokItems, setStokItems] = useState<SparepartItem[]>(
        formData.sparepartStok || [],
    );
    const [bekasItems, setBekasItems] = useState<SparepartItem[]>(
        formData.sparepartBekas || [],
    );
    const [stokPhotos, setStokPhotos] = useState<File[]>(
        formData.dokumentasiStok || [],
    );
    const [bekasPhotos, setBekasPhotos] = useState<File[]>(
        formData.dokumentasiBekas || [],
    );

    // State untuk location sudah tidak perlu popover

    // State untuk PIC popover
    const [picPopoverOpen, setPicPopoverOpen] = useState(false);
    const [picSearchQuery, setPicSearchQuery] = useState("");
    const [selectedContactPerson, setSelectedContactPerson] =
        useState<ContactPerson | null>(null);

    // State untuk photo gallery modal
    const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<SparepartPhoto[]>([]);

    const [selectedPhotoTitle, setSelectedPhotoTitle] = useState<string>("");

    // State for combobox in table (stok/bekas items)
    const [activeCombobox, setActiveCombobox] = useState<{
        type: "stok" | "bekas";
        index: number;
    } | null>(null);
    const [comboboxSearch, setComboboxSearch] = useState("");

    // Fetch locations berdasarkan region - enable saat region dipilih
    const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
        queryKey: ["sparepart-locations", formData.region],
        queryFn: () =>
            sparepartApi.getLocations({
                region: formData.region,
                page: 1,
                limit: 100,
            }),
        enabled: !!formData.region, // Enable saat region dipilih
    });

    // Fetch contact persons berdasarkan location_id - enable saat location_id ada
    const { data: contactPersonsData, isLoading: isLoadingContactPersons } =
        useQuery({
            queryKey: ["sparepart-contact-persons", formData.location_id],
            queryFn: () =>
                sparepartApi.getContactPersons({
                    location_id: formData.location_id,
                    page: 1,
                    limit: 100,
                }),
            enabled: !!formData.location_id, // Enable saat location_id ada
            // Enable saat location_id ada
        });

    const queryClient = useQueryClient();

    // Local state for existing photos to handle deletion
    const [localExistingStok, setLocalExistingStok] =
        useState<SparepartPhoto[]>(existingPhotosStok);
    const [localExistingBekas, setLocalExistingBekas] =
        useState<SparepartPhoto[]>(existingPhotosBekas);

    // Sync with props
    useEffect(() => {
        setLocalExistingStok(existingPhotosStok);
    }, [existingPhotosStok]);

    useEffect(() => {
        setLocalExistingBekas(existingPhotosBekas);
    }, [existingPhotosBekas]);

    const handleDeleteExistingPhoto = async (
        photo: SparepartPhoto,
        type: "stok" | "bekas",
    ) => {
        if (!confirm("Apakah anda yakin ingin menghapus foto ini?")) return;

        try {
            // Photo ID format: `${stockId}-stok-${idx}`
            const parts = photo.id.split("-");
            if (parts.length < 3) {
                toast.error("Invalid photo ID format");
                return;
            }

            const stockId = parseInt(parts[0]);
            const photoIndex = parseInt(parts[parts.length - 1]);

            if (formData.type === "tools_alker") {
                await sparepartApi.deleteToolsAlkerPhoto(stockId, photoIndex);
            } else {
                await sparepartApi.deleteSparepartPhoto(stockId, photoIndex);
            }

            toast.success("Foto berhasil dihapus");

            if (type === "stok") {
                setLocalExistingStok((prev) =>
                    prev.filter((p) => p.id !== photo.id),
                );
            } else {
                setLocalExistingBekas((prev) =>
                    prev.filter((p) => p.id !== photo.id),
                );
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal menghapus foto");
        }
    };

    // Mutation for creating new sparepart master
    const createMasterMutation = useMutation({
        mutationFn: (name: string) =>
            sparepartApi.createSparepartMaster({
                name,
                item_type:
                    formData.type === "tools_alker"
                        ? "TOOLS_ALKER"
                        : "SPAREPART",
            }),
        onSuccess: (newMaster) => {
            toast.success(`Sparepart ${newMaster.name} berhasil ditambahkan`);
            queryClient.invalidateQueries({ queryKey: ["sparepart-masters"] });
        },
        onError: (error) => {
            console.error("Failed to create master:", error);
            toast.error("Gagal menambahkan sparepart baru");
        },
    });

    // Fetch sparepart masters berdasarkan item_type
    // Untuk type 'stok' atau 'bekas', gunakan 'SPAREPART', untuk 'tools_alker' gunakan 'TOOLS_ALKER'
    const itemType =
        formData.type === "tools_alker" ? "TOOLS_ALKER" : "SPAREPART";
    const {
        data: sparepartMastersData,
        isLoading: isLoadingMasters,
        error: mastersError,
    } = useQuery({
        queryKey: ["sparepart-masters", itemType],
        queryFn: () =>
            sparepartApi.getSparepartMasters({
                item_type: itemType,
                page: 1,
                limit: 100,
            }),
        enabled:
            !!formData.type &&
            (formData.type === "stok" ||
                formData.type === "bekas" ||
                formData.type === "tools_alker"),
    });

    // Transform locations - get unique kabupaten
    const kabupatenList = useMemo(() => {
        const data = locationsData?.data;
        if (!data || !Array.isArray(data)) return [];

        const uniqueKabupaten = new Set<string>();
        (data as Location[]).forEach((location) => {
            if (location.regency) {
                uniqueKabupaten.add(location.regency);
            }
        });

        return Array.from(uniqueKabupaten).sort();
    }, [locationsData]);

    // Transform locations - get clusters berdasarkan kabupaten yang dipilih
    const clusterList = useMemo(() => {
        const data = locationsData?.data;
        if (!data || !Array.isArray(data)) return [];

        if (!formData.kabupaten) return [];

        const clusters = new Set<string>();
        (data as Location[]).forEach((location) => {
            if (location.regency === formData.kabupaten && location.cluster) {
                clusters.add(location.cluster);
            }
        });

        return Array.from(clusters).sort();
    }, [locationsData, formData.kabupaten]);

    // Find location_id berdasarkan kabupaten dan cluster yang dipilih
    const selectedLocation = useMemo(() => {
        const data = locationsData?.data;
        if (!data || !Array.isArray(data)) return null;
        if (!formData.kabupaten || !formData.cluster) return null;

        return (
            (data as Location[]).find(
                (location) =>
                    location.regency === formData.kabupaten &&
                    location.cluster === formData.cluster,
            ) || null
        );
    }, [locationsData, formData.kabupaten, formData.cluster]);

    // Transform contact persons
    const contactPersons = useMemo(() => {
        const data = contactPersonsData?.data;
        if (!data || !Array.isArray(data)) return [];

        if (!picSearchQuery.trim()) return data as ContactPerson[];

        const searchLower = picSearchQuery.toLowerCase().trim();
        return (data as ContactPerson[]).filter((cp) => {
            const pic = (cp.pic || "").toLowerCase();
            const phone = (cp.phone || "").toLowerCase();
            return pic.includes(searchLower) || phone.includes(searchLower);
        });
    }, [contactPersonsData, picSearchQuery]);

    // Transform sparepart masters
    const sparepartMasters = useMemo(() => {
        const data = sparepartMastersData?.data;
        if (!data || !Array.isArray(data)) {
            if (mastersError) {
                console.error("Error loading sparepart masters:", mastersError);
            }
            return [];
        }
        console.log(
            "Sparepart masters loaded:",
            data.length,
            "items for type:",
            itemType,
        );
        return data as SparepartMaster[];
    }, [sparepartMastersData, mastersError, itemType]);

    // Sync selectedContactPerson dengan formData
    useEffect(() => {
        if (formData.pic && contactPersons.length > 0) {
            const cp = contactPersons.find((c) => c.pic === formData.pic);
            if (
                cp &&
                (!selectedContactPerson || selectedContactPerson.id !== cp.id)
            ) {
                setSelectedContactPerson(cp);
                onChange({
                    ...formData,
                    kontak: cp.phone,
                });
            }
        } else if (!formData.pic) {
            setSelectedContactPerson(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.pic, contactPersons]);

    // Sync local state with formData only when formData changes from parent (not from our own updates)
    // Use ref to track if update came from us
    const isInternalUpdateRef = useRef(false);

    useEffect(() => {
        if (!isInternalUpdateRef.current) {
            setStokItems(formData.sparepartStok || []);
        }
        isInternalUpdateRef.current = false;
        setBekasPhotos(formData.dokumentasiBekas || []);
    }, [formData.sparepartStok, formData.dokumentasiBekas]);

    useEffect(() => {
        if (!isInternalUpdateRef.current) {
            setBekasItems(formData.sparepartBekas || []);
        }
        isInternalUpdateRef.current = false;
        setStokPhotos(formData.dokumentasiStok || []);
    }, [formData.sparepartBekas, formData.dokumentasiStok]);

    const handleAddSparepartItem = (type: "stok" | "bekas") => {
        const newItem: SparepartItem = {
            id: Date.now().toString(),
            name: "",
            quantity: 0,
            unit: "pcs",
            stock_type: type === "stok" ? "NEW_STOCK" : "USED_STOCK",
        };

        if (type === "stok") {
            const updated = [...stokItems, newItem];
            setStokItems(updated);
            onChange({ ...formData, sparepartStok: updated });
        } else {
            const updated = [...bekasItems, newItem];
            setBekasItems(updated);
            onChange({ ...formData, sparepartBekas: updated });
        }
    };

    const handleRemoveSparepartItem = (
        type: "stok" | "bekas",
        index: number,
    ) => {
        if (type === "stok") {
            const updated = stokItems.filter((_, i) => i !== index);
            setStokItems(updated);
            onChange({ ...formData, sparepartStok: updated });
        } else {
            const updated = bekasItems.filter((_, i) => i !== index);
            setBekasItems(updated);
            onChange({ ...formData, sparepartBekas: updated });
        }
    };

    const handleUpdateSparepartItem = (
        type: "stok" | "bekas",
        index: number,
        field: keyof SparepartItem,
        value: string | number,
    ) => {
        if (type === "stok") {
            const updated = [...stokItems];
            updated[index] = { ...updated[index], [field]: value };
            setStokItems(updated);
            onChange({ ...formData, sparepartStok: updated });
        } else {
            const updated = [...bekasItems];
            updated[index] = { ...updated[index], [field]: value };
            setBekasItems(updated);
            onChange({ ...formData, sparepartBekas: updated });
        }
    };

    const handlePhotoChange = (
        type: "stok" | "bekas",
        files: FileList | null,
    ) => {
        if (!files) return;

        const fileArray = Array.from(files);
        if (type === "stok") {
            const updated = [...stokPhotos, ...fileArray];
            setStokPhotos(updated);
            onChange({ ...formData, dokumentasiStok: updated });
        } else {
            const updated = [...bekasPhotos, ...fileArray];
            setBekasPhotos(updated);
            onChange({ ...formData, dokumentasiBekas: updated });
        }
    };

    const handleRemovePhoto = (type: "stok" | "bekas", index: number) => {
        if (type === "stok") {
            const updated = stokPhotos.filter((_, i) => i !== index);
            setStokPhotos(updated);
            onChange({ ...formData, dokumentasiStok: updated });
        } else {
            const updated = bekasPhotos.filter((_, i) => i !== index);
            setBekasPhotos(updated);
            onChange({ ...formData, dokumentasiBekas: updated });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!formData.location_id || !formData.region || !formData.type) {
            return;
        }

        // Validate sparepart items based on type
        if (
            formData.type === "stok" &&
            (!stokItems || stokItems.length === 0)
        ) {
            return;
        }
        if (
            formData.type === "bekas" &&
            (!bekasItems || bekasItems.length === 0)
        ) {
            return;
        }
        if (
            formData.type === "tools_alker" &&
            (!stokItems || stokItems.length === 0)
        ) {
            return;
        }

        onSubmit(formData);
    };

    // Section visibility
    // - Untuk create: dikontrol oleh `type`
    // - Untuk edit: jika data stok/bekas sudah ada, selalu tampilkan section terkait meskipun `type` bukan nilainya
    const showStokSection =
        formData.type === "stok" ||
        formData.type === "tools_alker" ||
        !!formData.sparepartStok?.length;

    const showBekasSection =
        formData.type === "bekas" || !!formData.sparepartBekas?.length;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="region">Region *</Label>
                        <Select
                            value={formData.region}
                            onValueChange={(value) => {
                                // Hanya reset jika user mengubah region secara explicit
                                onChange({
                                    ...formData,
                                    region: value as SparepartRegion,
                                    location_id: undefined,
                                    kabupaten: "",
                                    cluster: "",
                                    pic: "",
                                    kontak: "",
                                });
                                setSelectedContactPerson(null);
                            }}
                            required
                        >
                            <SelectTrigger id="region">
                                <SelectValue placeholder="Pilih Region" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="maluku">Maluku</SelectItem>
                                <SelectItem value="papua">Papua</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipe *</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) =>
                                onChange({
                                    ...formData,
                                    type: value as SparepartType,
                                })
                            }
                            required
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Pilih Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stok">
                                    Sparepart Stok
                                </SelectItem>
                                <SelectItem value="bekas">
                                    Sparepart Bekas
                                </SelectItem>
                                <SelectItem value="tools_alker">
                                    Tools Alat Kerja
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Location Select (Kabupaten & Cluster) */}
                {formData.region && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="kabupaten">Kabupaten *</Label>
                            <Select
                                value={formData.kabupaten}
                                onValueChange={(value) => {
                                    onChange({
                                        ...formData,
                                        kabupaten: value,
                                        cluster: "", // Reset cluster saat kabupaten berubah
                                        location_id: undefined,
                                        pic: "",
                                        kontak: "",
                                    });
                                    setSelectedContactPerson(null);
                                }}
                                disabled={isLoadingLocations}
                                required
                            >
                                <SelectTrigger id="kabupaten">
                                    <SelectValue
                                        placeholder={
                                            isLoadingLocations
                                                ? "Memuat..."
                                                : "Pilih Kabupaten"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {kabupatenList.length === 0 &&
                                        !isLoadingLocations && (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                Tidak ada data
                                            </div>
                                        )}
                                    {kabupatenList.map((kabupaten) => (
                                        <SelectItem
                                            key={kabupaten}
                                            value={kabupaten}
                                        >
                                            {kabupaten}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cluster">Cluster *</Label>
                            <Select
                                value={formData.cluster}
                                onValueChange={(value) => {
                                    // Find location immediately when cluster is selected
                                    const loc = locationsData?.data?.find(
                                        (l) =>
                                            l.regency === formData.kabupaten &&
                                            l.cluster === value,
                                    );

                                    onChange({
                                        ...formData,
                                        cluster: value,
                                        location_id: loc?.id,
                                        pic: "", // Reset PIC on manual location change
                                        kontak: "", // Reset Contact on manual location change
                                    });
                                    setSelectedContactPerson(null);
                                }}
                                disabled={
                                    !formData.kabupaten ||
                                    isLoadingLocations ||
                                    clusterList.length === 0
                                }
                                required
                            >
                                <SelectTrigger id="cluster">
                                    <SelectValue
                                        placeholder={
                                            !formData.kabupaten
                                                ? "Pilih Kabupaten terlebih dahulu"
                                                : isLoadingLocations
                                                  ? "Memuat..."
                                                  : "Pilih Cluster"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {clusterList.length === 0 &&
                                        formData.kabupaten &&
                                        !isLoadingLocations && (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                Tidak ada cluster
                                            </div>
                                        )}
                                    {clusterList.map((cluster) => (
                                        <SelectItem
                                            key={cluster}
                                            value={cluster}
                                        >
                                            {cluster}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* PIC Field - Select dari contact person atau input manual */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pic">PIC *</Label>
                        {formData.location_id && contactPersons.length > 0 ? (
                            <>
                                <Popover
                                    open={picPopoverOpen}
                                    onOpenChange={setPicPopoverOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                            disabled={isLoadingContactPersons}
                                            type="button"
                                        >
                                            {selectedContactPerson
                                                ? `${selectedContactPerson.pic} (${selectedContactPerson.phone})`
                                                : formData.pic ||
                                                  "Pilih PIC atau isi manual..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-full p-0"
                                        align="start"
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Cari PIC atau nomor telepon..."
                                                value={picSearchQuery}
                                                onValueChange={
                                                    setPicSearchQuery
                                                }
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {isLoadingContactPersons
                                                        ? "Memuat..."
                                                        : "PIC tidak ditemukan"}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="manual-input"
                                                        onSelect={() => {
                                                            setSelectedContactPerson(
                                                                null,
                                                            );
                                                            onChange({
                                                                ...formData,
                                                                pic: "",
                                                                kontak: "",
                                                            });
                                                            setPicPopoverOpen(
                                                                false,
                                                            );
                                                            setPicSearchQuery(
                                                                "",
                                                            );
                                                        }}
                                                        className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                Isi Manual
                                                            </span>
                                                            <span className="text-xs text-muted-foreground data-[selected=true]:text-accent-foreground/80">
                                                                Ketik nama dan
                                                                nomor telepon di
                                                                bawah
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                    {contactPersons.map(
                                                        (cp) => (
                                                            <CommandItem
                                                                key={cp.id}
                                                                value={`${cp.pic} ${cp.phone}`}
                                                                onSelect={() => {
                                                                    setSelectedContactPerson(
                                                                        cp,
                                                                    );
                                                                    onChange({
                                                                        ...formData,
                                                                        pic: cp.pic,
                                                                        kontak: cp.phone,
                                                                    });
                                                                    setPicPopoverOpen(
                                                                        false,
                                                                    );
                                                                    setPicSearchQuery(
                                                                        "",
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedContactPerson?.id ===
                                                                            cp.id
                                                                            ? "opacity-100"
                                                                            : "opacity-0",
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {cp.pic}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {
                                                                            cp.phone
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ),
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {/* Manual input jika user pilih manual atau tidak ada contact person */}
                                {!selectedContactPerson && (
                                    <Input
                                        id="pic-manual"
                                        value={formData.pic || ""}
                                        onChange={(e) =>
                                            onChange({
                                                ...formData,
                                                pic: e.target.value,
                                            })
                                        }
                                        placeholder="Masukkan nama PIC"
                                        required
                                        className="mt-2"
                                    />
                                )}
                            </>
                        ) : (
                            <Input
                                id="pic"
                                value={formData.pic || ""}
                                onChange={(e) =>
                                    onChange({
                                        ...formData,
                                        pic: e.target.value,
                                    })
                                }
                                placeholder="Masukkan nama PIC"
                                required
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="kontak">Kontak (Phone) *</Label>
                        <Input
                            id="kontak"
                            value={formData.kontak || ""}
                            onChange={(e) => {
                                // Format phone: 0812-3456-7890
                                const digitsOnly = e.target.value.replace(
                                    /\D/g,
                                    "",
                                ); // Remove non-digits
                                let formatted = digitsOnly;
                                if (
                                    digitsOnly.length > 4 &&
                                    digitsOnly.length <= 8
                                ) {
                                    formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
                                } else if (
                                    digitsOnly.length > 8 &&
                                    digitsOnly.length <= 12
                                ) {
                                    formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8)}`;
                                } else if (digitsOnly.length > 12) {
                                    formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8, 12)}`;
                                }
                                onChange({ ...formData, kontak: formatted });
                            }}
                            placeholder="0812-3456-7890"
                            maxLength={13}
                            required
                            disabled={
                                !!selectedContactPerson &&
                                !!formData.location_id &&
                                contactPersons.length > 0
                            }
                            className={
                                selectedContactPerson &&
                                formData.location_id &&
                                contactPersons.length > 0
                                    ? "bg-muted"
                                    : ""
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Sparepart Stok Section */}
            {showStokSection && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                            {formData.type === "tools_alker"
                                ? "Tools Alker"
                                : "Sparepart Stok"}
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSparepartItem("stok")}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Item
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        No
                                    </TableHead>
                                    <TableHead className="min-w-[150px]">
                                        Jenis Item
                                    </TableHead>
                                    <TableHead className="min-w-[200px]">
                                        Jenis Sparepart
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        Jumlah
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        Unit
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stokItems.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-muted-foreground h-24"
                                        >
                                            Belum ada item ditambahkan
                                        </TableCell>
                                    </TableRow>
                                )}
                                {stokItems.map((item, index) => (
                                    <TableRow key={item.id || index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={
                                                    item.stock_type ||
                                                    "NEW_STOCK"
                                                }
                                                onValueChange={(value) =>
                                                    handleUpdateSparepartItem(
                                                        "stok",
                                                        index,
                                                        "stock_type",
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Pilih jenis" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NEW_STOCK">
                                                        Baru
                                                    </SelectItem>
                                                    <SelectItem value="USED_STOCK">
                                                        Bekas
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Popover
                                                open={
                                                    activeCombobox?.type ===
                                                        "stok" &&
                                                    activeCombobox?.index ===
                                                        index
                                                }
                                                onOpenChange={(open) => {
                                                    if (open) {
                                                        setActiveCombobox({
                                                            type: "stok",
                                                            index,
                                                        });
                                                        setComboboxSearch("");
                                                    } else {
                                                        setActiveCombobox(null);
                                                    }
                                                }}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full h-8 justify-between font-normal",
                                                            !item.name &&
                                                                "text-muted-foreground",
                                                        )}
                                                        disabled={
                                                            isLoadingMasters ||
                                                            sparepartMasters.length ===
                                                                0
                                                        }
                                                    >
                                                        {item.name ||
                                                            (isLoadingMasters
                                                                ? "Memuat..."
                                                                : sparepartMasters.length ===
                                                                    0
                                                                  ? "Empty"
                                                                  : "Pilih sparepart")}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[300px] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Cari sparepart..."
                                                            value={
                                                                comboboxSearch
                                                            }
                                                            onValueChange={
                                                                setComboboxSearch
                                                            }
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {comboboxSearch ? (
                                                                    <div className="p-2">
                                                                        <p className="text-sm text-muted-foreground mb-2">
                                                                            "
                                                                            {
                                                                                comboboxSearch
                                                                            }
                                                                            "
                                                                            tidak
                                                                            ditemukan
                                                                        </p>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="w-full justify-start h-auto py-1 px-2"
                                                                            onClick={() => {
                                                                                createMasterMutation.mutate(
                                                                                    comboboxSearch,
                                                                                    {
                                                                                        onSuccess:
                                                                                            (
                                                                                                newMaster,
                                                                                            ) => {
                                                                                                // Auto select the new master
                                                                                                const updated =
                                                                                                    [
                                                                                                        ...stokItems,
                                                                                                    ];
                                                                                                updated[
                                                                                                    index
                                                                                                ] =
                                                                                                    {
                                                                                                        ...updated[
                                                                                                            index
                                                                                                        ],
                                                                                                        name: newMaster.name,
                                                                                                        id: String(
                                                                                                            newMaster.id,
                                                                                                        ),
                                                                                                    };
                                                                                                isInternalUpdateRef.current = true;
                                                                                                setStokItems(
                                                                                                    updated,
                                                                                                );
                                                                                                onChange(
                                                                                                    {
                                                                                                        ...formData,
                                                                                                        sparepartStok:
                                                                                                            updated,
                                                                                                    },
                                                                                                );
                                                                                                setActiveCombobox(
                                                                                                    null,
                                                                                                );
                                                                                            },
                                                                                    },
                                                                                );
                                                                            }}
                                                                            disabled={
                                                                                createMasterMutation.isPending
                                                                            }
                                                                        >
                                                                            <Plus className="mr-2 h-4 w-4" />
                                                                            {createMasterMutation.isPending
                                                                                ? "Menyimpan..."
                                                                                : `Buat baru: "${comboboxSearch}"`}
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    "Tidak ada data"
                                                                )}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {sparepartMasters.map(
                                                                    (
                                                                        master,
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                master.id
                                                                            }
                                                                            value={
                                                                                master.name
                                                                            }
                                                                            onSelect={(
                                                                                currentValue,
                                                                            ) => {
                                                                                const updated =
                                                                                    [
                                                                                        ...stokItems,
                                                                                    ];
                                                                                updated[
                                                                                    index
                                                                                ] =
                                                                                    {
                                                                                        ...updated[
                                                                                            index
                                                                                        ],
                                                                                        name: master.name,
                                                                                        id: String(
                                                                                            master.id,
                                                                                        ),
                                                                                    };
                                                                                isInternalUpdateRef.current = true;
                                                                                setStokItems(
                                                                                    updated,
                                                                                );
                                                                                onChange(
                                                                                    {
                                                                                        ...formData,
                                                                                        sparepartStok:
                                                                                            updated,
                                                                                    },
                                                                                );
                                                                                setActiveCombobox(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    item.name ===
                                                                                        master.name
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0",
                                                                                )}
                                                                            />
                                                                            {
                                                                                master.name
                                                                            }
                                                                        </CommandItem>
                                                                    ),
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-8"
                                                value={
                                                    Number.isNaN(item.quantity)
                                                        ? ""
                                                        : item.quantity
                                                }
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === "") {
                                                        handleUpdateSparepartItem(
                                                            "stok",
                                                            index,
                                                            "quantity",
                                                            0,
                                                        );
                                                        return;
                                                    }
                                                    const parsed = Number(raw);
                                                    handleUpdateSparepartItem(
                                                        "stok",
                                                        index,
                                                        "quantity",
                                                        Number.isNaN(parsed)
                                                            ? 0
                                                            : parsed,
                                                    );
                                                }}
                                                min="0"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.unit}
                                                onValueChange={(value) =>
                                                    handleUpdateSparepartItem(
                                                        "stok",
                                                        index,
                                                        "unit",
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pcs">
                                                        pcs
                                                    </SelectItem>
                                                    <SelectItem value="unit">
                                                        unit
                                                    </SelectItem>
                                                    <SelectItem value="set">
                                                        set
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleRemoveSparepartItem(
                                                        "stok",
                                                        index,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Dokumentasi Stok */}
                    <div className="space-y-2">
                        <Label>
                            Dokumentasi{" "}
                            {formData.type === "tools_alker" ? "Tools" : "Stok"}{" "}
                            (Foto)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                    handlePhotoChange("stok", e.target.files)
                                }
                                className="flex-1"
                            />
                        </div>
                        {/* Existing Photos (untuk edit mode) - foto stok */}
                        {localExistingStok && localExistingStok.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Foto yang sudah ada:
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedPhotos(
                                                localExistingStok,
                                            );
                                            setSelectedPhotoTitle(
                                                "Dokumentasi Stok (Existing)",
                                            );
                                            setPhotoGalleryOpen(true);
                                        }}
                                    >
                                        <ImageIcon className="h-4 w-4 mr-1" />
                                        Lihat Semua ({localExistingStok.length})
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {localExistingStok.map((photo, index) => (
                                        <div
                                            key={photo.id || index}
                                            className="relative group col-span-1"
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setSelectedPhotos(
                                                        localExistingStok,
                                                    );
                                                    setSelectedPhotoTitle(
                                                        "Dokumentasi Stok (Existing)",
                                                    );
                                                    setPhotoGalleryOpen(true);
                                                }}
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={
                                                        photo.caption ||
                                                        `Existing ${index + 1}`
                                                    }
                                                    className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity"
                                                    onError={(e) => {
                                                        const target =
                                                            e.target as HTMLImageElement;
                                                        target.style.display =
                                                            "none";
                                                    }}
                                                />
                                            </div>

                                            {/* Delete Button for Existing Photo */}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteExistingPhoto(
                                                        photo,
                                                        "stok",
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* New Photos */}
                        {stokPhotos.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Foto baru:
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {stokPhotos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-5 w-5"
                                                onClick={() =>
                                                    handleRemovePhoto(
                                                        "stok",
                                                        index,
                                                    )
                                                }
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sparepart Bekas Section */}
            {showBekasSection && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                            Sparepart Bekas
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSparepartItem("bekas")}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Item
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        No
                                    </TableHead>
                                    <TableHead className="min-w-[200px]">
                                        Jenis Sparepart
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        Jumlah
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        Unit
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bekasItems.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-muted-foreground h-24"
                                        >
                                            Belum ada item ditambahkan
                                        </TableCell>
                                    </TableRow>
                                )}
                                {bekasItems.map((item, index) => (
                                    <TableRow key={item.id || index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <Popover
                                                open={
                                                    activeCombobox?.type ===
                                                        "bekas" &&
                                                    activeCombobox?.index ===
                                                        index
                                                }
                                                onOpenChange={(open) => {
                                                    if (open) {
                                                        setActiveCombobox({
                                                            type: "bekas",
                                                            index,
                                                        });
                                                        setComboboxSearch("");
                                                    } else {
                                                        setActiveCombobox(null);
                                                    }
                                                }}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full h-8 justify-between font-normal",
                                                            !item.name &&
                                                                "text-muted-foreground",
                                                        )}
                                                        disabled={
                                                            isLoadingMasters ||
                                                            sparepartMasters.length ===
                                                                0
                                                        }
                                                    >
                                                        {item.name ||
                                                            (isLoadingMasters
                                                                ? "Memuat..."
                                                                : sparepartMasters.length ===
                                                                    0
                                                                  ? "Empty"
                                                                  : "Pilih jenis")}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[300px] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Cari sparepart..."
                                                            value={
                                                                comboboxSearch
                                                            }
                                                            onValueChange={
                                                                setComboboxSearch
                                                            }
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {comboboxSearch ? (
                                                                    <div className="p-2">
                                                                        <p className="text-sm text-muted-foreground mb-2">
                                                                            "
                                                                            {
                                                                                comboboxSearch
                                                                            }
                                                                            "
                                                                            tidak
                                                                            ditemukan
                                                                        </p>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="w-full justify-start h-auto py-1 px-2"
                                                                            onClick={() => {
                                                                                createMasterMutation.mutate(
                                                                                    comboboxSearch,
                                                                                    {
                                                                                        onSuccess:
                                                                                            (
                                                                                                newMaster,
                                                                                            ) => {
                                                                                                const updated =
                                                                                                    [
                                                                                                        ...bekasItems,
                                                                                                    ];
                                                                                                updated[
                                                                                                    index
                                                                                                ] =
                                                                                                    {
                                                                                                        ...updated[
                                                                                                            index
                                                                                                        ],
                                                                                                        name: newMaster.name,
                                                                                                        id: String(
                                                                                                            newMaster.id,
                                                                                                        ),
                                                                                                    };
                                                                                                isInternalUpdateRef.current = true;
                                                                                                setBekasItems(
                                                                                                    updated,
                                                                                                );
                                                                                                onChange(
                                                                                                    {
                                                                                                        ...formData,
                                                                                                        sparepartBekas:
                                                                                                            updated,
                                                                                                    },
                                                                                                );
                                                                                                setActiveCombobox(
                                                                                                    null,
                                                                                                );
                                                                                            },
                                                                                    },
                                                                                );
                                                                            }}
                                                                            disabled={
                                                                                createMasterMutation.isPending
                                                                            }
                                                                        >
                                                                            <Plus className="mr-2 h-4 w-4" />
                                                                            {createMasterMutation.isPending
                                                                                ? "Menyimpan..."
                                                                                : `Buat baru: "${comboboxSearch}"`}
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    "Tidak ada data"
                                                                )}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {sparepartMasters.map(
                                                                    (
                                                                        master,
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                master.id
                                                                            }
                                                                            value={
                                                                                master.name
                                                                            }
                                                                            onSelect={(
                                                                                currentValue,
                                                                            ) => {
                                                                                const updated =
                                                                                    [
                                                                                        ...bekasItems,
                                                                                    ];
                                                                                updated[
                                                                                    index
                                                                                ] =
                                                                                    {
                                                                                        ...updated[
                                                                                            index
                                                                                        ],
                                                                                        name: master.name,
                                                                                        id: String(
                                                                                            master.id,
                                                                                        ),
                                                                                    };
                                                                                isInternalUpdateRef.current = true;
                                                                                setBekasItems(
                                                                                    updated,
                                                                                );
                                                                                onChange(
                                                                                    {
                                                                                        ...formData,
                                                                                        sparepartBekas:
                                                                                            updated,
                                                                                    },
                                                                                );
                                                                                setActiveCombobox(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    item.name ===
                                                                                        master.name
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0",
                                                                                )}
                                                                            />
                                                                            {
                                                                                master.name
                                                                            }
                                                                        </CommandItem>
                                                                    ),
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-8"
                                                value={
                                                    Number.isNaN(item.quantity)
                                                        ? ""
                                                        : item.quantity
                                                }
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === "") {
                                                        handleUpdateSparepartItem(
                                                            "bekas",
                                                            index,
                                                            "quantity",
                                                            0,
                                                        );
                                                        return;
                                                    }
                                                    const parsed = Number(raw);
                                                    handleUpdateSparepartItem(
                                                        "bekas",
                                                        index,
                                                        "quantity",
                                                        Number.isNaN(parsed)
                                                            ? 0
                                                            : parsed,
                                                    );
                                                }}
                                                min="0"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.unit}
                                                onValueChange={(value) =>
                                                    handleUpdateSparepartItem(
                                                        "bekas",
                                                        index,
                                                        "unit",
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pcs">
                                                        pcs
                                                    </SelectItem>
                                                    <SelectItem value="unit">
                                                        unit
                                                    </SelectItem>
                                                    <SelectItem value="set">
                                                        set
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleRemoveSparepartItem(
                                                        "bekas",
                                                        index,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Dokumentasi Bekas */}
                    <div className="space-y-2">
                        <Label>Dokumentasi Bekas (Foto)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                    handlePhotoChange("bekas", e.target.files)
                                }
                                className="flex-1"
                            />
                        </div>
                        {/* Existing Photos (untuk edit mode) - foto bekas */}
                        {localExistingBekas &&
                            localExistingBekas.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            Foto yang sudah ada:
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedPhotos(
                                                    localExistingBekas,
                                                );
                                                setSelectedPhotoTitle(
                                                    "Dokumentasi Bekas (Existing)",
                                                );
                                                setPhotoGalleryOpen(true);
                                            }}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-1" />
                                            Lihat Semua (
                                            {localExistingBekas.length})
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {localExistingBekas.map(
                                            (photo, index) => (
                                                <div
                                                    key={photo.id || index}
                                                    className="relative group col-span-1"
                                                >
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedPhotos(
                                                                localExistingBekas,
                                                            );
                                                            setSelectedPhotoTitle(
                                                                "Dokumentasi Bekas (Existing)",
                                                            );
                                                            setPhotoGalleryOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <img
                                                            src={photo.url}
                                                            alt={
                                                                photo.caption ||
                                                                `Existing ${index + 1}`
                                                            }
                                                            className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity"
                                                            onError={(e) => {
                                                                const target =
                                                                    e.target as HTMLImageElement;
                                                                target.style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Delete Button for Existing Photo */}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExistingPhoto(
                                                                photo,
                                                                "bekas",
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        {/* New Photos */}
                        {bekasPhotos.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Foto baru:
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {bekasPhotos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-5 w-5"
                                                onClick={() =>
                                                    handleRemovePhoto(
                                                        "bekas",
                                                        index,
                                                    )
                                                }
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Catatan */}
            <div className="space-y-2">
                <Label htmlFor="catatan">Catatan (jika ada temuan)</Label>
                <Textarea
                    id="catatan"
                    value={formData.catatan || ""}
                    onChange={(e) =>
                        onChange({ ...formData, catatan: e.target.value })
                    }
                    rows={3}
                />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Menyimpan..."
                        : editingId
                          ? "Update"
                          : "Simpan"}
                </Button>
            </div>

            {/* Photo Gallery Modal */}
            {selectedPhotos.length > 0 && (
                <PhotoGalleryModal
                    photos={selectedPhotos}
                    open={photoGalleryOpen}
                    onOpenChange={setPhotoGalleryOpen}
                    title={selectedPhotoTitle}
                />
            )}
        </form>
    );
};
