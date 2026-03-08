import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { BRAND, BASE_FONT, loadArabicFont, getLogoBase64, bdiTag, generateRefNumber } from "./pdf-utils";

export interface InvoiceTemplateConfig {
  company_name: string;
  company_name_en: string;
  vat_number: string;
  cr_number: string;
  address: string;
  footer_text: string;
  logo_url: string;
}

const DEFAULT_TEMPLATE: InvoiceTemplateConfig = {
  company_name: "منصة الشباب",
  company_name_en: "Youth Hub SA",
  vat_number: "300000000000003",
  cr_number: "1234567890",
  address: "المملكة العربية السعودية",
  footer_text: "This is a computer-generated invoice. No signature required.",
  logo_url: "",
};

export type InvoiceType = "project" | "service" | "grant" | "other";

export interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  commissionAmount: number;
  vatAmount?: number;
  createdAt: string;
  projectTitle: string;
  recipientName: string;
  invoiceType: InvoiceType;
  linkedEntityName?: string;
}

const INVOICE_TYPE_LABELS: Record<InvoiceType, { ar: string; en: string; color: string }> = {
  project: { ar: "طلب / مشروع", en: "Project", color: "#0f766e" },
  service: { ar: "خدمة", en: "Service", color: "#2563eb" },
  grant: { ar: "منحة / تبرع", en: "Grant", color: "#b59535" },
  other: { ar: "أخرى", en: "Other", color: "#64748b" },
};

/** Wrap LTR content (numbers, symbols, brackets) to prevent reversal */
const ltr = (text: string) => `<span dir="ltr" style="unicode-bidi:isolate;display:inline-block;">${text}</span>`;

