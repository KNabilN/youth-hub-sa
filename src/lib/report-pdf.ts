import { format } from "date-fns";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  BRAND,
  BASE_FONT,
  loadArabicFont,
  getLogoBase64,
  bdiTag,
  generateRefNumber,
} from "./pdf-utils";

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
const PADDING_MM = 3;
const CONTAINER_WIDTH = 1200;

/* ── Offscreen container with strong RTL enforcement ── */
function createOffscreenContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("dir", "rtl");
  el.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: ${CONTAINER_WIDTH}px; background: ${BRAND.white}; color: ${BRAND.text};
    font-family: ${BASE_FONT};
    direction: rtl; unicode-bidi: isolate; text-align: right;
    padding: 0; line-height: 1.7;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    word-spacing: 2px;
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
  const dataUrl = await toPng(container, {
    quality: 0.95,
    pixelRatio: 3,
    skipFonts: false,
    backgroundColor: BRAND.white,
  });
  document.body.removeChild(container);
  return dataUrl;
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

/* ── Page numbering & footer helper ── */
let totalPages = 0;

function addPageFooter(pdf: jsPDF, pageNum: number, refNumber: string) {
  const y = PAGE_HEIGHT_MM - 8;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  // Page number center
  pdf.text(`${pageNum}`, PAGE_WIDTH_MM / 2, y, { align: "center" });
  // Ref left
  pdf.setFontSize(7);
  pdf.text(refNumber, PAGE_WIDTH_MM - 10, y, { align: "right" });
  // Confidential stamp right
  pdf.setTextColor(153, 27, 27);
  pdf.text("\u0648\u062B\u064A\u0642\u0629 \u0631\u0633\u0645\u064A\u0629", 10, y);
  pdf.setTextColor(30, 41, 59);
}

async function addSectionToPdf(
  pdf: jsPDF,
  dataUrl: string,
  cursor: { y: number },
  refNumber: string,
  pageCounter: { count: number }
) {
  const h = await imgHeightMM(dataUrl);
  const maxContentHeight = PAGE_HEIGHT_MM - 14; // leave room for footer
  if (cursor.y + h > maxContentHeight && cursor.y > PADDING_MM) {
    addPageFooter(pdf, pageCounter.count, refNumber);
    pdf.addPage();
    pageCounter.count++;
    cursor.y = PADDING_MM;
  }
  pdf.addImage(dataUrl, "PNG", 0, cursor.y, PAGE_WIDTH_MM, h);
  cursor.y += h + PADDING_MM;
}

/* ── Helpers ── */
function formatCell(cell: string): string {
  const num = Number(cell);
  if (!isNaN(num) && cell.trim() !== "") {
    return `<span style="font-weight:700;letter-spacing:0.3px;font-variant-numeric:tabular-nums;">${num.toLocaleString("ar-SA")}</span>`;
  }
  return cell ?? "";
}

/* ── Gold accent bar shared style ── */
const GOLD_BAR = `background:linear-gradient(90deg, ${BRAND.accent}, ${BRAND.accentLight}, ${BRAND.accent});height:5px;border-radius:3px;`;

