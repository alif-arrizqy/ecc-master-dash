export type SparepartRegion = "maluku" | "papua";
export type SparepartType = "stok" | "bekas" | "tools_alker";

export interface SparepartItem {
    id: string; // master_id (stringified) or temp ID
    stockId?: number; // Real Stock ID (PK) from backend
    name: string;
    quantity: number;
    unit: string; // 'pcs', 'unit', dll
    // Jenis stok per item - mapping langsung ke enum backend
    // 'NEW_STOCK'  -> stok baru
    // 'USED_STOCK' -> stok bekas
    stock_type?: "NEW_STOCK" | "USED_STOCK";
}

export interface SparepartPhoto {
    id: string;
    url: string;
    thumbnailUrl?: string;
    caption?: string;
}

export interface Sparepart {
    id: number;
    no: number;
    kabupaten: string;
    cluster: string;
    region: SparepartRegion;
    type: SparepartType;
    sparepartStok?: SparepartItem[];
    dokumentasiStok?: SparepartPhoto[];
    sparepartBekas?: SparepartItem[];
    dokumentasiBekas?: SparepartPhoto[];
    catatan?: string;
    pic?: string;
    kontak?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Location {
    id: number;
    region: string;
    regency: string;
    cluster: string;
}

export interface ContactPerson {
    id: number;
    location_id: number;
    pic: string;
    phone: string;
    location?: Location;
}

export interface SparepartMaster {
    id: number;
    name: string;
    item_type: "SPAREPART" | "TOOLS_ALKER";
}

export interface SparepartFormData {
    location_id?: number; // Untuk backend
    kabupaten: string; // Display only
    cluster: string; // Display only
    region: SparepartRegion;
    type: SparepartType; // Frontend: 'stok' | 'bekas' | 'tools_alker'
    // Backend mapping:
    // 'stok' -> stock_type: 'NEW_STOCK', item_type: 'SPAREPART'
    // 'bekas' -> stock_type: 'USED_STOCK', item_type: 'SPAREPART'
    // 'tools_alker' -> item_type: 'TOOLS_ALKER'
    sparepartStok?: SparepartItem[]; // Array of {sparepart_id, quantity}
    dokumentasiStok?: File[];
    sparepartBekas?: SparepartItem[]; // Array of {sparepart_id, quantity}
    dokumentasiBekas?: File[];
    catatan?: string;
    pic?: string;
    kontak?: string;
    // Untuk edit mode - existing photos
    existingPhotos?: SparepartPhoto[];
}

export interface SparepartFilter {
    region?: SparepartRegion;
    type?: SparepartType;
    kabupaten?: string;
    cluster?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface SparepartExportParams {
    region?: SparepartRegion;
    type?: SparepartType;
    kabupaten?: string;
    cluster?: string;
    search?: string;
}
