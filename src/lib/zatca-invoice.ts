import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

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
    console.warn("Failed to load Cairo font for invoice");
  }
}

async function renderHtmlToImage(html: string, width: number): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: ${width}px; background: #ffffff; color: #1a1a2e;
    font-family: ${BASE_FONT};
    direction: rtl; unicode-bidi: embed; padding: 0;
  `;
  container.innerHTML = html;
  document.body.appendChild(container);

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

  const netAmount = invoice.amount - invoice.commissionAmount;
  const vatRate = 0.15;
  const vatAmount = netAmount * vatRate;
  const totalWithVat = netAmount + vatAmount;
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
    totalWithVat.toFixed(2),
    vatAmount.toFixed(2)
  );

  const qrDataUrl = await QRCode.toDataURL(tlvBase64, {
    width: 150,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2 });

  const invoiceHtml = `
    <div style="padding: 40px 50px; font-family: ${BASE_FONT}; direction: rtl; color: #1a1a2e;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 10px;">
        <h1 style="font-size: 28px; font-weight: 700; margin: 0; direction: ltr;">Tax Invoice</h1>
        <p style="font-size: 16px; color: #555; margin: 5px 0 0;">فاتورة ضريبية</p>
      </div>

      <hr style="border: none; border-top: 3px solid #008080; margin: 15px 0 20px;" />

      <!-- Seller Info -->
      <div style="margin-bottom: 20px;">
        <p style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">البائع / Seller</p>
        <p style="margin: 2px 0; font-size: 12px;">الاسم: ${t.company_name_en} / ${t.company_name}</p>
        <p style="margin: 2px 0; font-size: 12px; direction: ltr; text-align: right;">VAT No: ${t.vat_number}</p>
        <p style="margin: 2px 0; font-size: 12px; direction: ltr; text-align: right;">CR: ${t.cr_number}</p>
        <p style="margin: 2px 0; font-size: 12px;">العنوان: ${t.address}</p>
      </div>

      <!-- Invoice Details -->
      <div style="margin-bottom: 20px;">
        <p style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">تفاصيل الفاتورة</p>
        <table style="font-size: 12px; border-collapse: collapse;">
          <tr><td style="padding: 2px 0; font-weight: 600; width: 120px;">رقم الفاتورة:</td><td style="direction: ltr;">${invoice.invoiceNumber}</td></tr>
          <tr><td style="padding: 2px 0; font-weight: 600;">التاريخ:</td><td>${formattedDate}</td></tr>
          <tr><td style="padding: 2px 0; font-weight: 600;">صادرة إلى:</td><td>${invoice.recipientName}</td></tr>
          <tr><td style="padding: 2px 0; font-weight: 600;">المشروع/الخدمة:</td><td>${invoice.projectTitle}</td></tr>
        </table>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px 6px; text-align: right; border: 1px solid #ddd;">الوصف</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; width: 100px;">المبلغ (ر.س)</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; width: 100px;">العمولة (ر.س)</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; width: 100px;">الصافي (ر.س)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 6px; border: 1px solid #ddd;">${invoice.projectTitle}</td>
            <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; direction: ltr;">${fmt(invoice.amount)}</td>
            <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; direction: ltr;">${fmt(invoice.commissionAmount)}</td>
            <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; direction: ltr;">${fmt(netAmount)}</td>
          </tr>
        </tbody>
      </table>

      <hr style="border: none; border-top: 3px solid #008080; margin: 10px 0 15px;" />

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-start; margin-bottom: 20px;">
        <table style="font-size: 12px; border-collapse: collapse;">
          <tr><td style="padding: 3px 15px 3px 0;">الصافي:</td><td style="direction: ltr; text-align: left;">${fmt(netAmount)} SAR</td></tr>
          <tr><td style="padding: 3px 15px 3px 0;">ضريبة القيمة المضافة (${(vatRate * 100).toFixed(0)}%):</td><td style="direction: ltr; text-align: left;">${fmt(vatAmount)} SAR</td></tr>
          <tr style="font-weight: 700; font-size: 14px;"><td style="padding: 5px 15px 3px 0;">الإجمالي شامل الضريبة:</td><td style="direction: ltr; text-align: left;">${fmt(totalWithVat)} SAR</td></tr>
        </table>
      </div>

      <!-- QR Code -->
      <div style="margin-bottom: 15px;">
        <p style="font-weight: 700; font-size: 11px; margin-bottom: 5px;">رمز ZATCA:</p>
        <img src="${qrDataUrl}" style="width: 100px; height: 100px;" />
      </div>

      <hr style="border: none; border-top: 3px solid #008080; margin: 10px 0;" />

      <!-- Footer -->
      <div style="text-align: center; font-size: 9px; color: #888; direction: ltr;">
        <p style="margin: 2px 0;">${t.footer_text}</p>
        <p style="margin: 2px 0;">Generated on ${new Date().toISOString().slice(0, 10)}</p>
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
