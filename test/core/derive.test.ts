import { describe, expect, test } from "bun:test";
import { deriveBase24 } from "../../src/core/derive.ts";
import { hexToRgb, rgbToHsl } from "../../src/core/color.ts";
import type { Palette } from "../../src/core/types.ts";

const darkPalette: Palette = {
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

const lightPalette: Palette = {
  bg: "#F5F5F5",
  surface: "#FFFFFF",
  selection: "#E8E8E8",
  border: "#E8E8E8",
  muted: "#616161",
  text: "#222222",
  accent: "#4DD689",
  red: "#C74E39",
  orange: "#8B7355",
  yellow: "#8B7355",
  green: "#2E8B57",
  cyan: "#0891B2",
  blue: "#2563EB",
  magenta: "#8B5CF6",
};

describe("deriveBase24", () => {
  test("returns all required fields", () => {
    const result = deriveBase24(darkPalette);
    expect(result.appearance).toBe("dark");
    expect(result.scheme).toBeTruthy();
    expect(result.author).toBe("PalletSmith");
  });

  test("maps base00 to bg", () => {
    const result = deriveBase24(darkPalette);
    expect(result.base00).toBe("#1e1e2e");
  });

  test("maps base05 to text", () => {
    const result = deriveBase24(darkPalette);
    expect(result.base05).toBe("#cdd6f4");
  });

  test("neutral ramp is monotonic for dark theme", () => {
    const result = deriveBase24(darkPalette);
    const b00 = rgbToHsl(hexToRgb(result.base00));
    const b05 = rgbToHsl(hexToRgb(result.base05));
    expect(b05.l).toBeGreaterThan(b00.l);
  });

  test("neutral ramp is reversed for light theme", () => {
    const result = deriveBase24(lightPalette);
    const b00 = rgbToHsl(hexToRgb(result.base00));
    const b05 = rgbToHsl(hexToRgb(result.base05));
    expect(b00.l).toBeGreaterThan(b05.l);
  });

  test("accent slots match source colors", () => {
    const result = deriveBase24(darkPalette);
    expect(normalize(result.base08)).toBe(normalize(darkPalette.red));
    expect(normalize(result.base09)).toBe(normalize(darkPalette.orange));
    expect(normalize(result.base0A)).toBe(normalize(darkPalette.yellow));
    expect(normalize(result.base0B)).toBe(normalize(darkPalette.green));
    expect(normalize(result.base0C)).toBe(normalize(darkPalette.cyan));
    expect(normalize(result.base0D)).toBe(normalize(darkPalette.blue));
    expect(normalize(result.base0E)).toBe(normalize(darkPalette.magenta));
  });

  test("detects appearance when not provided", () => {
    expect(deriveBase24(darkPalette).appearance).toBe("dark");
    expect(deriveBase24(lightPalette).appearance).toBe("light");
  });

  test("respects explicit appearance override for derived values", () => {
    const result = deriveBase24(darkPalette, "light");
    expect(result.appearance).toBe("light");
    const b04 = rgbToHsl(hexToRgb(result.base04));
    const b00 = rgbToHsl(hexToRgb(result.base00));
    expect(b04.l).toBeLessThan(b00.l);
  });

  test("bright variants are derived", () => {
    const result = deriveBase24(darkPalette);
    expect(result.base12).toBeTruthy();
    expect(result.base13).toBeTruthy();
    expect(result.base14).toBeTruthy();
    expect(result.base15).toBeTruthy();
    expect(result.base16).toBeTruthy();
    expect(result.base17).toBeTruthy();
  });

  test("extra background depths are present", () => {
    const result = deriveBase24(darkPalette);
    expect(result.base10).toBeTruthy();
    expect(result.base11).toBeTruthy();
  });

  test("normalizes malformed hex input", () => {
    const messyPalette: Palette = {
      ...darkPalette,
      bg: "1e1e2e",
    };
    const result = deriveBase24(messyPalette);
    expect(result.base00).toBe("#1e1e2e");
  });
});

function normalize(hex: string): string {
  return hex.toLowerCase();
}
