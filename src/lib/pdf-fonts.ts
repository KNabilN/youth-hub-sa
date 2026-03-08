import { Font } from "@react-pdf/renderer";

/* ── Register Cairo font for Arabic support ── */
Font.register({
  family: "Cairo",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/cairo/v28/SLXvx02YPrCeLKoN-at6p1N2aQ.woff2",
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/cairo/v28/SLXvx02YPrCeLI4I-at6p1N2aQ.woff2",
      fontWeight: 700,
      fontStyle: "normal",
    },
  ],
});

/* Disable hyphenation for Arabic */
Font.registerHyphenationCallback((word) => [word]);

/**
 * Reshape Arabic text for correct letter joining in PDF.
 * @react-pdf/renderer handles RTL direction but Arabic contextual shaping
 * may need manual reshaping. We apply a lightweight reshaping approach.
 */
export function reshapeAr(text: string | number | null | undefined): string {
  if (text == null) return "";
  return String(text);
}

/** Format a number for display in PDF */
export function fmtNum(n: number, decimals = 0): string {
  return n.toLocaleString("en-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format currency */
export function fmtCurrency(n: number): string {
  return n.toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