/**
 * Generate a professional government-grade PDF report and trigger download.
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
  const refNumber = generateRefNumber();

  await loadArabicFont();
  const logoBase64 = await getLogoBase64();

  const pdf = new jsPDF("p", "mm", "a4");
  const cursor = { y: 0 };
  const pageCounter = { count: 1 };

  const logoImgTag = logoBase64
    ? `<img src="${logoBase64}" style="height:60px;width:auto;object-fit:contain;" />`
    : "";

  const largeLogo = logoBase64
    ? `<img src="${logoBase64}" style="height:120px;width:auto;object-fit:contain;" />`
    : "";

  // ═══════════════════════════════════════════
  // ─── COVER PAGE ───
  // ═══════════════════════════════════════════
  const coverHTML = `
    <div dir="rtl" style="width:${CONTAINER_WIDTH}px;height:1680px;background:${BRAND.white};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;">
      <!-- Top gold bar -->
      <div style="position:absolute;top:0;left:0;right:0;${GOLD_BAR}height:8px;border-radius:0;"></div>
      
      <!-- Decorative border frame -->
      <div style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;border:2px solid ${BRAND.primaryMid};border-radius:16px;"></div>
      <div style="position:absolute;top:48px;left:48px;right:48px;bottom:48px;border:1px solid ${BRAND.border};border-radius:12px;"></div>

      <!-- Content -->
      <div style="padding:60px;">
        ${largeLogo}
        
        <div style="margin-top:60px;margin-bottom:20px;${GOLD_BAR}width:200px;margin-left:auto;margin-right:auto;"></div>
        
        <div style="font-size:18px;color:${BRAND.accent};font-weight:700;letter-spacing:2px;margin-bottom:24px;">
          ${bdiTag("وثيقة رسمية")}
        </div>
        
        <h1 style="font-size:42px;font-weight:900;color:${BRAND.primary};margin:20px 0 16px;font-family:${BASE_FONT};line-height:1.4;">
          ${bdiTag(title)}
        </h1>
        
        <div style="font-size:20px;color:${BRAND.text};font-weight:600;margin-bottom:40px;">
          ${bdiTag(`الفترة: ${dateStr}`)}
        </div>
        
        <div style="margin:20px auto;${GOLD_BAR}width:200px;"></div>
        
        <div style="margin-top:50px;">
          <div style="font-size:16px;color:${BRAND.textMuted};font-weight:600;margin-bottom:8px;">
            ${bdiTag("الرقم المرجعي")}
          </div>
          <div style="font-size:22px;font-weight:800;color:${BRAND.primary};letter-spacing:1px;direction:ltr;unicode-bidi:embed;">
            ${refNumber}
          </div>
        </div>
        
        <div style="margin-top:40px;">
          <div style="font-size:14px;color:${BRAND.textMuted};font-weight:500;">
            ${bdiTag(`تاريخ الإصدار: ${generatedAt}`)}
          </div>
        </div>
      </div>
      
      <!-- Bottom gold bar -->
      <div style="position:absolute;bottom:0;left:0;right:0;${GOLD_BAR}height:8px;border-radius:0;"></div>
    </div>`;

  await addSectionToPdf(pdf, await renderSectionToImage(coverHTML), cursor, refNumber, pageCounter);
  // Force new page after cover
  addPageFooter(pdf, pageCounter.count, refNumber);
  pdf.addPage();
  pageCounter.count++;
  cursor.y = PADDING_MM;

  // ═══════════════════════════════════════════
  // ─── OFFICIAL HEADER ───
  // ═══════════════════════════════════════════
  const headerHTML = `
    <div dir="rtl" style="padding:0;">
      <!-- Gold accent bar top -->
      <div style="${GOLD_BAR}"></div>
      
      <div style="padding:28px 50px 22px;background:linear-gradient(180deg, ${BRAND.headerBg} 0%, ${BRAND.white} 100%);border-bottom:2.5px solid ${BRAND.primary};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="text-align:right;flex:1;">
            <div style="font-size:11px;color:${BRAND.accent};font-weight:700;letter-spacing:1px;margin-bottom:8px;">
              ${bdiTag("وثيقة رسمية")} &mdash; ${bdiTag("سري")}
            </div>
            <h1 style="font-size:26px;font-weight:900;color:${BRAND.primary};margin:0 0 6px;font-family:${BASE_FONT};line-height:1.4;">
              ${bdiTag(title)}
            </h1>
            <div style="font-size:13px;color:${BRAND.textMuted};font-weight:500;">
              ${bdiTag(`الفترة: ${dateStr}`)}
            </div>
            <div style="font-size:11px;color:${BRAND.textMuted};font-weight:500;margin-top:4px;direction:ltr;unicode-bidi:embed;text-align:right;">
              ${refNumber}
            </div>
          </div>
          <div style="text-align:left;direction:ltr;unicode-bidi:embed;display:flex;align-items:center;gap:14px;">
            ${logoImgTag}
          </div>
        </div>
      </div>
    </div>`;
  await addSectionToPdf(pdf, await renderSectionToImage(headerHTML), cursor, refNumber, pageCounter);

  // ═══════════════════════════════════════════
  // ─── SUMMARY STATS ───
  // ═══════════════════════════════════════════
  if (summaryStats?.length) {
    const cols = Math.min(summaryStats.length, 4);
    const summaryHTML = `<div dir="rtl" style="padding:16px 50px 8px;">
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;">
        ${summaryStats
          .map(
            (s) => `
          <div style="border:2px solid ${BRAND.primaryMid};border-radius:12px;padding:24px 16px;text-align:center;background:linear-gradient(180deg, ${BRAND.headerBg} 0%, ${BRAND.white} 100%);box-shadow:0 2px 8px rgba(15,118,110,0.08);">
            <div style="font-size:12px;color:${BRAND.textMuted};font-weight:700;margin-bottom:12px;letter-spacing:0.5px;">
              ${bdiTag(s.label)}
            </div>
            <div style="font-size:32px;font-weight:900;color:${BRAND.primary};line-height:1.2;">
              ${bdiTag(s.value)}
            </div>
          </div>`
          )
          .join("")}
      </div>
    </div>`;
    await addSectionToPdf(pdf, await renderSectionToImage(summaryHTML), cursor, refNumber, pageCounter);
  }

  // ═══════════════════════════════════════════
  // ─── CHARTS – 2 per row ───
  // ═══════════════════════════════════════════
  if (chartImages?.length) {
    for (let i = 0; i < chartImages.length; i += 2) {
      const pair = chartImages.slice(i, i + 2);
      const gridCols = pair.length === 2 ? "repeat(2,1fr)" : "1fr";
      const rowHTML = `<div dir="rtl" style="padding:10px 50px;">
        <div style="display:grid;grid-template-columns:${gridCols};gap:20px;">
          ${pair
            .map(
              (c) => `
            <div style="border:2px solid ${BRAND.border};border-radius:12px;overflow:hidden;background:${BRAND.white};box-shadow:0 1px 4px rgba(0,0,0,0.04);">
              <div style="font-size:14px;font-weight:800;color:${BRAND.primary};padding:14px 20px 10px;border-bottom:1.5px solid ${BRAND.border};background:${BRAND.headerBg};font-family:${BASE_FONT};">
                ${bdiTag(c.title)}
              </div>
              <img src="${c.imageDataUrl}" style="width:100%;height:auto;display:block;padding:12px;background:${BRAND.white};" alt="${c.title}" />
            </div>`
            )
            .join("")}
        </div>
      </div>`;
      await addSectionToPdf(pdf, await renderSectionToImage(rowHTML), cursor, refNumber, pageCounter);
    }
  }

  // ═══════════════════════════════════════════
  // ─── DATA TABLES ───
  // ═══════════════════════════════════════════
  for (const section of sections) {
    const tableHTML = `<div dir="rtl" style="padding:10px 50px;">
      <div style="margin-bottom:14px;display:flex;align-items:center;gap:12px;">
        <div style="${GOLD_BAR}width:4px;height:24px;border-radius:2px;"></div>
        <h2 style="font-size:18px;font-weight:900;color:${BRAND.primary};margin:0;font-family:${BASE_FONT};">
          ${bdiTag(section.title)}
        </h2>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1.5px solid ${BRAND.border};border-radius:8px;overflow:hidden;">
        <thead>
          <tr>
            <th style="background:${BRAND.primary};color:${BRAND.white};padding:14px 12px;text-align:center;font-weight:700;font-size:12px;font-family:${BASE_FONT};width:45px;">
              ${bdiTag("#")}
            </th>
            ${section.headers
              .map(
                (h) =>
                  `<th style="background:${BRAND.primary};color:${BRAND.white};padding:14px 16px;text-align:center;font-weight:700;font-size:12px;font-family:${BASE_FONT};">
                    ${bdiTag(h)}
                  </th>`
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${section.rows
            .map(
              (row, i) => `
            <tr style="background:${i % 2 === 0 ? BRAND.white : BRAND.rowAlt};">
              <td style="padding:12px;border-bottom:1px solid ${BRAND.border};text-align:center;font-weight:700;color:${BRAND.textMuted};font-size:12px;">
                ${i + 1}
              </td>
              ${row
                .map(
                  (cell) =>
                    `<td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};font-size:13px;text-align:center;line-height:1.8;font-variant-numeric:tabular-nums;">
                      ${bdiTag(formatCell(cell))}
                    </td>`
                )
                .join("")}
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
    await addSectionToPdf(pdf, await renderSectionToImage(tableHTML), cursor, refNumber, pageCounter);
  }

  // ═══════════════════════════════════════════
  // ─── OFFICIAL FOOTER ───
  // ═══════════════════════════════════════════
  const smallLogoTag = logoBase64
    ? `<img src="${logoBase64}" style="height:28px;width:auto;object-fit:contain;opacity:0.8;" />`
    : "";

  const footerHTML = `<div dir="rtl" style="padding:20px 50px 12px;">
    <!-- Gold bar -->
    <div style="${GOLD_BAR}margin-bottom:16px;"></div>
    
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="text-align:right;">
        <div style="font-size:11px;color:${BRAND.confidential};font-weight:800;margin-bottom:4px;">
          ${bdiTag("وثيقة سرية — للاستخدام الرسمي فقط")}
        </div>
        <div style="font-size:10px;color:${BRAND.textMuted};font-weight:500;">
          ${bdiTag(`تاريخ الإصدار: ${generatedAt}`)}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;direction:ltr;unicode-bidi:embed;">
        ${smallLogoTag}
        <div style="text-align:right;">
          <div style="font-size:10px;color:${BRAND.textMuted};">${bdiTag("تقرير صادر من")}</div>
          <div style="font-size:14px;font-weight:900;color:${BRAND.primary};letter-spacing:0.5px;">YouthHubSA</div>
        </div>
      </div>
    </div>
    
    <div style="text-align:center;margin-top:12px;">
      <div style="font-size:9px;color:${BRAND.textMuted};direction:ltr;unicode-bidi:embed;">
        ${refNumber}
      </div>
    </div>
  </div>`;
  await addSectionToPdf(pdf, await renderSectionToImage(footerHTML), cursor, refNumber, pageCounter);

  // Add footer to last page
  addPageFooter(pdf, pageCounter.count, refNumber);

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
 * Capture a chart container as a base64 PNG.
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

  // Force light mode styles on the container
  container.style.background = "#ffffff";
  container.style.color = "#1a1a2e";
  container.classList.remove("dark");

  const dataUrl = await toPng(container, {
    quality: 0.95,
    pixelRatio: 3,
    skipFonts: false,
    backgroundColor: "#ffffff",
  });

  hiddenEls.forEach((el) => (el.style.display = ""));
  return dataUrl;
}
