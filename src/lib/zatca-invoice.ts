import jsPDF from "jspdf";
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

export async function generateInvoicePDF(invoice: InvoiceData, template?: InvoiceTemplateConfig) {
  const t = template ?? DEFAULT_TEMPLATE;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

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

  const pageWidth = 210;
  const margin = 15;
  const rightX = pageWidth - margin;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Tax Invoice", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(12);
  doc.text("فاتورة ضريبية", pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setDrawColor(0, 128, 128);
  doc.setLineWidth(0.8);
  doc.line(margin, y, rightX, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Seller / البائع", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${t.company_name_en}`, margin, y);
  y += 5;
  doc.text(`VAT No: ${t.vat_number}`, margin, y);
  y += 5;
  doc.text(`CR: ${t.cr_number}`, margin, y);
  y += 5;
  doc.text(`Address: ${t.address}`, margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  const details = [
    ["Invoice No:", invoice.invoiceNumber],
    ["Date:", formattedDate],
    ["Issued To:", invoice.recipientName],
    ["Project:", invoice.projectTitle],
  ];

  for (const [label, value] of details) {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 35, y);
    y += 6;
  }
  y += 5;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Description", margin + 2, y + 5.5);
  doc.text("Amount (SAR)", margin + 80, y + 5.5);
  doc.text("Commission", margin + 115, y + 5.5);
  doc.text("Net (SAR)", margin + 150, y + 5.5);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.projectTitle.substring(0, 40), margin + 2, y + 4);
  doc.text(invoice.amount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), margin + 80, y + 4);
  doc.text(invoice.commissionAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), margin + 115, y + 4);
  doc.text(netAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), margin + 150, y + 4);
  y += 10;

  doc.line(margin, y, rightX, y);
  y += 8;

  const totals = [
    ["Subtotal (Net):", `${netAmount.toFixed(2)} SAR`],
    [`VAT (${(vatRate * 100).toFixed(0)}%):`, `${vatAmount.toFixed(2)} SAR`],
    ["Total with VAT:", `${totalWithVat.toFixed(2)} SAR`],
  ];

  for (let i = 0; i < totals.length; i++) {
    const isTotal = i === totals.length - 1;
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 11 : 10);
    doc.text(totals[i][0], margin + 110, y);
    doc.text(totals[i][1], rightX, y, { align: "right" });
    y += 7;
  }
  y += 5;

  doc.setDrawColor(0, 128, 128);
  doc.line(margin, y, rightX, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ZATCA QR Code:", margin, y);
  y += 3;
  doc.addImage(qrDataUrl, "PNG", margin, y, 35, 35);

  const footerY = 280;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(t.footer_text, pageWidth / 2, footerY, { align: "center" });
  doc.text(
    `Generated on ${new Date().toISOString().slice(0, 10)}`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
