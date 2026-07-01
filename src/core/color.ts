import type { ColorHex, RGB, RGBA, HSL } from "./types.js";

// ─── Parsers ──────────────────────────────────────────────────

/**
 * Parse a hex string to RGB. Handles #RRGGBB, #RRGGBBAA, #RGB, #RGBA, and bare hex.
 */
export function hexToRgb(hex: ColorHex): RGB {
  const cleaned = hex.replace("#", "").trim();

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0]! + cleaned[0], 16);
    g = parseInt(cleaned[1]! + cleaned[1], 16);
    b = parseInt(cleaned[2]! + cleaned[2], 16);
  } else if (cleaned.length === 4) {
    r = parseInt(cleaned[0]! + cleaned[0], 16);
    g = parseInt(cleaned[1]! + cleaned[1], 16);
    b = parseInt(cleaned[2]! + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return { r, g, b };
}

/**
 * Parse a hex string that may include alpha channel to RGBA.
 */
export function hexToRgba(hex: ColorHex): RGBA {
  const cleaned = hex.replace("#", "").trim();
  const rgb = hexToRgb(hex);

  let a = 1;
  if (cleaned.length === 4) {
    a = parseInt(cleaned[3]! + cleaned[3], 16) / 255;
  } else if (cleaned.length === 8) {
    a = parseInt(cleaned.slice(6, 8), 16) / 255;
  }

  return { ...rgb, a };
}

// ─── Serializers ──────────────────────────────────────────────

export function rgbToHex(rgb: RGB): ColorHex {
  const r = Math.round(rgb.r).toString(16).padStart(2, "0");
  const g = Math.round(rgb.g).toString(16).padStart(2, "0");
  const b = Math.round(rgb.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function rgbaToHex(rgba: RGBA): ColorHex {
  const r = Math.round(rgba.r).toString(16).padStart(2, "0");
  const g = Math.round(rgba.g).toString(16).padStart(2, "0");
  const b = Math.round(rgba.b).toString(16).padStart(2, "0");
  const a = Math.round(rgba.a * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}${a}`;
}

// ─── RGB ↔ HSL Conversion ─────────────────────────────────────

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ─── Luminance & Contrast ─────────────────────────────────────

/**
 * Relative luminance per WCAG 2.1 definition.
 * Used for contrast ratio calculations.
 */
export function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * WCAG 2.1 contrast ratio between two colors.
 * Ratio of 4.5:1 is AA normal text, 3:1 is AA large text.
 */
export function contrastRatio(a: ColorHex, b: ColorHex): number {
  const l1 = relativeLuminance(hexToRgb(a));
  const l2 = relativeLuminance(hexToRgb(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a contrast ratio meets WCAG AA for normal text (4.5:1).
 */
export function meetsWcagAA(a: ColorHex, b: ColorHex): boolean {
  return contrastRatio(a, b) >= 4.5;
}

/**
 * Check if a contrast ratio meets WCAG AA for large text (3:1).
 */
export function meetsWcagAALarge(a: ColorHex, b: ColorHex): boolean {
  return contrastRatio(a, b) >= 3.0;
}

// ─── Color Transformations ────────────────────────────────────

/**
 * Lighten a color by a percentage (in HSL lightness space).
 * @param amount - Percentage to lighten (0-100). 10 = 10% lighter.
 */
export function lighten(hex: ColorHex, amount: number): ColorHex {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.min(100, Math.max(0, hsl.l + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Darken a color by a percentage (in HSL lightness space).
 * @param amount - Percentage to darken (0-100). 10 = 10% darker.
 */
export function darken(hex: ColorHex, amount: number): ColorHex {
  return lighten(hex, -amount);
}

/**
 * Change saturation by a percentage.
 * @param amount - Percentage to change (-100 to 100). Negative = desaturate.
 */
export function saturate(hex: ColorHex, amount: number): ColorHex {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.s = Math.min(100, Math.max(0, hsl.s + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Desaturate a color.
 */
export function desaturate(hex: ColorHex, amount: number): ColorHex {
  return saturate(hex, -amount);
}

/**
 * Blend two colors with alpha compositing.
 * @param fg - Foreground color (may include alpha)
 * @param bg - Background color (solid)
 * @param alpha - Override alpha for fg (0-1). If not provided, uses fg's own alpha.
 */
export function blend(fg: ColorHex, bg: ColorHex, alpha?: number): ColorHex {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  const fgRgba = hexToRgba(fg);
  const a = alpha ?? fgRgba.a;

  const r = Math.round(fgRgb.r * a + bgRgb.r * (1 - a));
  const g = Math.round(fgRgb.g * a + bgRgb.g * (1 - a));
  const b = Math.round(fgRgb.b * a + bgRgb.b * (1 - a));

  return rgbToHex({ r, g, b });
}

/**
 * Create a color with an alpha channel appended.
 * If the input already has alpha, it's replaced.
 */
export function withAlpha(hex: ColorHex, alpha: number): ColorHex {
  const rgb = hexToRgb(hex);
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return rgbToHex(rgb) + a;
}

/**
 * Auto-detect appearance from a palette's background luminance.
 * Returns "dark" if bg luminance < 0.5, "light" otherwise.
 */
export function detectAppearance(bg: ColorHex): "dark" | "light" {
  const luminance = relativeLuminance(hexToRgb(bg));
  return luminance < 0.5 ? "dark" : "light";
}

/**
 * Normalize a hex color: ensure it starts with # and has proper casing.
 */
export function normalizeHex(hex: string): ColorHex {
  const cleaned = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3,8}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return `#${cleaned.toLowerCase()}`;
}

/**
 * Check if a hex string includes an alpha channel.
 */
export function hasAlpha(hex: ColorHex): boolean {
  const cleaned = hex.replace("#", "");
  return cleaned.length === 4 || cleaned.length === 8;
}