async function renderHtmlToImage(html: string, width: number): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.setAttribute("dir", "rtl");
  container.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: ${width}px; background: #ffffff; color: ${BRAND.text};
    font-family: ${BASE_FONT};
    direction: rtl; unicode-bidi: isolate; text-align: right;
    text-rendering: optimizeLegibility; word-spacing: 2px;
    padding: 0;
  `;
  container.innerHTML = html;
  document.body.appendChild(container);

  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((r) => {
          if (img.complete) r();
          else { img.onload = () => r(); img.onerror = () => r(); }
        })
    )
  );

  const canvas = await html2canvas(container, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    width,
    windowWidth: width,
  });

  document.body.removeChild(container);
  return canvas;
}

export async function generateInvoicePDF(invoice: InvoiceData, template?: InvoiceTemplateConfig) {
  await loadArabicFont();

  const t = template ?? DEFAULT_TEMPLATE;
  const logoBase64 = await getLogoBase64(t.logo_url || undefined);
  const refNumber = generateRefNumber();

  const baseAmount = invoice.amount;
  const commission = invoice.commissionAmount;
  const vat = invoice.vatAmount ?? Math.round(baseAmount * 0.15 * 100) / 100;
  const total = baseAmount + commission + vat;
  const invoiceDate = new Date(invoice.createdAt);
  const formattedDate = invoiceDate.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const typeInfo = INVOICE_TYPE_LABELS[invoice.invoiceType] ?? INVOICE_TYPE_LABELS.other;

  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2 });

  const logoImgTag = logoBase64
    ? `<img src="${logoBase64}" style="height:50px;width:auto;object-fit:contain;" />`
    : "";

  const entityLabel = invoice.invoiceType === "service"
    ? bdiTag("الخدمة")
    : invoice.invoiceType === "grant"
      ? bdiTag("المنحة")
      : bdiTag("الطلب/المشروع");

  const invoiceHtml = `
    <div style="padding: 0; font-family: ${BASE_FONT}; direction: rtl; color: ${BRAND.text};">
      <!-- Gold accent bar -->
      <div style="height:6px;background:linear-gradient(90deg,${BRAND.accent},${BRAND.accentLight},${BRAND.accent});border-radius:3px 3px 0 0;"></div>

      <div style="padding: 36px 50px 40px;">
        <!-- Official document label -->
        <div style="text-align:center;margin-bottom:8px;">
          <span style="font-size:10px;color:${BRAND.accent};font-weight:700;letter-spacing:2px;">${bdiTag("وثيقة رسمية")} — Official Document</span>
        </div>
        <div style="text-align:center;margin-bottom:18px;">
          <span style="font-size:9px;color:${BRAND.textMuted};">${ltr(refNumber)}</span>
        </div>

        <!-- Header with Logo -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 28px;margin-bottom:10px;background:linear-gradient(135deg, ${BRAND.headerBg} 0%, ${BRAND.white} 100%);border-radius:10px;border:1px solid ${BRAND.primaryMid};">
          <div style="text-align:right;flex:1;">
            <h1 style="font-size:26px;font-weight:800;margin:0;color:${BRAND.primary};font-family:${BASE_FONT};">${bdiTag("فاتورة")}</h1>
            <p style="font-size:14px;color:${BRAND.textMuted};margin:4px 0 0;direction:ltr;text-align:right;">Invoice</p>
          </div>
          <div style="text-align:left;direction:ltr;display:flex;align-items:center;gap:12px;">
            <div>
              <div style="font-size:16px;font-weight:800;color:${BRAND.primary};letter-spacing:0.5px;">${t.company_name_en}</div>
              <div style="font-size:10px;color:${BRAND.textMuted};">${bdiTag(t.company_name)}</div>
            </div>
            ${logoImgTag}
          </div>
        </div>

        <hr style="border:none;border-top:3px solid ${BRAND.primary};margin:15px 0 20px;" />

        <!-- Seller Info -->
        <div style="margin-bottom:20px;background:${BRAND.rowAlt};border-radius:8px;padding:16px 20px;border:1px solid ${BRAND.border};">
          <p style="font-weight:700;font-size:13px;margin-bottom:8px;color:${BRAND.primary};">${bdiTag("البائع")} / Seller</p>
          <p style="margin:2px 0;font-size:12px;">${bdiTag("الاسم:")} ${t.company_name_en} / ${bdiTag(t.company_name)}</p>
          <p style="margin:2px 0;font-size:12px;">${bdiTag("السجل التجاري:")} ${ltr(t.cr_number)}</p>
          <p style="margin:2px 0;font-size:12px;">${bdiTag("العنوان:")} ${bdiTag(t.address)}</p>
        </div>

        <!-- Invoice Details -->
        <div style="margin-bottom:20px;">
          <p style="font-weight:700;font-size:13px;margin-bottom:6px;color:${BRAND.primary};">${bdiTag("تفاصيل الفاتورة")}</p>
          <table style="font-size:12px;border-collapse:collapse;">
            <tr>
              <td style="padding:3px 0;font-weight:600;width:130px;">${bdiTag("رقم الفاتورة:")}</td>
              <td style="direction:ltr;">${ltr(invoice.invoiceNumber)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-weight:600;">${bdiTag("التاريخ:")}</td>
              <td>${ltr(formattedDate)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-weight:600;">${bdiTag("صادرة إلى:")}</td>
              <td>${bdiTag(invoice.recipientName)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-weight:600;">${bdiTag("نوع الفاتورة:")}</td>
              <td>
                <span style="display:inline-block;background:${typeInfo.color}15;color:${typeInfo.color};padding:2px 10px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid ${typeInfo.color}30;">
                  ${bdiTag(typeInfo.ar)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-weight:600;">${entityLabel}:</td>
              <td>${bdiTag(invoice.linkedEntityName || invoice.projectTitle)}</td>
            </tr>
          </table>
        </div>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px;">
          <thead>
            <tr style="background:${BRAND.headerBg};">
              <th style="padding:10px 8px;text-align:right;border:1px solid ${BRAND.primaryMid};color:${BRAND.primary};font-weight:700;">${bdiTag("الوصف")}</th>
              <th style="padding:10px 8px;text-align:center;border:1px solid ${BRAND.primaryMid};width:120px;color:${BRAND.primary};font-weight:700;">${bdiTag("المبلغ الأساسي")} ${ltr("(ر.س)")}</th>
              <th style="padding:10px 8px;text-align:center;border:1px solid ${BRAND.primaryMid};width:120px;color:${BRAND.primary};font-weight:700;">${bdiTag("رسوم المنصة")} ${ltr("(ر.س)")}</th>
              <th style="padding:10px 8px;text-align:center;border:1px solid ${BRAND.primaryMid};width:120px;color:${BRAND.primary};font-weight:700;">${bdiTag("ضريبة")} ${ltr("15%")} ${ltr("(ر.س)")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 8px;border:1px solid ${BRAND.border};">${bdiTag(invoice.linkedEntityName || invoice.projectTitle)}</td>
              <td style="padding:10px 8px;text-align:center;border:1px solid ${BRAND.border};direction:ltr;font-weight:600;">${ltr(fmt(baseAmount))}</td>
              <td style="padding:10px 8px;text-align:center;border:1px solid ${BRAND.border};direction:ltr;font-weight:600;">${ltr(fmt(commission))}</td>
              <td style="padding:10px 8px;text-align:center;border:1px solid ${BRAND.border};direction:ltr;font-weight:600;">${ltr(fmt(vat))}</td>
            </tr>
          </tbody>
        </table>

        <hr style="border:none;border-top:3px solid ${BRAND.primary};margin:10px 0 15px;" />

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-start;margin-bottom:20px;">
          <table style="font-size:12px;border-collapse:collapse;background:${BRAND.headerBg};border-radius:8px;padding:12px 20px;">
            <tr>
              <td style="padding:4px 18px 4px 0;font-weight:600;">${bdiTag("المبلغ الأساسي:")}</td>
              <td style="direction:ltr;text-align:left;">${ltr(fmt(baseAmount) + " SAR")}</td>
            </tr>
            <tr>
              <td style="padding:4px 18px 4px 0;font-weight:600;">${bdiTag("رسوم المنصة:")}</td>
              <td style="direction:ltr;text-align:left;">${ltr(fmt(commission) + " SAR")}</td>
            </tr>
            <tr>
              <td style="padding:4px 18px 4px 0;font-weight:600;">${bdiTag("ضريبة القيمة المضافة")} ${ltr("(15%)")}:</td>
              <td style="direction:ltr;text-align:left;">${ltr(fmt(vat) + " SAR")}</td>
            </tr>
            <tr style="font-weight:700;font-size:14px;color:${BRAND.primary};">
              <td style="padding:6px 18px 4px 0;">${bdiTag("الإجمالي:")}</td>
              <td style="direction:ltr;text-align:left;">${ltr(fmt(total) + " SAR")}</td>
            </tr>
          </table>
        </div>

        <hr style="border:none;border-top:3px solid ${BRAND.primary};margin:10px 0;" />

        <!-- Footer -->
        <div style="text-align:center;font-size:9px;color:${BRAND.textMuted};direction:ltr;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;">
            <p style="margin:0;">${t.footer_text}</p>
            <p style="margin:0;color:${BRAND.accent};font-weight:600;">${bdiTag("فاتورة إلكترونية آلية")}</p>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${logoBase64 ? `<img src="${logoBase64}" style="height:18px;width:auto;opacity:0.6;" />` : ""}
            <span style="font-weight:700;color:${BRAND.primary};font-size:10px;">${t.company_name_en}</span>
          </div>
        </div>
      </div>

      <!-- Bottom gold bar -->
      <div style="height:4px;background:linear-gradient(90deg,${BRAND.accent},${BRAND.accentLight},${BRAND.accent});border-radius:0 0 3px 3px;"></div>
    </div>
  `;

  const canvas = await renderHtmlToImage(invoiceHtml, 800);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfMargin = 5;
  const usable = pdfWidth - 2 * pdfMargin;
  const imgHeight = (canvas.height / canvas.width) * usable;

  pdf.addImage(imgData, "PNG", pdfMargin, pdfMargin, usable, imgHeight);
  pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
