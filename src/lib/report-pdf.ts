import { format } from "date-fns";

interface ReportSection {
  title: string;
  rows: string[][];
  headers: string[];
}

/**
 * Generate a printable HTML report with full Arabic/RTL support.
 * Opens in a new window for the user to print or save as PDF.
 */
export function generateReportPDF(
  title: string,
  dateRange: { from: Date; to: Date },
  sections: ReportSection[],
  summaryStats?: { label: string; value: string }[]
) {
  const dateStr = `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`;
  const generatedAt = format(new Date(), "yyyy/MM/dd HH:mm");

  const summaryHTML = summaryStats?.length
    ? `<div style="display:flex;justify-content:center;gap:40px;margin:20px 0;flex-wrap:wrap;">
        ${summaryStats.map(s => `<div style="text-align:center;min-width:120px;">
          <div style="font-weight:bold;font-size:14px;color:#333;">${s.label}</div>
          <div style="font-size:20px;margin-top:4px;">${s.value}</div>
        </div>`).join("")}
      </div>`
    : "";

  const sectionsHTML = sections.map(section => `
    <div style="margin-top:24px;">
      <h2 style="font-size:16px;margin-bottom:8px;border-bottom:2px solid #e5e7eb;padding-bottom:4px;">${section.title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            ${section.headers.map(h => `<th style="padding:6px 10px;text-align:right;border:1px solid #e5e7eb;font-weight:bold;">${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${section.rows.map(row => `<tr>
            ${row.map(cell => `<td style="padding:5px 10px;border:1px solid #e5e7eb;">${cell ?? ""}</td>`).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      padding: 30px 40px;
      color: #1a1a1a;
      max-width: 1100px;
      margin: 0 auto;
    }
    h1 { text-align: center; font-size: 22px; margin-bottom: 6px; }
    .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 4px; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:16px;">
    <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;background:#2563eb;color:#fff;border:none;border-radius:6px;">طباعة / حفظ كـ PDF</button>
  </div>
  <h1>${title}</h1>
  <div class="subtitle">${dateStr}</div>
  <div class="subtitle" style="font-size:11px;">تم الإنشاء: ${generatedAt}</div>
  ${summaryHTML}
  ${sectionsHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => URL.revokeObjectURL(url);
  }
}
