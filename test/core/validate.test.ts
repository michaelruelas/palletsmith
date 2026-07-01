import { describe, expect, test } from "bun:test";
import { validatePalette } from "../../src/core/validate.ts";
import type { Palette } from "../../src/core/types.ts";

const validPalette: Palette = {
  bg: "#1E1E2E",
  surface: "#313244",
  selection: "#45475A",
  border: "#585B70",
  muted: "#7F849C",
  text: "#CDD6F4",
  accent: "#89B4FA",
  red: "#F38BA8",
  orange: "#FAB387",
  yellow: "#F9E2AF",
  green: "#A6E3A1",
  cyan: "#94E2D5",
  blue: "#89B4FA",
  magenta: "#CBA6F7",
};

describe("validatePalette", () => {
  test("accepts a valid palette", () => {
    const result = validatePalette(validPalette);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects missing required fields", () => {
    const result = validatePalette({ bg: "#000" } as Partial<Palette>);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("rejects invalid hex values", () => {
    const result = validatePalette({ ...validPalette, bg: "not-a-color" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "bg")).toBe(true);
  });

  test("warns on low text contrast", () => {
    const lowContrast: Palette = {
      ...validPalette,
      text: "#7F849C",
    };
    const result = validatePalette(lowContrast);
    expect(result.warnings.some((w) => w.field.includes("text / bg"))).toBe(true);
  });

  test("warns on low accent contrast", () => {
    const lowAccent: Palette = {
      ...validPalette,
      accent: "#313244",
    };
    const result = validatePalette(lowAccent);
    expect(result.warnings.some((w) => w.field.includes("accent / bg"))).toBe(true);
  });

  test("warns when bg and surface are too similar", () => {
    const sameSurface: Palette = {
      ...validPalette,
      surface: "#1E1E2E",
    };
    const result = validatePalette(sameSurface);
    expect(result.warnings.some((w) => w.field.includes("bg / surface"))).toBe(true);
  });

  test("warns on low muted contrast", () => {
    const lowMuted: Palette = {
      ...validPalette,
      muted: "#1E1E2E",
    };
    const result = validatePalette(lowMuted);
    expect(result.warnings.some((w) => w.field.includes("muted / bg"))).toBe(true);
  });

  test("returns invalid when text contrast fails WCAG (severity=error)", () => {
    const lowContrast: Palette = {
      ...validPalette,
      text: "#7F849C",
    };
    const result = validatePalette(lowContrast);
    expect(result.valid).toBe(false);
    expect(result.warnings.some((w) => w.severity === "error")).toBe(true);
  });

  test("includes contrast ratio in warnings", () => {
    const lowContrast: Palette = {
      ...validPalette,
      text: "#7F849C",
    };
    const result = validatePalette(lowContrast);
    const textWarning = result.warnings.find((w) => w.field.includes("text / bg"));
    expect(textWarning?.contrastRatio).toBeDefined();
    expect(textWarning?.contrastRatio).toBeLessThan(4.5);
  });
});
