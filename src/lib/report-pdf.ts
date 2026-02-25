import jsPDF from "jspdf";
import { format } from "date-fns";

interface ReportSection {
  title: string;
  rows: string[][];
  headers: string[];
}

/**
 * Generate a PDF report with Arabic text support (RTL).
 * jsPDF doesn't natively support Arabic shaping, so we use a simple table layout.
 */
export function generateReportPDF(
  title: string,
  dateRange: { from: Date; to: Date },
  sections: ReportSection[],
  summaryStats?: { label: string; value: string }[]
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  let y = 15;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.width / 2, y, { align: "center" });
  y += 10;

  // Date range
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`;
  doc.text(dateStr, doc.internal.pageSize.width / 2, y, { align: "center" });
  y += 8;

  // Generation timestamp
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), "yyyy/MM/dd HH:mm")}`, doc.internal.pageSize.width / 2, y, { align: "center" });
  y += 10;

  // Summary stats
  if (summaryStats?.length) {
    const colWidth = (doc.internal.pageSize.width - 30) / summaryStats.length;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    summaryStats.forEach((stat, i) => {
      const x = 15 + i * colWidth + colWidth / 2;
      doc.text(stat.label, x, y, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(stat.value, x, y + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
    });
    y += 15;
  }

  // Sections
  sections.forEach((section) => {
    if (y > doc.internal.pageSize.height - 30) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 15, y);
    y += 7;

    // Table header
    const cols = section.headers.length;
    const colW = (doc.internal.pageSize.width - 30) / cols;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 4, doc.internal.pageSize.width - 30, 6, "F");
    section.headers.forEach((h, i) => {
      doc.text(h, 15 + i * colW + 2, y);
    });
    y += 5;

    // Table rows
    doc.setFont("helvetica", "normal");
    section.rows.forEach((row) => {
      if (y > doc.internal.pageSize.height - 15) {
        doc.addPage();
        y = 15;
      }
      row.forEach((cell, i) => {
        doc.text(String(cell ?? ""), 15 + i * colW + 2, y);
      });
      y += 4.5;
    });

    y += 8;
  });

  doc.save(`${title.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
}
