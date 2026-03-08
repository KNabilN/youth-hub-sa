import logoImg from "@/assets/logo.png";

/* ── Brand palette (shared across all PDF exports) ── */
export const BRAND = {
  primary: "#0f766e",        // teal-700
  primaryLight: "#ccfbf1",   // teal-50
  primaryMid: "#99f6e4",     // teal-200
  primaryDark: "#0d5c56",    // darker teal
  accent: "#b59535",         // royal gold
  accentLight: "#f5e6b8",    // light gold
  text: "#1e293b",           // slate-800
  textMuted: "#64748b",      // slate-500
  border: "#e2e8f0",         // slate-200
  headerBg: "#f0fdfa",       // teal-50
  rowAlt: "#f8fafc",         // slate-50
  white: "#ffffff",
  confidential: "#991b1b",   // red-800
};

/* ── Logo to Base64 data URL ── */
let cachedLogoBase64: string | null = null;

export async function getLogoBase64(customUrl?: string): Promise<string> {
  const url = customUrl || logoImg;
  if (!customUrl && cachedLogoBase64) return cachedLogoBase64;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      if (!customUrl) cachedLogoBase64 = dataUrl;
      resolve(dataUrl);
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

/** Generate a unique reference number for official documents */
export function generateRefNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `REF-${y}${m}${d}-${seq}`;
}
