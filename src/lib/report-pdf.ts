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

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PADDING_MM = 5;
const CONTAINER_WIDTH = 1100;

function createOffscreenContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: ${CONTAINER_WIDTH}px; background: #fff; color: #1a1a2e;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl; padding: 0;
  `;
  document.body.appendChild(el);
  return el;
}

async function renderSectionToImage(html: string): Promise<string> {
  const container = createOffscreenContainer();
  container.innerHTML = html;
  // wait for any images
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) => new Promise<void>((r) => { if (img.complete) r(); else { img.onload = () => r(); img.onerror = () => r(); } })
    )
  );
  const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
  document.body.removeChild(container);
  return canvas.toDataURL("image/png");
}

function imgHeightMM(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      resolve(PAGE_WIDTH_MM * ratio);
    };
    img.onerror = () => resolve(50);
    img.src = dataUrl;
  });
}

async function addSectionToPdf(pdf: jsPDF, dataUrl: string, cursor: { y: number }) {
  const h = await imgHeightMM(dataUrl);
  if (cursor.y + h > PAGE_HEIGHT_MM && cursor.y > PADDING_MM) {
    pdf.addPage();
    cursor.y = PADDING_MM;
  }
  pdf.addImage(dataUrl, "PNG", 0, cursor.y, PAGE_WIDTH_MM, h);
  cursor.y += h + PADDING_MM;
}

/**
 * Generate a PDF report and trigger download directly.
 * Each logical section is captured independently to prevent clipping at page boundaries.
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

  const pdf = new jsPDF("p", "mm", "a4");
  const cursor = { y: 0 };

  // 1. Header
  const headerHTML = `
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 50%,#3b82f6 100%);color:#fff;padding:36px 40px 30px;text-align:center;">
      <h1 style="font-size:28px;font-weight:700;margin-bottom:10px;">${title}</h1>
      <div style="font-size:13px;opacity:0.9;display:flex;justify-content:center;gap:24px;">
        <span>📅 ${dateStr}</span>
        <span>⏰ تم الإنشاء: ${generatedAt}</span>
      </div>
    </div>`;
  await addSectionToPdf(pdf, await renderSectionToImage(headerHTML), cursor);

  // 2. Summary stats
  if (summaryStats?.length) {
    const summaryHTML = `<div style="padding:16px 30px;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
        ${summaryStats.map(s => `<div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:20px 16px;text-align:center;">
          <div style="font-size:13px;color:#475569;font-weight:600;margin-bottom:8px;">${s.label}</div>
          <div style="font-size:28px;font-weight:800;color:#1e3a5f;">${s.value}</div>
        </div>`).join("")}
      </div>
    </div>`;
    await addSectionToPdf(pdf, await renderSectionToImage(summaryHTML), cursor);
  }

  // 3. Charts – 2 per row
  if (chartImages?.length) {
    for (let i = 0; i < chartImages.length; i += 2) {
      const pair = chartImages.slice(i, i + 2);
      const cols = pair.length === 2 ? "repeat(2,1fr)" : "1fr";
      const rowHTML = `<div style="padding:0 30px;">
        <div style="display:grid;grid-template-columns:${cols};gap:20px;">
          ${pair.map(c => `<div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:14px;font-weight:700;color:#1e3a5f;padding:14px 18px 10px;border-bottom:1px solid #f1f5f9;background:#f8fafc;">${c.title}</div>
            <img src="${c.imageDataUrl}" style="width:100%;height:auto;display:block;padding:10px;background:#fff;" alt="${c.title}" />
          </div>`).join("")}
        </div>
      </div>`;
      await addSectionToPdf(pdf, await renderSectionToImage(rowHTML), cursor);
    }
  }

  // 4. Tables – each as its own section
  for (const section of sections) {
    const tableHTML = `<div style="padding:0 30px;">
      <div style="margin-bottom:8px;">
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
    </div>`;
    await addSectionToPdf(pdf, await renderSectionToImage(tableHTML), cursor);
  }

  // 5. Footer
  const footerHTML = `<div style="padding:16px 30px;">
    <div style="padding-top:16px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
      <span>YouthHubSA — تقرير تحليلات المنصة</span>
      <span>${generatedAt}</span>
    </div>
  </div>`;
  await addSectionToPdf(pdf, await renderSectionToImage(footerHTML), cursor);

  // Download
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "-")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

/**
 * Capture a chart container (Card element containing a Recharts chart) as a base64 PNG.
 */
export async function captureChartAsImage(container: HTMLElement): Promise<string> {
  const hiddenEls: HTMLElement[] = [];
  const firstChild = container.children[0] as HTMLElement;
  if (firstChild && firstChild.querySelector('h1, h2, h3, [class*="title"], [class*="Title"]')) {
    firstChild.style.display = 'none';
    hiddenEls.push(firstChild);
  }

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

  hiddenEls.forEach(el => el.style.display = '');
  return canvas.toDataURL("image/png");
}
