import React from "react";
import { pdf } from "@react-pdf/renderer";
import { BRAND, getLogoBase64, generateRefNumber } from "./pdf-utils";
import "@/lib/pdf-fonts"; // registers Cairo font
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

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

export async function generateInvoicePDF(invoice: InvoiceData, template?: InvoiceTemplateConfig) {
  const t = template ?? DEFAULT_TEMPLATE;
  const logoBase64 = await getLogoBase64(t.logo_url || undefined);
  const refNumber = generateRefNumber();

  const doc = React.createElement(InvoiceDocument, {
    invoice,
    template: t,
    logoBase64,
    refNumber,
  });

  const blob = await pdf(doc).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${invoice.invoiceNumber}.pdf`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
