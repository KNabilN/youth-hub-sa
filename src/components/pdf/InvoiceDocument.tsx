import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { BRAND } from "@/lib/pdf-utils";
import { reshapeAr, fmtCurrency } from "@/lib/pdf-fonts";
import type { InvoiceData, InvoiceTemplateConfig, InvoiceType } from "@/lib/zatca-invoice";

const INVOICE_TYPE_LABELS: Record<InvoiceType, { ar: string; en: string; color: string }> = {
  project: { ar: "طلب / مشروع", en: "Project", color: "#0f766e" },
  service: { ar: "خدمة", en: "Service", color: "#2563eb" },
  grant: { ar: "منحة / تبرع", en: "Grant", color: "#b59535" },
  other: { ar: "أخرى", en: "Other", color: "#64748b" },
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 10,
    padding: 0,
    backgroundColor: "#ffffff",
    color: BRAND.text,
  },
  goldBar: {
    height: 6,
    backgroundColor: BRAND.accent,
  },
  body: {
    padding: "28px 40px 20px",
  },
  // Header
  officialLabel: {
    textAlign: "center",
    fontSize: 8,
    color: BRAND.accent,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  refCenter: {
    textAlign: "center",
    fontSize: 7,
    color: BRAND.textMuted,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    marginBottom: 8,
    backgroundColor: BRAND.headerBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.primaryMid,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: BRAND.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: BRAND.textMuted,
    marginTop: 2,
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
    color: BRAND.primary,
  },
  companyNameAr: {
    fontSize: 8,
    color: BRAND.textMuted,
  },
  divider: {
    height: 2.5,
    backgroundColor: BRAND.primary,
    marginVertical: 12,
  },
  // Seller box
  sellerBox: {
    backgroundColor: BRAND.rowAlt,
    borderRadius: 6,
    padding: "12px 16px",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  sellerTitle: {
    fontWeight: 700,
    fontSize: 11,
    color: BRAND.primary,
    marginBottom: 6,
    textAlign: "right",
  },
  sellerLine: {
    fontSize: 9,
    marginBottom: 2,
    textAlign: "right",
  },
  // Details table
  detailSection: {
    marginBottom: 14,
  },
  detailTitle: {
    fontWeight: 700,
    fontSize: 11,
    color: BRAND.primary,
    marginBottom: 6,
    textAlign: "right",
  },
  detailRow: {
    flexDirection: "row-reverse",
    marginBottom: 3,
  },
  detailLabel: {
    fontWeight: 700,
    fontSize: 9,
    width: 100,
    textAlign: "right",
  },
  detailValue: {
    fontSize: 9,
    flex: 1,
    textAlign: "right",
  },
  typeBadge: {
    fontSize: 8,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Items table
  tableHeader: {
    flexDirection: "row-reverse",
    backgroundColor: BRAND.headerBg,
    borderWidth: 1,
    borderColor: BRAND.primaryMid,
  },
  tableHeaderCell: {
    padding: "8px 6px",
    fontSize: 8,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: BRAND.primaryMid,
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BRAND.border,
  },
  tableCell: {
    padding: "8px 6px",
    fontSize: 9,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: BRAND.border,
  },
  // Totals
  totalsBox: {
    backgroundColor: BRAND.headerBg,
    borderRadius: 6,
    padding: "10px 16px",
    marginTop: 10,
    marginBottom: 14,
    alignSelf: "flex-end",
    minWidth: 220,
  },
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 9,
    textAlign: "left",
  },
  grandTotalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: BRAND.primary,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "right",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "left",
  },
  // Footer
  footerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: BRAND.textMuted,
  },
  footerBrand: {
    fontSize: 8,
    fontWeight: 700,
    color: BRAND.primary,
  },
  footerAutoLabel: {
    fontSize: 7,
    color: BRAND.accent,
    fontWeight: 700,
  },
});

interface Props {
  invoice: InvoiceData;
  template: InvoiceTemplateConfig;
  logoBase64: string;
  refNumber: string;
}

