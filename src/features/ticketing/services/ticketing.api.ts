/**
 * Ticketing API Service
 * API methods untuk Trouble Ticketing System
 */

import {
    troubleTicketApiClient,
    sitesApiClient,
    slaApiClient,
} from "@/shared/lib/api";
import { getSLADateRange } from "@/shared/lib/dateUtils";
import type {
    Ticket,
    TicketType,
    Problem,
    PIC,
    Site,
    SLAData,
    ProgressHistory,
    ApiResponse,
    PaginatedResponse,
    CreateTicketFormData,
    EditTicketFormData,
    AddProgressFormData,
    CloseTicketFormData,
} from "../types/ticketing.types";

/**
 * Transform raw camelCase API response to frontend snake_case Ticket type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTicket(raw: any): Ticket {
    // pic from list endpoint is an array [{picId, picName}]; detail may be object
    const picArr = Array.isArray(raw.pic) ? raw.pic : (raw.pic ? [raw.pic] : []);
    const picItem = picArr[0];

    // ticketType from list endpoint is a plain string (name); detail may be object
    const ticketTypeRaw = raw.ticketType;
    const ticketTypeName =
        typeof ticketTypeRaw === "string"
            ? ticketTypeRaw
            : (ticketTypeRaw?.ticketTypeName ?? ticketTypeRaw?.name ?? "");
    const ticketTypeId =
        typeof ticketTypeRaw === "object" && ticketTypeRaw !== null
            ? (ticketTypeRaw.ticketTypeId ?? ticketTypeRaw.id ?? 0)
            : (raw.ticketTypeId ?? 0);

    return {
        ticket_number: raw.ticketNumber ?? raw.ticket_number ?? "",
        ticket_type_id: ticketTypeId,
        ticket_type: ticketTypeName
            ? { id: ticketTypeId, name: ticketTypeName }
            : undefined,
        date_down: raw.dateDown ?? raw.date_down ?? "",
        status: raw.status,
        site_id: raw.siteId ?? raw.site_id ?? "",
        site: {
            site_id: raw.siteId ?? raw.site_id ?? "",
            site_name: raw.siteName ?? "",
            battery_version: raw.batteryVersion ?? "",
            province: raw.province ?? "",
            pr_code: raw.prCode ?? null,
            contact_person: raw.contactPerson ?? [],
        },
        sla_avg: raw.slaAvg ?? raw.sla_avg ?? null,
        pic_id: picItem?.picId ?? picItem?.id ?? raw.picId ?? 0,
        pic: picItem
            ? { id: picItem.picId ?? picItem.id ?? 0, name: picItem.picName ?? picItem.name ?? "" }
            : undefined,
        plan_cm: raw.planCm ?? raw.plan_cm ?? "",
        action: raw.action ?? "",
        problems: (raw.problem ?? []).map(
            (p: { problemId: number; problemName: string }) => ({
                id: p.problemId ?? 0,
                name: p.problemName ?? "",
            }),
        ),
        contact_persons: (raw.contactPerson ?? []).map(
            (cp: { name: string; phone?: string }) => ({
                name: cp.name,
                phone: cp.phone,
            }),
        ),
        duration_down: raw.durationDown
            ? parseInt(String(raw.durationDown))
            : undefined,
        created_at: raw.createdAt ?? raw.created_at ?? "",
        updated_at: raw.updatedAt ?? raw.updated_at ?? "",
    };
}

/**
 * Trouble Ticket API endpoints
 */
