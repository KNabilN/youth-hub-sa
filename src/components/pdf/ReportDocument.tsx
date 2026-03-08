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
import { reshapeAr, fmtNum } from "@/lib/pdf-fonts";

/* ── Types ── */
interface ReportSection {
  title: string;
  rows: string[][];
  headers: string[];
}

interface ChartImage {
  title: string;
  imageDataUrl: string;
}

interface Props {
  title: string;
  dateStr: string;
  generatedAt: string;
  refNumber: string;
  logoBase64: string;
  summaryStats?: { label: string; value: string }[];
  chartImages?: ChartImage[];
  sections: ReportSection[];
}

/* ── Styles ── */
const s = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 10,
    backgroundColor: "#ffffff",
    color: BRAND.text,
    paddingBottom: 30,
  },
  // Cover
  coverPage: {
    fontFamily: "Cairo",
    fontSize: 10,
    backgroundColor: "#ffffff",
    color: BRAND.text,
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverGoldBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: BRAND.accent,
  },
  coverGoldBarBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: BRAND.accent,
  },
  coverBorder: {
    position: "absolute",
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    borderWidth: 2,
    borderColor: BRAND.primaryMid,
    borderRadius: 12,
  },
  coverLogo: {
    width: 100,
    height: 100,
    objectFit: "contain",
    marginBottom: 30,
  },
  coverGoldDivider: {
    width: 160,
    height: 4,
    backgroundColor: BRAND.accent,
    borderRadius: 2,
    marginVertical: 16,
  },
  coverDocLabel: {
    fontSize: 14,
    color: BRAND.accent,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  coverDateRange: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND.text,
    marginBottom: 30,
  },
  coverRefLabel: {
    fontSize: 12,
    color: BRAND.textMuted,
    fontWeight: 700,
    marginBottom: 4,
  },
  coverRefValue: {
    fontSize: 18,
    fontWeight: 700,
    color: BRAND.primary,
    letterSpacing: 0.8,
  },
  coverDate: {
    fontSize: 11,
    color: BRAND.textMuted,
    marginTop: 24,
  },

  // Header
  goldBar: {
    height: 4,
    backgroundColor: BRAND.accent,
    borderRadius: 2,
  },
  headerContainer: {
    padding: "20px 40px 14px",
    backgroundColor: BRAND.headerBg,
    borderBottomWidth: 2,
    borderColor: BRAND.primary,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerDocLabel: {
    fontSize: 8,
    color: BRAND.accent,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "right",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "right",
  },
  headerMeta: {
    fontSize: 10,
    color: BRAND.textMuted,
    textAlign: "right",
    marginTop: 3,
  },
  headerLogo: {
    width: 48,
    height: 48,
    objectFit: "contain",
  },

  // Stats grid
  statsContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    padding: "12px 40px 6px",
    gap: 10,
  },
  statCard: {
    width: "23%",
    borderWidth: 1.5,
    borderColor: BRAND.primaryMid,
    borderRadius: 8,
    padding: "16px 10px",
    textAlign: "center",
    backgroundColor: BRAND.headerBg,
  },
  statLabel: {
    fontSize: 8,
    color: BRAND.textMuted,
    fontWeight: 700,
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "center",
  },

  // Charts
  chartsRow: {
    flexDirection: "row-reverse",
    padding: "8px 40px",
    gap: 14,
  },
  chartCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: BRAND.primary,
    padding: "10px 14px 8px",
    borderBottomWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.headerBg,
    textAlign: "right",
  },
  chartImage: {
    width: "100%",
    padding: 8,
  },

  // Tables
  sectionContainer: {
    padding: "8px 40px",
  },
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionGoldBar: {
    width: 3,
    height: 18,
    backgroundColor: BRAND.accent,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.primary,
    textAlign: "right",
  },
  tableHeaderRow: {
    flexDirection: "row-reverse",
    backgroundColor: BRAND.primary,
  },
  tableHeaderCell: {
    padding: "10px 8px",
    fontSize: 8,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    flex: 1,
  },
  tableHeaderNumCell: {
    padding: "10px 6px",
    fontSize: 8,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    width: 30,
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 0.5,
    borderColor: BRAND.border,
  },
  tableRowAlt: {
    backgroundColor: BRAND.rowAlt,
  },
  tableCell: {
    padding: "8px 8px",
    fontSize: 9,
    textAlign: "center",
    flex: 1,
  },
  tableNumCell: {
    padding: "8px 6px",
    fontSize: 9,
    fontWeight: 700,
    color: BRAND.textMuted,
    textAlign: "center",
    width: 30,
  },

  // Footer
  footerContainer: {
    padding: "14px 40px 8px",
  },
  footerDivider: {
    height: 4,
    backgroundColor: BRAND.accent,
    borderRadius: 2,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerConfidential: {
    fontSize: 8,
    color: BRAND.confidential,
    fontWeight: 700,
    textAlign: "right",
  },
  footerDate: {
    fontSize: 7,
    color: BRAND.textMuted,
    textAlign: "right",
    marginTop: 2,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND.primary,
  },
  footerBrandLabel: {
    fontSize: 7,
    color: BRAND.textMuted,
    textAlign: "right",
  },
  footerSmallLogo: {
    width: 22,
    height: 22,
    objectFit: "contain",
    opacity: 0.8,
  },
  footerRef: {
    textAlign: "center",
    fontSize: 7,
    color: BRAND.textMuted,
    marginTop: 8,
  },

  // Page number
  pageNumber: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: BRAND.textMuted,
  },
});

