import type { Palette, Base24Slots, Appearance, ColorHex } from "./types.js";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  relativeLuminance,
  lighten,
  darken,
  desaturate,
  saturate,
  detectAppearance,
  normalizeHex,
} from "./color.js";

/**
 * Derives 24 Base24 color slots from a 13-color user palette.
 * This is the core transformation: user intent → framework-neutral color spec.
 */
export function deriveBase24(
  palette: Palette,
  appearance?: Appearance
): Base24Slots {
  const p = normalizePalette(palette);
  const mode = appearance ?? detectAppearance(p.bg);
  const isDark = mode === "dark";

  return {
    appearance: mode,
    scheme: "Custom Theme",
    author: "PalletSmith",

    // ── Neutral ramp (base00 → base07) ───────────────────
    //
    // Dark themes:   base00 is darkest, base07 is lightest
    // Light themes:  base00 is lightest, base07 is darkest
    base00: p.bg,                                           // Default Background
    base01: p.surface,                                      // Lighter Background (panels)
    base02: p.selection,                                    // Selection Background
    base03: p.muted,                                        // Comments / Invisibles
    base04: isDark ? lighten(p.bg, 40) : darken(p.bg, 20), // Dark Foreground
    base05: p.text,                                         // Default Foreground
    base06: isDark ? lighten(p.text, 15) : darken(p.text, 15), // Light Foreground
    base07: isDark ? lighten(p.text, 40) : darken(p.text, 40), // Lightest Foreground

    // ── Accent colors (base08 → base0F) ─────────────────
    // Direct mapping from palette semantics to Base24 convention
    base08: p.red,        // Red (variables, errors, tags)
    base09: p.orange,     // Orange (numbers, constants, decorators)
    base0A: p.yellow,     // Yellow (classes, warnings, markdown headings)
    base0B: p.green,      // Green (strings, success, additions)
    base0C: p.cyan,       // Cyan (support, regex, escapes)
    base0D: p.blue,       // Blue (functions, info, links)
    base0E: p.magenta,    // Magenta/Purple (keywords, storage, constants)
    base0F: deriveBase0F(p.orange, isDark), // Deprecated/Brown

    // ── Extra background depths ─────────────────────────
    // Used for 3D layering (dropdowns over modals over editors)
    base10: isDark ? darken(p.bg, 5) : lighten(p.bg, 5),   // Darker Background
    base11: isDark ? darken(p.bg, 10) : lighten(p.bg, 10),  // Darkest Background

    // ── Bright accent variants (base12 → base17) ────────
    // For terminal ANSI bold/bright colors (8-15)
    base12: lightenBright(p.red, isDark),     // Bright Red
    base13: lightenBright(p.yellow, isDark),  // Bright Yellow
    base14: lightenBright(p.green, isDark),   // Bright Green
    base15: lightenBright(p.cyan, isDark),    // Bright Cyan
    base16: lightenBright(p.blue, isDark),    // Bright Blue
    base17: lightenBright(p.magenta, isDark), // Bright Magenta
  };
}

// ─── Internal Helpers ─────────────────────────────────────────

function normalizePalette(p: Palette): Palette {
  return {
    bg: normalizeHex(p.bg),
    surface: normalizeHex(p.surface),
    selection: normalizeHex(p.selection),
    border: normalizeHex(p.border),
    muted: normalizeHex(p.muted),
    text: normalizeHex(p.text),
    accent: normalizeHex(p.accent),
    red: normalizeHex(p.red),
    orange: normalizeHex(p.orange),
    yellow: normalizeHex(p.yellow),
    green: normalizeHex(p.green),
    cyan: normalizeHex(p.cyan),
    blue: normalizeHex(p.blue),
    magenta: normalizeHex(p.magenta),
  };
}

/**
 * Derive the base0F (deprecated/brown) slot.
 * Desaturate orange by ~40% and adjust lightness for a dusty brown tone.
 */
function deriveBase0F(orange: ColorHex, isDark: boolean): ColorHex {
  const hsl = rgbToHsl(hexToRgb(orange));
  hsl.s = Math.max(0, hsl.s - 40);
  hsl.l = isDark ? Math.max(0, hsl.l - 15) : Math.min(100, hsl.l + 15);
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Derive a bright variant of an accent color.
 * For dark themes: keep lightness similar, boost saturation to make colors vivid.
 * For light themes: increase lightness slightly, maintain saturation.
 * Bright variants should be the same hue - just more intense/vivid.
 */
function lightenBright(hex: ColorHex, isDark: boolean): ColorHex {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.s = isDark
    ? Math.min(100, hsl.s + 15)
    : Math.min(100, hsl.s + 5);
  hsl.l = isDark
    ? Math.min(100, hsl.l + 8)
    : Math.min(100, hsl.l + 12);
  return rgbToHex(hslToRgb(hsl));
}