export const troubleTicketApi = {
    /**
     * Get all tickets with filters
     * GET /api/v1/trouble-ticket
     */
    getAll: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        ticketType?: number;
        siteId?: string;
        siteName?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<PaginatedResponse<Ticket[]>> => {
        const response = await troubleTicketApiClient.get<ApiResponse<unknown>>(
            "/api/v1/trouble-ticket",
            { params },
        );
        const raw = response.data.data;
        const arr = Array.isArray(raw) ? raw : [];
        return {
            data: arr.map(transformTicket),
            pagination: response.data.pagination,
        };
    },

    /**
     * Get ticket by ticket_number
     * GET /api/v1/trouble-ticket/progress/:ticketNumber (returns full ticket + progress)
     */
    getDetail: async (ticketNumber: string): Promise<Ticket> => {
        const response = await troubleTicketApiClient.get<ApiResponse<unknown>>(
            `/api/v1/trouble-ticket/progress/${ticketNumber}`,
        );
        return transformTicket(response.data.data);
    },

    /**
     * Create new ticket
     * POST /api/v1/trouble-ticket
     */
    create: async (data: CreateTicketFormData): Promise<Ticket> => {
        const payload = {
            ticketType: data.ticket_type_id,
            dateDown: data.date_down,
            siteId: data.site_id,
            problemId: data.problem_ids,
            picId: data.pic_id,
            planCM: data.plan_cm,
            action: data.action,
        };
        const response = await troubleTicketApiClient.post<
            ApiResponse<unknown>
        >("/api/v1/trouble-ticket", payload);
        return transformTicket(response.data.data);
    },

    /**
     * Update ticket (edit ticket type, date down, site, problems, pic, planCM, action)
     * PUT /api/v1/trouble-ticket/:ticketNumber
     */
    update: async (
        ticketNumber: string,
        data: EditTicketFormData,
    ): Promise<Ticket> => {
        const payload = {
            ticketType: data.ticket_type_id,
            dateDown: data.date_down,
            siteId: data.site_id,
            problemId: data.problem_ids,
            picId: data.pic_id,
            planCM: data.plan_cm,
            action: data.action,
        };
        const response = await troubleTicketApiClient.put<ApiResponse<unknown>>(
            `/api/v1/trouble-ticket/${ticketNumber}`,
            payload,
        );
        return transformTicket(response.data.data);
    },

    /**
     * Close ticket
     * PUT /api/v1/trouble-ticket/close/:ticketNumber
     */
    closeTicket: async (
        ticketNumber: string,
        data: CloseTicketFormData,
    ): Promise<Ticket> => {
        const payload = {
            status: "closed",
            date: data.date,
            action: data.action,
        };
        const response = await troubleTicketApiClient.put<ApiResponse<unknown>>(
            `/api/v1/trouble-ticket/close/${ticketNumber}`,
            payload,
        );
        return transformTicket(response.data.data);
    },

    /**
     * Delete ticket
     * DELETE /api/v1/trouble-ticket/:ticketNumber
     */
    delete: async (ticketNumber: string): Promise<void> => {
        await troubleTicketApiClient.delete(
            `/api/v1/trouble-ticket/${ticketNumber}`,
        );
    },

    /**
     * Add progress to ticket
     * PUT /api/v1/trouble-ticket/progress/:ticketNumber
     */
    addProgress: async (
        ticketNumber: string,
        data: AddProgressFormData,
    ): Promise<ProgressHistory> => {
        const response = await troubleTicketApiClient.put<
            ApiResponse<ProgressHistory>
        >(`/api/v1/trouble-ticket/progress/${ticketNumber}`, data);
        return response.data.data;
    },

    /**
     * Get progress history
     * GET /api/v1/trouble-ticket/progress/:ticketNumber
     * Note: endpoint returns full ticket object with progress array embedded
     */
    getProgressHistory: async (
        ticketNumber: string,
    ): Promise<ProgressHistory[]> => {
        const response = await troubleTicketApiClient.get<ApiResponse<unknown>>(
            `/api/v1/trouble-ticket/progress/${ticketNumber}`,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ticketData = response.data.data as any;
        return ticketData?.progress ?? [];
    },
};

/**
 * Ticket Type API endpoints
 */
export const ticketTypeApi = {
    /**
     * Get all ticket types
     * GET /api/v1/type-ticket
     */
    getAll: async (): Promise<TicketType[]> => {
        const response = await troubleTicketApiClient.get<
            ApiResponse<TicketType[]>
        >("/api/v1/type-ticket");
        return response.data.data ?? [];
    },
};

/**
 * Problem API endpoints
 */
export const problemApi = {
    /**
     * Get all problems
     * GET /api/v1/problem-master
     */
    getAll: async (): Promise<Problem[]> => {
        const response = await troubleTicketApiClient.get<
            ApiResponse<Problem[]>
        >("/api/v1/problem-master");
        return response.data.data ?? [];
    },
};

/**
 * PIC (Person In Charge) API endpoints
 */
export const picApi = {
    /**
     * Get all PICs
     * GET /api/v1/pic
     */
    getAll: async (): Promise<PIC[]> => {
        const response =
            await troubleTicketApiClient.get<ApiResponse<PIC[]>>("/api/v1/pic");
        return response.data.data ?? [];
    },
};

/**
 * Site API endpoints
 * Using Sites Service (http://localhost:3001)
 */
export const siteApi = {
    /**
     * Get all sites with optional search and filters
     * GET /api/v1/sites
     * Example: /api/v1/sites?page=1&limit=100&sortBy=siteName&sortOrder=asc&isActive=true&search=site1
     */
    getAll: async (params?: {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
        isActive?: boolean;
    }): Promise<PaginatedResponse<Site[]>> => {
        // Set default values for pagination and sorting
        const queryParams = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 100,
            sortBy: params?.sortBy ?? "siteName",
            sortOrder: params?.sortOrder ?? "asc",
            isActive: params?.isActive ?? true,
            ...(params?.search && { search: params.search }),
        };

        const response = await sitesApiClient.get<ApiResponse<unknown>>(
            "/api/v1/sites",
            { params: queryParams },
        );
        const raw = response.data.data;

        // helper to normalize a raw site object
        // Normalize raw site object into our Site interface
        // note: some endpoints use `name` instead of `siteName`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalize = (r: any): Site => ({
            site_id: r.siteId ?? r.site_id ?? r.id ?? "",
            site_name: r.siteName ?? r.site_name ?? r.name ?? "",
            battery_version: r.batteryVersion ?? r.battery_version ?? "",
            province: r.province ?? r.region ?? "",
            pr_code: r.prCode ?? r.pr_code ?? null,
            contact_person: r.contactPerson ?? r.contact_person ?? [],
        });

        // Handle nested { data: [...], pagination: {...} } structure
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nested = raw as { data?: any[]; items?: any[] };
            const arr = nested.data ?? nested.items ?? [];
            return {
                data: arr.map(normalize),
                pagination: (
                    raw as { pagination?: ApiResponse<unknown>["pagination"] }
                ).pagination,
            };
        }

        if (Array.isArray(raw)) {
            return {
                data: raw.map(normalize) as Site[],
                pagination: response.data.pagination,
            };
        }

        return { data: [], pagination: undefined };
    },
};

