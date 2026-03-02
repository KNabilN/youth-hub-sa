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
