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

/* ── Brand palette ── */
const BRAND = {
  primary: "#0f766e",        // teal-700
  primaryLight: "#ccfbf1",   // teal-50
  primaryMid: "#99f6e4",     // teal-200
  accent: "#b59535",         // royal gold
  text: "#1e293b",           // slate-800
  textMuted: "#64748b",      // slate-500
  border: "#e2e8f0",         // slate-200
  headerBg: "#f0fdfa",       // teal-50
  rowAlt: "#f8fafc",         // slate-50
  white: "#ffffff",
};

const BASE_FONT = `'Cairo', 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif`;

let fontLoaded = false;
async function loadArabicFont(): Promise<void> {
  if (fontLoaded) return;
  try {
    const font = new FontFace(
      "Cairo",
      "url(https://fonts.gstatic.com/s/cairo/v28/SLXvx02YPrCeLKoN-at6p1N2aQ.woff2)",
      { weight: "400 900", style: "normal" }
    );
    const loaded = await font.load();
    document.fonts.add(loaded);
    await document.fonts.ready;
    fontLoaded = true;
  } catch {
    console.warn("Failed to load Cairo font, falling back to system fonts");
  }
}

function createOffscreenContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: ${CONTAINER_WIDTH}px; background: ${BRAND.white}; color: ${BRAND.text};
    font-family: ${BASE_FONT};
    direction: rtl; unicode-bidi: embed; padding: 0;
  `;
  document.body.appendChild(el);
  return el;
}

async function renderSectionToImage(html: string): Promise<string> {
  const container = createOffscreenContainer();
  container.innerHTML = html;
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((r) => {
          if (img.complete) r();
          else {
            img.onload = () => r();
            img.onerror = () => r();
          }
        })
    )
  );
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: BRAND.white,
    logging: false,
  });
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

async function addSectionToPdf(
  pdf: jsPDF,
  dataUrl: string,
  cursor: { y: number }
) {
  const h = await imgHeightMM(dataUrl);
  if (cursor.y + h > PAGE_HEIGHT_MM && cursor.y > PADDING_MM) {
    pdf.addPage();
    cursor.y = PADDING_MM;
  }
  pdf.addImage(dataUrl, "PNG", 0, cursor.y, PAGE_WIDTH_MM, h);
  cursor.y += h + PADDING_MM;
}

/* ── Helpers for formatted currency ── */
function formatCell(cell: string): string {
  // Bold currency values like "9500" next to headers containing "ر.س"
  const num = Number(cell);
  if (!isNaN(num) && cell.trim() !== "") {
    return `<span style="font-weight:700;letter-spacing:0.3px;">${num.toLocaleString("ar-SA")}</span>`;
  }
  return cell ?? "";
}

/**
 * Generate a professional PDF report and trigger download.
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
  const dateOnly = format(new Date(), "yyyy/MM/dd");

  await loadArabicFont();

  const pdf = new jsPDF("p", "mm", "a4");
  const cursor = { y: 0 };

  // ─── 1. Professional Header ───
  const headerHTML = `
    <div dir="rtl" style="padding:40px 50px 28px;border-bottom:3px solid ${BRAND.primary};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="text-align:right;">
          <h1 style="font-size:30px;font-weight:800;color:${BRAND.primary};margin:0 0 6px;font-family:${BASE_FONT};">${title}</h1>
          <div style="font-size:13px;color:${BRAND.textMuted};font-weight:500;">الفترة: ${dateStr}</div>
        </div>
        <div style="text-align:left;direction:ltr;">
          <div style="font-size:22px;font-weight:800;color:${BRAND.primary};letter-spacing:1px;">YouthHubSA</div>
          <div style="font-size:11px;color:${BRAND.textMuted};margin-top:2px;">${dateOnly}</div>
        </div>
      </div>
    </div>`;
  await addSectionToPdf(pdf, await renderSectionToImage(headerHTML), cursor);

  // ─── 2. Summary Stats ───
  if (summaryStats?.length) {
    const summaryHTML = `<div dir="rtl" style="padding:20px 50px 8px;">
      <div style="display:grid;grid-template-columns:repeat(${summaryStats.length},1fr);gap:18px;">
        ${summaryStats
          .map(
            (s) => `
          <div style="border:1.5px solid ${BRAND.primaryMid};border-radius:10px;padding:22px 16px;text-align:center;background:${BRAND.headerBg};">
            <div style="font-size:12px;color:${BRAND.textMuted};font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">${s.label}</div>
            <div style="font-size:30px;font-weight:800;color:${BRAND.primary};">${s.value}</div>
          </div>`
          )
          .join("")}
      </div>
    </div>`;
    await addSectionToPdf(pdf, await renderSectionToImage(summaryHTML), cursor);
  }

  // ─── 3. Charts – 2 per row ───
  if (chartImages?.length) {
    for (let i = 0; i < chartImages.length; i += 2) {
      const pair = chartImages.slice(i, i + 2);
      const cols = pair.length === 2 ? "repeat(2,1fr)" : "1fr";
      const rowHTML = `<div dir="rtl" style="padding:12px 50px;">
        <div style="display:grid;grid-template-columns:${cols};gap:24px;">
          ${pair
            .map(
              (c) => `
            <div style="border:1.5px solid ${BRAND.border};border-radius:10px;overflow:hidden;background:${BRAND.white};">
              <div style="font-size:14px;font-weight:700;color:${BRAND.primary};padding:14px 20px 10px;border-bottom:1px solid ${BRAND.border};background:${BRAND.headerBg};font-family:${BASE_FONT};">${c.title}</div>
              <img src="${c.imageDataUrl}" style="width:100%;height:auto;display:block;padding:12px;background:${BRAND.white};" alt="${c.title}" />
            </div>`
            )
            .join("")}
        </div>
      </div>`;
      await addSectionToPdf(pdf, await renderSectionToImage(rowHTML), cursor);
    }
  }

  // ─── 4. Tables – professional clean style ───
  for (const section of sections) {
    const isCurrencyTable = section.headers.some((h) => h.includes("ر.س"));
    const tableHTML = `<div dir="rtl" style="padding:12px 50px;">
      <h2 style="font-size:18px;font-weight:800;color:${BRAND.primary};margin-bottom:14px;padding-bottom:8px;border-bottom:2.5px solid ${BRAND.primary};font-family:${BASE_FONT};">${section.title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr>
            ${section.headers
              .map(
                (h) =>
                  `<th style="background:${BRAND.headerBg};color:${BRAND.primary};padding:14px 20px;text-align:center;font-weight:700;font-size:13px;border-bottom:2px solid ${BRAND.primaryMid};font-family:${BASE_FONT};">${h}</th>`
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${section.rows
            .map(
              (row, i) => `
            <tr style="background:${i % 2 === 0 ? BRAND.white : BRAND.rowAlt};">
              ${row
                .map(
                  (cell) =>
                    `<td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};font-size:13px;text-align:center;line-height:1.8;${isCurrencyTable ? "font-variant-numeric:tabular-nums;" : ""}">${formatCell(cell)}</td>`
                )
                .join("")}
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
    await addSectionToPdf(pdf, await renderSectionToImage(tableHTML), cursor);
  }

  // ─── 5. Professional Footer ───
  const footerHTML = `<div dir="rtl" style="padding:24px 50px 16px;">
    <div style="padding-top:16px;border-top:2px solid ${BRAND.border};display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:11px;color:${BRAND.textMuted};font-weight:500;">تاريخ الإصدار: ${generatedAt}</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;color:${BRAND.textMuted};">تقرير صادر من</span>
        <span style="font-size:13px;font-weight:800;color:${BRAND.primary};letter-spacing:0.5px;">YouthHubSA</span>
      </div>
    </div>
  </div>`;
  await addSectionToPdf(pdf, await renderSectionToImage(footerHTML), cursor);

  // ─── Download ───
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
}

/**
 * Capture a chart container (Card element containing a Recharts chart) as a base64 PNG.
 */
export async function captureChartAsImage(
  container: HTMLElement
): Promise<string> {
  const hiddenEls: HTMLElement[] = [];
  const firstChild = container.children[0] as HTMLElement;
  if (
    firstChild &&
    firstChild.querySelector(
      'h1, h2, h3, [class*="title"], [class*="Title"]'
    )
  ) {
    firstChild.style.display = "none";
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

  hiddenEls.forEach((el) => (el.style.display = ""));
  return canvas.toDataURL("image/png");
}
