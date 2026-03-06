import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { BRAND, BASE_FONT, loadArabicFont, getLogoBase64 } from "./pdf-utils";

function encodeTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(value);
  const result = new Uint8Array(2 + encoded.length);
  result[0] = tag;
  result[1] = encoded.length;
  result.set(encoded, 2);
  return result;
}

function generateZatcaTLV(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: string,
  vatAmount: string
): string {
  const parts = [
    encodeTLV(1, sellerName),
    encodeTLV(2, vatNumber),
    encodeTLV(3, timestamp),
    encodeTLV(4, totalWithVat),
    encodeTLV(5, vatAmount),
  ];
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return btoa(String.fromCharCode(...merged));
}

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

export interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  commissionAmount: number;
  createdAt: string;
  projectTitle: string;
  recipientName: string;
}

async function renderHtmlToImage(html: string, width: number): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: ${width}px; background: #ffffff; color: ${BRAND.text};
    font-family: ${BASE_FONT};
    direction: rtl; unicode-bidi: embed; padding: 0;
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
    scale: 2,
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

  const baseAmount = invoice.amount;
  const commission = invoice.commissionAmount;
  const vatRate = 0.15;
  const vatAmount = baseAmount * vatRate;
  const total = baseAmount + commission + vatAmount;
  const invoiceDate = new Date(invoice.createdAt);
  const formattedDate = invoiceDate.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const isoDate = invoiceDate.toISOString();

  const tlvBase64 = generateZatcaTLV(
    t.company_name,
    t.vat_number,
    isoDate,
    total.toFixed(2),
    vatAmount.toFixed(2)
  );

  const qrDataUrl = await QRCode.toDataURL(tlvBase64, {
    width: 150,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2 });

  const logoImgTag = logoBase64
    ? `<img src="${logoBase64}" style="height:50px;width:auto;object-fit:contain;" />`
    : "";

  const invoiceHtml = `
    <div style="padding: 40px 50px; font-family: ${BASE_FONT}; direction: rtl; color: ${BRAND.text};">
      <!-- Header with Logo -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;margin-bottom:10px;background:linear-gradient(135deg, ${BRAND.headerBg} 0%, ${BRAND.white} 100%);border-radius:10px;padding:24px 30px;">
        <div style="text-align:right;flex:1;">
          <h1 style="font-size: 26px; font-weight: 800; margin: 0; color:${BRAND.primary};font-family:${BASE_FONT};">فاتورة</h1>
           <p style="font-size: 14px; color: ${BRAND.textMuted}; margin: 4px 0 0;direction:ltr;text-align:right;">Invoice</p>
        </div>
        <div style="text-align:left;direction:ltr;display:flex;align-items:center;gap:12px;">
          <div>
            <div style="font-size:16px;font-weight:800;color:${BRAND.primary};letter-spacing:0.5px;">${t.company_name_en}</div>
            <div style="font-size:10px;color:${BRAND.textMuted};">${t.company_name}</div>
          </div>
          ${logoImgTag}
        </div>
      </div>

      <hr style="border: none; border-top: 3px solid ${BRAND.primary}; margin: 15px 0 20px;" />

      <!-- Seller Info -->
      <div style="margin-bottom: 20px;background:${BRAND.rowAlt};border-radius:8px;padding:16px 20px;border:1px solid ${BRAND.border};">
        <p style="font-weight: 700; font-size: 13px; margin-bottom: 8px;color:${BRAND.primary};">البائع / Seller</p>
        <p style="margin: 2px 0; font-size: 12px;">الاسم: ${t.company_name_en} / ${t.company_name}</p>
        <p style="margin: 2px 0; font-size: 12px; direction: ltr; text-align: right;">VAT No: ${t.vat_number}</p>
        <p style="margin: 2px 0; font-size: 12px; direction: ltr; text-align: right;">CR: ${t.cr_number}</p>
        <p style="margin: 2px 0; font-size: 12px;">العنوان: ${t.address}</p>
      </div>

      <!-- Invoice Details -->
      <div style="margin-bottom: 20px;">
        <p style="font-weight: 700; font-size: 13px; margin-bottom: 6px;color:${BRAND.primary};">تفاصيل الفاتورة</p>
        <table style="font-size: 12px; border-collapse: collapse;">
          <tr><td style="padding: 3px 0; font-weight: 600; width: 130px;">رقم الفاتورة:</td><td style="direction: ltr;">${invoice.invoiceNumber}</td></tr>
          <tr><td style="padding: 3px 0; font-weight: 600;">التاريخ:</td><td>${formattedDate}</td></tr>
          <tr><td style="padding: 3px 0; font-weight: 600;">صادرة إلى:</td><td>${invoice.recipientName}</td></tr>
          <tr><td style="padding: 3px 0; font-weight: 600;">المشروع/الخدمة:</td><td>${invoice.projectTitle}</td></tr>
        </table>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">
        <thead>
          <tr style="background: ${BRAND.headerBg};">
            <th style="padding: 10px 8px; text-align: right; border: 1px solid ${BRAND.primaryMid};color:${BRAND.primary};font-weight:700;">الوصف</th>
            <th style="padding: 10px 8px; text-align: center; border: 1px solid ${BRAND.primaryMid}; width: 120px;color:${BRAND.primary};font-weight:700;">المبلغ الأساسي (ر.س)</th>
            <th style="padding: 10px 8px; text-align: center; border: 1px solid ${BRAND.primaryMid}; width: 120px;color:${BRAND.primary};font-weight:700;">رسوم المنصة (ر.س)</th>
            <th style="padding: 10px 8px; text-align: center; border: 1px solid ${BRAND.primaryMid}; width: 120px;color:${BRAND.primary};font-weight:700;">الضريبة (ر.س)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px 8px; border: 1px solid ${BRAND.border};">${invoice.projectTitle}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid ${BRAND.border}; direction: ltr;font-weight:600;">${fmt(baseAmount)}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid ${BRAND.border}; direction: ltr;font-weight:600;">${fmt(commission)}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid ${BRAND.border}; direction: ltr;font-weight:600;">${fmt(vatAmount)}</td>
          </tr>
        </tbody>
      </table>

      <hr style="border: none; border-top: 3px solid ${BRAND.primary}; margin: 10px 0 15px;" />

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-start; margin-bottom: 20px;">
        <table style="font-size: 12px; border-collapse: collapse;background:${BRAND.headerBg};border-radius:8px;padding:12px 20px;">
          <tr><td style="padding: 4px 18px 4px 0;font-weight:600;">المبلغ الأساسي:</td><td style="direction: ltr; text-align: left;">${fmt(baseAmount)} SAR</td></tr>
          <tr><td style="padding: 4px 18px 4px 0;font-weight:600;">رسوم المنصة:</td><td style="direction: ltr; text-align: left;">${fmt(commission)} SAR</td></tr>
          <tr><td style="padding: 4px 18px 4px 0;font-weight:600;">ضريبة القيمة المضافة (${(vatRate * 100).toFixed(0)}%):</td><td style="direction: ltr; text-align: left;">${fmt(vatAmount)} SAR</td></tr>
          <tr style="font-weight: 700; font-size: 14px;color:${BRAND.primary};"><td style="padding: 6px 18px 4px 0;">الإجمالي:</td><td style="direction: ltr; text-align: left;">${fmt(total)} SAR</td></tr>
        </table>
      </div>

      <!-- QR Code -->
      <div style="margin-bottom: 15px;">
        <p style="font-weight: 700; font-size: 11px; margin-bottom: 5px;color:${BRAND.primary};">رمز ZATCA:</p>
        <img src="${qrDataUrl}" style="width: 100px; height: 100px;" />
      </div>

      <hr style="border: none; border-top: 3px solid ${BRAND.primary}; margin: 10px 0;" />

      <!-- Footer -->
      <div style="text-align: center; font-size: 9px; color: ${BRAND.textMuted}; direction: ltr;display:flex;justify-content:space-between;align-items:center;">
        <p style="margin: 2px 0;">${t.footer_text}</p>
        <div style="display:flex;align-items:center;gap:6px;">
          ${logoBase64 ? `<img src="${logoBase64}" style="height:18px;width:auto;opacity:0.6;" />` : ""}
          <span style="font-weight:700;color:${BRAND.primary};font-size:10px;">${t.company_name_en}</span>
        </div>
      </div>
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