export const InvoiceDocument: React.FC<Props> = ({
  invoice,
  template,
  logoBase64,
  refNumber,
}) => {
  const t = template;
  const typeInfo = INVOICE_TYPE_LABELS[invoice.invoiceType] ?? INVOICE_TYPE_LABELS.other;

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

  const entityLabel =
    invoice.invoiceType === "service"
      ? "الخدمة"
      : invoice.invoiceType === "grant"
      ? "المنحة"
      : "الطلب/المشروع";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Top gold bar */}
        <View style={s.goldBar} />

        <View style={s.body}>
          {/* Official label */}
          <Text style={s.officialLabel}>
            {reshapeAr("وثيقة رسمية")} — Official Document
          </Text>
          <Text style={s.refCenter}>{refNumber}</Text>

          {/* Header */}
          <View style={s.headerRow}>
            <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
              {logoBase64 ? (
                <Image src={logoBase64} style={s.logo} />
              ) : null}
              <View>
                <Text style={s.companyName}>{t.company_name_en}</Text>
                <Text style={s.companyNameAr}>{reshapeAr(t.company_name)}</Text>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={s.headerTitle}>{reshapeAr("فاتورة")}</Text>
              <Text style={s.headerSubtitle}>Invoice</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <View style={s.divider} />

          {/* Seller info */}
          <View style={s.sellerBox}>
            <Text style={s.sellerTitle}>
              {reshapeAr("البائع")} / Seller
            </Text>
            <Text style={s.sellerLine}>
              {reshapeAr("الاسم:")} {t.company_name_en} / {reshapeAr(t.company_name)}
            </Text>
            <Text style={s.sellerLine}>
              {reshapeAr("السجل التجاري:")} {t.cr_number}
            </Text>
            <Text style={s.sellerLine}>
              {reshapeAr("العنوان:")} {reshapeAr(t.address)}
            </Text>
          </View>

          {/* Invoice details */}
          <View style={s.detailSection}>
            <Text style={s.detailTitle}>{reshapeAr("تفاصيل الفاتورة")}</Text>

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>{reshapeAr("رقم الفاتورة:")}</Text>
              <Text style={s.detailValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>{reshapeAr("التاريخ:")}</Text>
              <Text style={s.detailValue}>{formattedDate}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>{reshapeAr("صادرة إلى:")}</Text>
              <Text style={s.detailValue}>{reshapeAr(invoice.recipientName)}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>{reshapeAr("نوع الفاتورة:")}</Text>
              <Text
                style={[
                  s.typeBadge,
                  {
                    color: typeInfo.color,
                    backgroundColor: typeInfo.color + "15",
                    borderWidth: 1,
                    borderColor: typeInfo.color + "30",
                  },
                ]}
              >
                {reshapeAr(typeInfo.ar)}
              </Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>{reshapeAr(entityLabel)}:</Text>
              <Text style={s.detailValue}>
                {reshapeAr(invoice.linkedEntityName || invoice.projectTitle)}
              </Text>
            </View>
          </View>

          {/* Items table */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 3 }]}>{reshapeAr("الوصف")}</Text>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>{reshapeAr("المبلغ الأساسي")} (ر.س)</Text>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>{reshapeAr("رسوم المنصة")} (ر.س)</Text>
            <Text style={[s.tableHeaderCell, { flex: 2, borderRightWidth: 0 }]}>
              {reshapeAr("ضريبة")} 15% (ر.س)
            </Text>
          </View>
          <View style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 3, textAlign: "right" }]}>
              {reshapeAr(invoice.linkedEntityName || invoice.projectTitle)}
            </Text>
            <Text style={[s.tableCell, { flex: 2 }]}>{fmtCurrency(baseAmount)}</Text>
            <Text style={[s.tableCell, { flex: 2 }]}>{fmtCurrency(commission)}</Text>
            <Text style={[s.tableCell, { flex: 2, borderRightWidth: 0 }]}>{fmtCurrency(vat)}</Text>
          </View>

          <View style={s.divider} />

          {/* Totals */}
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{reshapeAr("المبلغ الأساسي:")}</Text>
              <Text style={s.totalValue}>{fmtCurrency(baseAmount)} SAR</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{reshapeAr("رسوم المنصة:")}</Text>
              <Text style={s.totalValue}>{fmtCurrency(commission)} SAR</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{reshapeAr("ضريبة القيمة المضافة")} (15%):</Text>
              <Text style={s.totalValue}>{fmtCurrency(vat)} SAR</Text>
            </View>
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>{reshapeAr("الإجمالي:")}</Text>
              <Text style={s.grandTotalValue}>{fmtCurrency(total)} SAR</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Footer */}
          <View style={s.footerRow}>
            <View>
              <Text style={s.footerText}>{t.footer_text}</Text>
              <Text style={s.footerAutoLabel}>{reshapeAr("فاتورة إلكترونية آلية")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              {logoBase64 ? (
                <Image src={logoBase64} style={{ width: 14, height: 14, opacity: 0.6 }} />
              ) : null}
              <Text style={s.footerBrand}>{t.company_name_en}</Text>
            </View>
          </View>
        </View>

        {/* Bottom gold bar */}
        <View style={[s.goldBar, { height: 4 }]} />
      </Page>
    </Document>
  );
};
