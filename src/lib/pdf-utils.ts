import logoImg from "@/assets/logo.png";

/* ── Brand palette (shared across all PDF exports) ── */
export const BRAND = {
  primary: "#0f766e",        // teal-700
  primaryLight: "#ccfbf1",   // teal-50
  primaryMid: "#99f6e4",     // teal-200
  accent: "#b59535",         // royal gold
  text: "#1e293b",           // slate-800
  textMuted: "#64748b",      // slate-500
  border: "#e2e8f0",         // slate-200
  headerBg: "#f0fdfa",       // teal-50
  rowAlt: "#f8fafc",         // slate-50
  white: "#ffffff",
};

export const BASE_FONT = `'Cairo', 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif`;

/* ── Arabic font loader (singleton) ── */
let fontLoaded = false;
export async function loadArabicFont(): Promise<void> {
  if (fontLoaded) return;
  try {
    const font = new FontFace(
      "Cairo",
      "url(https://fonts.gstatic.com/s/cairo/v28/SLXvx02YPrCeLKoN-at6p1N2aQ.woff2)",
      { weight: "400 900", style: "normal" }
    );
    const loaded = await font.load();
    document.fonts.add(loaded);
    await document.fonts.ready;
    fontLoaded = true;
  } catch {
    console.warn("Failed to load Cairo font, falling back to system fonts");
  }
}

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
