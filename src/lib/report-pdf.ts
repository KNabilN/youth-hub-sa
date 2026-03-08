import { format } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { getLogoBase64, generateRefNumber } from "./pdf-utils";
import "@/lib/pdf-fonts"; // registers Cairo font
import { ReportDocument } from "@/components/pdf/ReportDocument";


interface ReportSection {
  title: string;
  rows: string[][];
  headers: string[];
}

interface ChartImage {
  title: string;
  imageDataUrl: string;
}

/**
 * Generate a professional PDF report and trigger download.
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
  const logoBase64 = await getLogoBase64();

  const doc = React.createElement(ReportDocument, {
    title,
    dateStr,
    generatedAt,
    refNumber,
    logoBase64,
    summaryStats,
    chartImages,
    sections,
  });

  const blob = await pdf(doc).toBlob();

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
 * Uses html-to-image-like canvas capture for chart elements only.
 */
export async function captureChartAsImage(
  container: HTMLElement
): Promise<string> {
  // Use canvas-based capture for charts
  const canvas = document.createElement("canvas");
  const rect = container.getBoundingClientRect();
  const scale = 3;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Try to find SVG elements (recharts renders SVG)
  const svgs = container.querySelectorAll("svg");
  if (svgs.length > 0) {
    // Serialize SVGs and render to canvas
    for (const svg of Array.from(svgs)) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new window.Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const svgRect = svg.getBoundingClientRect();
          const offsetX = svgRect.left - rect.left;
          const offsetY = svgRect.top - rect.top;
          ctx.drawImage(img, offsetX, offsetY, svgRect.width, svgRect.height);
          URL.revokeObjectURL(svgUrl);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          resolve();
        };
        img.src = svgUrl;
      });
    }
    return canvas.toDataURL("image/png", 0.95);
  }

  // Fallback: use html2canvas-like approach
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png", 0.95);
}
