import { format } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { getLogoBase64, generateRefNumber } from "./pdf-utils";
import "@/lib/pdf-fonts";
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
  }) as any;

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

export async function captureChartAsImage(
  container: HTMLElement
): Promise<string> {
  const canvas = document.createElement("canvas");
  const rect = container.getBoundingClientRect();
  const scale = 3;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const svgs = container.querySelectorAll("svg");
  if (svgs.length > 0) {
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

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png", 0.95);
}
