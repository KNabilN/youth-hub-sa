import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

/**
 * Generate a PDF report by capturing a DOM element as-is (preserving fonts, charts, layout).
 * Supports automatic multi-page splitting for long content.
 */
export async function generateReportFromDOM(
  element: HTMLElement,
  title: string
) {
  // Hide elements marked with data-pdf-hide during capture
  const hiddenEls = element.querySelectorAll("[data-pdf-hide]");
  hiddenEls.forEach((el) => ((el as HTMLElement).style.display = "none"));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: (doc) => {
      const el = doc.body;
      el.style.direction = "rtl";
    },
  });

  // Restore hidden elements
  hiddenEls.forEach((el) => ((el as HTMLElement).style.display = ""));

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (contentHeight - heightLeft);
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  const fileName = `${title.replace(/\s+/g, "-")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  pdf.save(fileName);
}

// Re-export legacy functions for backward compatibility (invoices, hypotheses)
export { generateReportPDF, captureChartAsImage } from "./report-pdf-legacy";
