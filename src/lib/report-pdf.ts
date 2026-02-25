import { format } from "date-fns";
import jsPDF from "jspdf";
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

/**
 * Build the report HTML string (used internally for rendering).
 */
function buildReportHTML(
  title: string,
  dateStr: string,
  generatedAt: string,
  summaryStats?: { label: string; value: string }[],
  chartImages?: ChartImage[],
  sections?: ReportSection[]
) {
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

  const sectionsHTML = (sections ?? []).map(section => `
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

  return `
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
  `;
}

const REPORT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, .report-root {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
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
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
  .stat-label { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 6px; letter-spacing: 0.5px; }
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
`;

/**
 * Generate a direct PDF file download with charts, professional styling, and Arabic/RTL support.
 */
export async function generateReportPDF(
  title: string,
  dateRange: { from: Date; to: Date },
  sections: ReportSection[],
  summaryStats?: { label: string; value: string }[],
  chartImages?: ChartImage[]
) {
  const dateStr = `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`;
  const generatedAt = format(new Date(), "yyyy/MM/dd HH:mm");

  const htmlContent = buildReportHTML(title, dateStr, generatedAt, summaryStats, chartImages, sections);

  // Create an offscreen container to render the HTML
  const wrapper = document.createElement("div");
  wrapper.className = "report-root";
  wrapper.style.cssText = "position:absolute;left:-9999px;top:0;width:1100px;background:#fff;";
  
  const style = document.createElement("style");
  style.textContent = REPORT_STYLES;
  wrapper.appendChild(style);
  
  const content = document.createElement("div");
  content.innerHTML = htmlContent;
  wrapper.appendChild(content);
  document.body.appendChild(wrapper);

  // Wait for images to load
  const images = wrapper.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: 1100,
      windowWidth: 1100,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages if content overflows
    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${title}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
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
        canvas.width = width * 2;
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
