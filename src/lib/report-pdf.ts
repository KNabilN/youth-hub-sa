import { format } from "date-fns";
import html2canvas from "html2canvas";

interface ReportSection {
  title: string;
  rows: string[][];
  headers: string[];
}

interface ChartImage {
  title: string;
  imageDataUrl: string;
}

const REPORT_STYLES = `
  @media print {
    body { margin: 0; padding: 20px; }
    .no-print { display: none !important; }
    .header, .stat-card, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .chart-card { break-inside: avoid; }
    .table-section { break-inside: avoid; }
  }
  @page { margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    padding: 0;
    color: #1a1a2e;
    background: #fff;
  }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 30px 40px; }
  .header {
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%);
    color: #fff;
    padding: 36px 40px 30px;
    text-align: center;
    margin-bottom: 28px;
  }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
  .header .meta { font-size: 13px; opacity: 0.9; display: flex; justify-content: center; gap: 24px; }
  .no-print {
    text-align: center;
    padding: 14px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: center;
    gap: 12px;
  }
  .no-print button {
    padding: 10px 28px;
    font-size: 14px;
    cursor: pointer;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
  }
  .btn-print { background: #2563eb; }
  .btn-print:hover { background: #1d4ed8; }
  .btn-close { background: #64748b; }
  .btn-close:hover { background: #475569; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    padding: 20px 16px;
    text-align: center;
  }
  .stat-label { font-size: 13px; color: #475569; font-weight: 600; margin-bottom: 8px; }
  .stat-value { font-size: 28px; font-weight: 800; color: #1e3a5f; }
  .charts-section { margin-bottom: 32px; }
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .chart-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .chart-title {
    font-size: 14px;
    font-weight: 700;
    color: #1e3a5f;
    padding: 14px 18px 10px;
    border-bottom: 1px solid #f1f5f9;
    background: #f8fafc;
  }
  .chart-img {
    width: 100%;
    height: auto;
    display: block;
    padding: 10px;
    background: #fff;
  }
  .table-section { margin-bottom: 28px; }
  .section-title {
    font-size: 17px;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 3px solid #2563eb;
  }
  table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  th {
    background: #1e3a5f;
    color: #fff;
    padding: 12px 16px;
    text-align: right;
    font-weight: 600;
    font-size: 13px;
  }
  td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  tr.even { background: #f8fafc; }
  tr.odd { background: #fff; }
  tbody tr:hover { background: #eff6ff; }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #94a3b8;
  }
`;

/**
 * Generate a professional HTML report and open it in a new tab.
 * The user can then print/save as PDF via the browser's print dialog.
 * Charts are embedded as images for perfect rendering.
 */
export function generateReportPDF(
  title: string,
  dateRange: { from: Date; to: Date },
  sections: ReportSection[],
  summaryStats?: { label: string; value: string }[],
  chartImages?: ChartImage[]
) {
  const dateStr = `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`;
  const generatedAt = format(new Date(), "yyyy/MM/dd HH:mm");

  const summaryHTML = summaryStats?.length
    ? `<div class="stats-grid">
        ${summaryStats.map(s => `<div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value">${s.value}</div>
        </div>`).join("")}
      </div>`
    : "";

  const chartsHTML = chartImages?.length
    ? `<div class="charts-section">
        <div class="charts-grid">
          ${chartImages.map(c => `<div class="chart-card">
            <div class="chart-title">${c.title}</div>
            <img src="${c.imageDataUrl}" class="chart-img" alt="${c.title}" />
          </div>`).join("")}
        </div>
      </div>`
    : "";

  const sectionsHTML = sections.map(section => `
    <div class="table-section">
      <h2 class="section-title">${section.title}</h2>
      <table>
        <thead>
          <tr>${section.headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${section.rows.map((row, i) => `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">
            ${row.map(cell => `<td>${cell ?? ""}</td>`).join("")}
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
  <style>${REPORT_STYLES}</style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة / حفظ كـ PDF</button>
    <button class="btn-close" onclick="window.close()">✕ إغلاق</button>
  </div>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">
      <span>📅 ${dateStr}</span>
      <span>⏰ تم الإنشاء: ${generatedAt}</span>
    </div>
  </div>
  <div class="container">
    ${summaryHTML}
    ${chartsHTML}
    ${sectionsHTML}
    <div class="footer">
      <span>YouthHubSA — تقرير تحليلات المنصة</span>
      <span>${generatedAt}</span>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => URL.revokeObjectURL(url);
  }
}

/**
 * Capture a chart container (Card element containing a Recharts chart) as a base64 PNG.
 * Uses html2canvas for accurate rendering including colors and labels.
 */
export async function captureChartAsImage(container: HTMLElement): Promise<string> {
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    // Remove any dark mode influence
    onclone: (doc) => {
      const el = doc.body;
      el.style.background = "#ffffff";
      el.style.color = "#1a1a2e";
      // Force light theme on cloned elements
      el.classList.remove("dark");
      doc.documentElement.classList.remove("dark");
      // Override any CSS variables that might be dark
      el.style.setProperty("--background", "0 0% 100%");
      el.style.setProperty("--foreground", "222.2 84% 4.9%");
      el.style.setProperty("--card", "0 0% 100%");
      el.style.setProperty("--card-foreground", "222.2 84% 4.9%");
      el.style.setProperty("--muted", "210 40% 96.1%");
      el.style.setProperty("--muted-foreground", "215.4 16.3% 46.9%");
      el.style.setProperty("--border", "214.3 31.8% 91.4%");
    },
  });
  return canvas.toDataURL("image/png");
}
