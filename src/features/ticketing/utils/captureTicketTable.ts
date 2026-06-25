import { troubleTicketApi } from "../services/ticketing.api";
import {
    getSLAColorHex,
    ticketStatusLabels,
    type Ticket,
    type TicketFilterParams,
    type TicketStatus,
} from "../types/ticketing.types";

const FETCH_LIMIT = 50;

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const statusStyles: Record<TicketStatus, string> = {
    progress: "background-color: #dbeafe; color: #1d4ed8;",
    pending: "background-color: rgba(234, 179, 8, 0.15); color: #ca8a04;",
    closed: "background-color: #dcfce7; color: #166534;",
};

function buildFetchParams(
    filters: Partial<TicketFilterParams>,
    tabStatus?: string,
) {
    return {
        status: tabStatus || (filters.status ? String(filters.status) : undefined),
        ticketType: filters.ticketType ? Number(filters.ticketType) : undefined,
        siteName: filters.siteName || undefined,
        province: filters.province || undefined,
        picId: filters.picId ? Number(filters.picId) : undefined,
    };
}

async function fetchAllTickets(
    filters: Partial<TicketFilterParams>,
    tabStatus: string | undefined,
    onProgress: (message: string) => void,
): Promise<Ticket[]> {
    const params = buildFetchParams(filters, tabStatus);
    const allTickets: Ticket[] = [];

    const firstPage = await troubleTicketApi.getAll({
        ...params,
        page: 1,
        limit: FETCH_LIMIT,
    });

    allTickets.push(...firstPage.data);
    const totalPages = firstPage.pagination?.totalPages || 1;

    for (let page = 2; page <= totalPages; page++) {
        onProgress(`Mengambil halaman ${page} dari ${totalPages}...`);
        const result = await troubleTicketApi.getAll({
            ...params,
            page,
            limit: FETCH_LIMIT,
        });
        allTickets.push(...result.data);
    }

    return allTickets;
}

function sortTickets(tickets: Ticket[]): Ticket[] {
    return [...tickets].sort(
        (a, b) => (b.duration_down || 0) - (a.duration_down || 0),
    );
}

function formatProblems(ticket: Ticket): string {
    if (!ticket.problems?.length) return "-";
    return ticket.problems.map((p) => escapeHtml(p.name)).join(", ");
}

function createTempTableContainer(tickets: Ticket[]): HTMLDivElement {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "max-content";

    const sorted = sortTickets(tickets);

    const rows = sorted
        .map((ticket, index) => {
            const duration = ticket.duration_down || 0;
            const slaValue = ticket.sla_avg;
            const slaDisplay =
                slaValue === null || slaValue === undefined
                    ? "N/A"
                    : `${slaValue.toFixed(2)}%`;
            const slaColor = getSLAColorHex(slaValue);

            return `
              <tr style="border-bottom: 1px solid rgba(229, 231, 235, 0.5);">
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: left; vertical-align: middle;">${index + 1}</td>
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: center; vertical-align: middle;">${duration} hari</td>
                <td style="padding: 3px 10px; text-align: center; vertical-align: middle;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; min-height: 18px; background-color: ${slaColor}15; color: ${slaColor};">${slaDisplay}</span>
                </td>
                <td style="padding: 3px 10px; font-size: 13px; font-weight: 500; text-align: left; vertical-align: middle;">${escapeHtml(ticket.site?.site_name?.toUpperCase() || "-")}</td>
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: left; vertical-align: middle;">${escapeHtml(ticket.site?.province || "-")}</td>
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: left; vertical-align: middle;">${escapeHtml(ticket.site?.battery_version?.toUpperCase() || "-")}</td>
                <td style="padding: 3px 10px; font-size: 13px; text-align: left; vertical-align: middle;">${formatProblems(ticket)}</td>
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: left; vertical-align: middle;">${escapeHtml(ticket.pic?.name || "-")}</td>
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: left; vertical-align: middle; max-width: 200px;">${escapeHtml(ticket.action || "-")}</td>
                <td style="padding: 3px 10px; font-size: 13px; color: #6b7280; text-align: left; vertical-align: middle; max-width: 180px;">${escapeHtml(ticket.plan_cm || "-")}</td>
                <td style="padding: 3px 10px; text-align: center; vertical-align: middle;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; white-space: nowrap; min-height: 18px; ${statusStyles[ticket.status]}">${ticketStatusLabels[ticket.status]}</span>
                </td>
              </tr>
            `;
        })
        .join("");

    container.innerHTML = `
      <div class="table-wrapper" style="overflow-x: auto; border-radius: 6px; border: 1px solid #e5e7eb; background-color: white; padding: 8px;">
        <table style="width: 100%; border-collapse: collapse; background-color: white; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid #e5e7eb; background-color: rgba(243, 244, 246, 0.5);">
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">No.</th>
              <th style="padding: 5px 10px; text-align: center; font-size: 13px; font-weight: 500; color: #6b7280;">Durasi Down</th>
              <th style="padding: 5px 10px; text-align: center; font-size: 13px; font-weight: 500; color: #6b7280;">SLA Avg</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">Nama Site</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">Provinsi</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">Baterai</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">Problem</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">PIC</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">Action</th>
              <th style="padding: 5px 10px; text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;">Plan CM</th>
              <th style="padding: 5px 10px; text-align: center; font-size: 13px; font-weight: 500; color: #6b7280;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    return container;
}

export async function captureTicketTable(
    filters: Partial<TicketFilterParams>,
    tabStatus: string | undefined,
    onProgress: (message: string) => void,
): Promise<void> {
    onProgress("Mengambil semua data...");
    const allTickets = await fetchAllTickets(filters, tabStatus, onProgress);

    if (allTickets.length === 0) {
        throw new Error("Tidak ada data untuk di-capture");
    }

    onProgress(`Merender ${allTickets.length} baris...`);
    const tempContainer = createTempTableContainer(allTickets);
    document.body.appendChild(tempContainer);

    try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        onProgress("Membuat gambar...");
        const html2canvasModule = await import("html2canvas");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const html2canvas =
            (html2canvasModule as any).default ?? (html2canvasModule as any);

        const canvas = await html2canvas(
            tempContainer.querySelector(".table-wrapper")!,
            {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                allowTaint: true,
            },
        );

        onProgress("Mengunduh...");
        await new Promise<void>((resolve, reject) => {
            canvas.toBlob((blob: Blob | null) => {
                if (!blob) {
                    reject(new Error("Gagal membuat gambar"));
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `trouble-ticket-table-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                resolve();
            }, "image/png");
        });
    } finally {
        document.body.removeChild(tempContainer);
    }
}