function formatCell(cell: string): string {
  const num = Number(cell);
  if (!isNaN(num) && cell.trim() !== "") {
    return fmtNum(num);
  }
  return cell ?? "";
}

export const ReportDocument: React.FC<Props> = ({
  title,
  dateStr,
  generatedAt,
  refNumber,
  logoBase64,
  summaryStats,
  chartImages,
  sections,
}) => {
  return (
    <Document>
      {/* ── COVER PAGE ── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverGoldBar} />
        <View style={s.coverBorder} />

        {logoBase64 ? <Image src={logoBase64} style={s.coverLogo} /> : null}

        <View style={s.coverGoldDivider} />
        <Text style={s.coverDocLabel}>{reshapeAr("وثيقة رسمية")}</Text>
        <Text style={s.coverTitle}>{reshapeAr(title)}</Text>
        <Text style={s.coverDateRange}>{reshapeAr(`الفترة: ${dateStr}`)}</Text>
        <View style={s.coverGoldDivider} />

        <Text style={s.coverRefLabel}>{reshapeAr("الرقم المرجعي")}</Text>
        <Text style={s.coverRefValue}>{refNumber}</Text>
        <Text style={s.coverDate}>{reshapeAr(`تاريخ الإصدار: ${generatedAt}`)}</Text>

        <View style={s.coverGoldBarBottom} />
      </Page>

      {/* ── CONTENT PAGES ── */}
      <Page size="A4" style={s.page} wrap>
        {/* Header */}
        <View style={s.goldBar} />
        <View style={s.headerContainer}>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerDocLabel}>
                {reshapeAr("وثيقة رسمية")} — {reshapeAr("سري")}
              </Text>
              <Text style={s.headerTitle}>{reshapeAr(title)}</Text>
              <Text style={s.headerMeta}>{reshapeAr(`الفترة: ${dateStr}`)}</Text>
              <Text style={[s.headerMeta, { fontSize: 8 }]}>{refNumber}</Text>
            </View>
            {logoBase64 ? <Image src={logoBase64} style={s.headerLogo} /> : null}
          </View>
        </View>

        {/* Summary Stats */}
        {summaryStats && summaryStats.length > 0 && (
          <View style={s.statsContainer}>
            {summaryStats.map((stat, i) => (
              <View key={i} style={s.statCard}>
                <Text style={s.statLabel}>{reshapeAr(stat.label)}</Text>
                <Text style={s.statValue}>{reshapeAr(stat.value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Charts - 2 per row */}
        {chartImages &&
          chartImages.length > 0 &&
          Array.from({ length: Math.ceil(chartImages.length / 2) }).map((_, rowIdx) => {
            const pair = chartImages.slice(rowIdx * 2, rowIdx * 2 + 2);
            return (
              <View key={rowIdx} style={s.chartsRow} wrap={false}>
                {pair.map((chart, ci) => (
                  <View key={ci} style={s.chartCard}>
                    <Text style={s.chartTitle}>{reshapeAr(chart.title)}</Text>
                    <Image src={chart.imageDataUrl} style={s.chartImage} />
                  </View>
                ))}
              </View>
            );
          })}

        {/* Data Tables */}
        {sections.map((section, si) => (
          <View key={si} style={s.sectionContainer} wrap={false}>
            <View style={s.sectionTitleRow}>
              <View style={s.sectionGoldBar} />
              <Text style={s.sectionTitle}>{reshapeAr(section.title)}</Text>
            </View>

            {/* Table header */}
            <View style={s.tableHeaderRow}>
              <Text style={s.tableHeaderNumCell}>#</Text>
              {section.headers.map((h, hi) => (
                <Text key={hi} style={s.tableHeaderCell}>
                  {reshapeAr(h)}
                </Text>
              ))}
            </View>

            {/* Table rows */}
            {section.rows.map((row, ri) => (
              <View
                key={ri}
                style={[s.tableRow, ri % 2 !== 0 ? s.tableRowAlt : {}]}
              >
                <Text style={s.tableNumCell}>{ri + 1}</Text>
                {row.map((cell, ci) => (
                  <Text key={ci} style={s.tableCell}>
                    {reshapeAr(formatCell(cell))}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={s.footerContainer} wrap={false}>
          <View style={s.footerDivider} />
          <View style={s.footerRow}>
            <View>
              <Text style={s.footerConfidential}>
                {reshapeAr("وثيقة سرية — للاستخدام الرسمي فقط")}
              </Text>
              <Text style={s.footerDate}>
                {reshapeAr(`تاريخ الإصدار: ${generatedAt}`)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {logoBase64 ? <Image src={logoBase64} style={s.footerSmallLogo} /> : null}
              <View>
                <Text style={s.footerBrandLabel}>{reshapeAr("تقرير صادر من")}</Text>
                <Text style={s.footerBrand}>YouthHubSA</Text>
              </View>
            </View>
          </View>
          <Text style={s.footerRef}>{refNumber}</Text>
        </View>

        {/* Page number */}
        <Text
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
