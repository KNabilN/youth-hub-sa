import { format } from "date-fns";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
 * Generate a PDF report and trigger download directly.
 * Uses html2canvas + jsPDF for reliable cross-browser PDF generation.
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

  // Build an off-screen container, render to canvas, then PDF
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: 1100px; background: #fff; color: #1a1a2e;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl; padding: 0;
  `;

  const summaryHTML = summaryStats?.length
    ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
        ${summaryStats.map(s => `<div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:20px 16px;text-align:center;">
          <div style="font-size:13px;color:#475569;font-weight:600;margin-bottom:8px;">${s.label}</div>
          <div style="font-size:28px;font-weight:800;color:#1e3a5f;">${s.value}</div>
        </div>`).join("")}
      </div>`
    : "";

  const chartsHTML = chartImages?.length
    ? `<div style="margin-bottom:32px;">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">
          ${chartImages.map(c => `<div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:14px;font-weight:700;color:#1e3a5f;padding:14px 18px 10px;border-bottom:1px solid #f1f5f9;background:#f8fafc;">${c.title}</div>
            <img src="${c.imageDataUrl}" style="width:100%;height:auto;display:block;padding:10px;background:#fff;" alt="${c.title}" />
          </div>`).join("")}
        </div>
      </div>`
    : "";

  const sectionsHTML = sections.map(section => `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:17px;font-weight:700;color:#1e3a5f;margin-bottom:12px;padding-bottom:8px;border-bottom:3px solid #2563eb;">${section.title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr>${section.headers.map(h => `<th style="background:#1e3a5f;color:#fff;padding:12px 16px;text-align:right;font-weight:600;font-size:13px;">${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${section.rows.map((row, i) => `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
            ${row.map(cell => `<td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;">${cell ?? ""}</td>`).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `).join("");

  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 50%,#3b82f6 100%);color:#fff;padding:36px 40px 30px;text-align:center;margin-bottom:28px;">
      <h1 style="font-size:28px;font-weight:700;margin-bottom:10px;">${title}</h1>
      <div style="font-size:13px;opacity:0.9;display:flex;justify-content:center;gap:24px;">
        <span>📅 ${dateStr}</span>
        <span>⏰ تم الإنشاء: ${generatedAt}</span>
      </div>
    </div>
    <div style="max-width:1100px;margin:0 auto;padding:0 30px 40px;">
      ${summaryHTML}
      ${chartsHTML}
      ${sectionsHTML}
      <div style="margin-top:40px;padding-top:16px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
        <span>YouthHubSA — تقرير تحليلات المنصة</span>
        <span>${generatedAt}</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Wait for images to load, then capture
  const images = container.querySelectorAll("img");
  const imagePromises = Array.from(images).map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) return resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
      })
  );

  Promise.all(imagePromises)
    .then(() => html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false }))
    .then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "-")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    })
    .catch((err) => {
      console.error("PDF generation error:", err);
    })
    .finally(() => {
      document.body.removeChild(container);
    });
}

/**
 * Capture a chart container (Card element containing a Recharts chart) as a base64 PNG.
 */
export async function captureChartAsImage(container: HTMLElement): Promise<string> {
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (doc) => {
      const el = doc.body;
      el.style.background = "#ffffff";
      el.style.color = "#1a1a2e";
      el.classList.remove("dark");
      doc.documentElement.classList.remove("dark");
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
