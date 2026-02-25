import { format } from "date-fns";

interface ReportSection {
  title: string;
  rows: string[][];
  headers: string[];
}

interface ChartImage {
  title: string;
  imageDataUrl: string;
}

/**
 * Generate a professional printable HTML report with charts, RTL support.
 * Opens in a new window for the user to print or save as PDF.
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
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .stat-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .chart-card { break-inside: avoid; }
      .table-section { break-inside: avoid; }
    }
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
      padding: 32px 40px 28px;
      text-align: center;
      margin-bottom: 28px;
    }
    .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
    .header .meta { font-size: 13px; opacity: 0.85; }
    .header .meta span { margin: 0 12px; }
    .no-print {
      text-align: center;
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .no-print button {
      padding: 10px 32px;
      font-size: 14px;
      cursor: pointer;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .no-print button:hover { background: #1d4ed8; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 18px 16px;
      text-align: center;
    }
    .stat-label { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 26px; font-weight: 700; color: #1e3a5f; }
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
    }
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e3a5f;
      padding: 14px 18px 10px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .chart-img {
      width: 100%;
      height: auto;
      display: block;
      padding: 8px;
    }
    .table-section { margin-bottom: 24px; }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e3a5f;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #2563eb;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      background: #1e3a5f;
      color: #fff;
      padding: 10px 14px;
      text-align: right;
      font-weight: 600;
      font-size: 12px;
    }
    td { padding: 9px 14px; border-bottom: 1px solid #e2e8f0; }
    tr.even { background: #f8fafc; }
    tr.odd { background: #fff; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ طباعة / حفظ كـ PDF</button>
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
      <span>Youth Hub SA — تقرير تحليلات المنصة</span>
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
 * Capture an SVG element (from a Recharts chart) as a base64 PNG data URL.
 */
export async function captureSvgAsImage(svgElement: SVGSVGElement, width = 500, height = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", String(width));
      clone.setAttribute("height", String(height));
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Inline computed styles
      const origElements = svgElement.querySelectorAll("*");
      const cloneElements = clone.querySelectorAll("*");
      origElements.forEach((orig, i) => {
        const computed = window.getComputedStyle(orig);
        const cloneEl = cloneElements[i] as SVGElement | HTMLElement;
        if (cloneEl) {
          cloneEl.setAttribute("style", computed.cssText);
        }
      });

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2; // 2x for retina
        canvas.height = height * 2;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(svgUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Failed to load SVG image"));
      };
      img.src = svgUrl;
    } catch (err) {
      reject(err);
    }
  });
}
