import type { Palette } from "./types.js";
import { contrastRatio, detectAppearance, hexToRgb, normalizeHex } from "./color.js";

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning" | "error";
  contrastRatio?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a palette for correctness and accessibility.
 */
export function validatePalette(palette: Partial<Palette>): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  const required: (keyof Palette)[] = [
    "bg", "surface", "selection", "border", "muted", "text",
    "accent", "red", "orange", "yellow", "green", "cyan", "blue", "magenta",
  ];

  for (const key of required) {
    if (!palette[key]) {
      errors.push({ field: key, message: `Missing required palette color: ${key}` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, warnings, errors };
  }

  const p = palette as Palette;

  for (const [key, value] of Object.entries(p)) {
    if (typeof value !== "string") {
      errors.push({ field: key, message: `${key} must be a string, got ${typeof value}` });
      continue;
    }
    try {
      normalizeHex(value);
    } catch {
      errors.push({ field: key, message: `Invalid hex color for ${key}: "${value}"` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, warnings, errors };
  }

  // WCAG contrast checks
  const textBgRatio = contrastRatio(p.text, p.bg);
  if (textBgRatio < 4.5) {
    warnings.push({ field: "text / bg", message: `Text-to-background contrast is ${textBgRatio.toFixed(2)}:1 (WCAG AA requires 4.5:1)`, severity: "error", contrastRatio: textBgRatio });
  } else if (textBgRatio < 7) {
    warnings.push({ field: "text / bg", message: `Text contrast ${textBgRatio.toFixed(2)}:1 is good, ≥7:1 is preferred`, severity: "warning", contrastRatio: textBgRatio });
  }

  const accentBgRatio = contrastRatio(p.accent, p.bg);
  if (accentBgRatio < 3) {
    warnings.push({ field: "accent / bg", message: `Accent-to-background contrast ${accentBgRatio.toFixed(2)}:1 is too low`, severity: "warning", contrastRatio: accentBgRatio });
  }

  const bgSurfaceRatio = contrastRatio(p.bg, p.surface);
  if (bgSurfaceRatio < 1.05) {
    warnings.push({ field: "bg / surface", message: `Background and surface too similar (${bgSurfaceRatio.toFixed(3)}:1)`, severity: "warning", contrastRatio: bgSurfaceRatio });
  }

  const mutedBgRatio = contrastRatio(p.muted, p.bg);
  if (mutedBgRatio < 3) {
    warnings.push({ field: "muted / bg", message: `Muted text contrast ${mutedBgRatio.toFixed(2)}:1 is low`, severity: "warning", contrastRatio: mutedBgRatio });
  }

  const hasErrors = warnings.some((w) => w.severity === "error");
  return { valid: !hasErrors && errors.length === 0, warnings, errors };
}
