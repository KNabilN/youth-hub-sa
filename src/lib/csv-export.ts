import * as XLSX from "xlsx";

/**
 * Shared CSV export utility with Arabic BOM support for Excel compatibility.
 */
export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escapeCsvField = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  const csv = [headers.map(escapeCsvField), ...rows.map(r => r.map(escapeCsvField))].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as a real XLSX file with auto-sized columns and RTL support.
 */
export function downloadXLSX(filename: string, headers: string[], rows: string[][]) {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns based on content
  const colWidths = headers.map((h, i) => {
    let max = h.length;
    for (const row of rows) {
      const val = row[i] ?? "";
      max = Math.max(max, val.length);
    }
    // Arabic chars are wider; apply a multiplier, with min/max bounds
    return { wch: Math.min(Math.max(max * 1.5, 10), 60) };
  });
  ws["!cols"] = colWidths;

  // Set RTL for the sheet
  if (!ws["!sheetViews"]) ws["!sheetViews"] = [{}] as any;
  (ws["!sheetViews"] as any)[0].rightToLeft = true;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "البيانات");

  XLSX.writeFile(wb, filename);
}