/**
 * SLA API endpoints
 * Using SLA Service (http://localhost:3002)
 */
export const slaApi = {
    /**
     * Get SLA data for a site
     * GET /api/v1/sla-bakti/master
     * Example: /api/v1/sla-bakti/master?startDate=2026-02-01&endDate=2026-02-24&page=1&limit=100
     *
     * Date range rules (from getSLADateRange):
     * - Tanggal 1 bulan → gunakan 2 hari terakhir bulan sebelumnya
     * - Tanggal 2+ bulan → gunakan dari tanggal 1 bulan baru sampai hari ini
     */
    getSLAByDate: async (params: {
        siteId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<SLAData | null> => {
        try {
            // Determine date range defaults
            const dateRange =
                !params.startDate || !params.endDate ? getSLADateRange() : null;

            const queryParams: Record<string, string | number> = {
                ...(params.siteId && { siteId: params.siteId }),
                // dateRange is guaranteed non-null when params.startDate/ endDate unset
                startDate:
                    params.startDate ?? (dateRange ? dateRange.startDate : ""),
                endDate: params.endDate ?? (dateRange ? dateRange.endDate : ""),
                page: params.page ?? 1,
                limit: params.limit ?? 100,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await slaApiClient.get<ApiResponse<any>>(
                "/api/v1/sla-bakti/master",
                {
                    params: queryParams,
                },
            );

            const apiData = response.data.data;
            // attempt to extract SLA average from response
            let slaAvg: number | null = null;
            if (
                apiData.sites &&
                Array.isArray(apiData.sites) &&
                apiData.sites.length > 0
            ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const site = apiData.sites[0] as any;
                slaAvg = site.siteSla?.slaAverage ?? null;
                // if still missing, maybe summary contains it
                if (slaAvg === null && apiData.summary) {
                    slaAvg = apiData.summary.slaAverage ?? null;
                }
            } else if (apiData.summary) {
                slaAvg = apiData.summary.slaAverage ?? null;
            }

            return {
                siteId:
                    params.siteId ??
                    (apiData.sites && apiData.sites[0]?.siteId) ??
                    "",
                sla_avg: slaAvg,
                period: undefined,
            };
        } catch (error) {
            console.warn("Failed to fetch SLA data:", error);
            return null;
        }
    },
};
