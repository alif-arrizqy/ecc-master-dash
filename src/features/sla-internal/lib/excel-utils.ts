import * as XLSX from 'xlsx';

export function downloadAoAsExcel(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  sheetName: string,
  filename: string
): void {
  const aoa: unknown[][] = [
    columns.map((c) => c.label),
    ...rows.map((r) => columns.map((c) => r[c.key] ?? '')),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/** Parse blob SLA3; jika server mengembalikan JSON error, lempar pesan */
export async function parseSla3XlsxBlob(blob: Blob): Promise<Record<string, unknown>[]> {
  const buf = await blob.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 1))[0];
  if (head === 0x7b) {
    const text = new TextDecoder().decode(buf);
    let j: { message?: string };
    try {
      j = JSON.parse(text) as { message?: string };
    } catch {
      throw new Error('Respons export tidak valid (bukan file Excel)');
    }
    throw new Error(j.message || 'Export SLA 3 ditolak server');
  }
  const wb = XLSX.read(buf, { type: 'array' });
  const name = wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
