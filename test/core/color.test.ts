import { describe, expect, test } from "bun:test";
import {
  hexToRgb,
  hexToRgba,
  rgbToHex,
  rgbaToHex,
  rgbToHsl,
  hslToRgb,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAALarge,
  lighten,
  darken,
  saturate,
  desaturate,
  blend,
  withAlpha,
  detectAppearance,
  normalizeHex,
  hasAlpha,
} from "../../src/core/color.ts";

describe("hexToRgb", () => {
  test("parses 6-digit hex", () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("00FF00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
  });

  test("parses 3-digit hex", () => {
    expect(hexToRgb("#F00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("0F0")).toEqual({ r: 0, g: 255, b: 0 });
  });

  test("parses 4-digit hex (RGBA without alpha)", () => {
    const result = hexToRgb("#F00F");
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  test("parses 8-digit hex without extracting alpha", () => {
    const result = hexToRgb("#FF000080");
    expect(result).toEqual({ r: 255, g: 0, b: 0 });
  });

  test("throws on invalid hex", () => {
    expect(() => hexToRgb("not-a-color")).toThrow();
  });

  test("returns NaN values for non-hex input without throwing", () => {
    const result = hexToRgb("#GGG");
    expect(result.r).toBeNaN();
  });
});

describe("hexToRgba", () => {
  test("returns alpha=1 for 6-digit hex", () => {
    expect(hexToRgba("#FF0000").a).toBe(1);
  });

  test("parses alpha from 8-digit hex", () => {
    const result = hexToRgba("#FF000080");
    expect(result.a).toBeCloseTo(0.502, 2);
  });

  test("parses alpha from 4-digit hex", () => {
    const result = hexToRgba("#F00F");
    expect(result.a).toBeCloseTo(1, 1);
  });
});

describe("rgbToHex", () => {
  test("converts RGB to hex string", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe("#00ff00");
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe("#0000ff");
  });
});

describe("rgbaToHex", () => {
  test("includes alpha channel", () => {
    expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe("#ff000080");
  });
});

describe("rgbToHsl", () => {
  test("converts red to HSL", () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test("converts green to HSL", () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test("converts blue to HSL", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
    expect(hsl.h).toBe(240);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test("converts gray to HSL (saturation 0)", () => {
    const hsl = rgbToHsl({ r: 128, g: 128, b: 128 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(50);
  });
});

describe("hslToRgb", () => {
  test("converts red back", () => {
    const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  test("roundtrip: hsl -> rgb -> hsl", () => {
    const original = { h: 200, s: 60, l: 40 };
    const rgb = hslToRgb(original);
    const hsl = rgbToHsl(rgb);
    expect(hsl.h).toBe(original.h);
    expect(hsl.s).toBe(original.s);
    expect(hsl.l).toBe(original.l);
  });
});

describe("relativeLuminance", () => {
  test("black is 0", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  test("white is 1", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });
});

describe("contrastRatio", () => {
  test("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  test("same color is 1:1", () => {
    expect(contrastRatio("#FF0000", "#FF0000")).toBeCloseTo(1, 0);
  });

  test("dark gray on dark bg fails AA", () => {
    const ratio = contrastRatio("#666666", "#1E1E2E");
    expect(ratio).toBeLessThan(4.5);
  });
});

describe("meetsWcagAA / meetsWcagAALarge", () => {
  test("black on white passes AA", () => {
    expect(meetsWcagAA("#000000", "#FFFFFF")).toBe(true);
  });

  test("gray on dark fails AA", () => {
    expect(meetsWcagAA("#666666", "#1E1E2E")).toBe(false);
  });

  test("gray on dark may pass AA large", () => {
    expect(meetsWcagAALarge("#949494", "#1E1E2E")).toBe(true);
  });
});

describe("lighten / darken", () => {
  test("lighten increases lightness", () => {
    const result = lighten("#1E1E2E", 10);
    const hsl = rgbToHsl(hexToRgb(result));
    const original = rgbToHsl(hexToRgb("#1E1E2E"));
    expect(hsl.l).toBeGreaterThan(original.l);
  });

  test("darken decreases lightness", () => {
    const result = darken("#CDD6F4", 10);
    const hsl = rgbToHsl(hexToRgb(result));
    const original = rgbToHsl(hexToRgb("#CDD6F4"));
    expect(hsl.l).toBeLessThan(original.l);
  });

  test("darken and lighten are approximate inverses (rounding)", () => {
    const original = "#62D491";
    const lighter = lighten(original, 20);
    const back = darken(lighter, 20);
    const orig = rgbToHsl(hexToRgb(original));
    const result = rgbToHsl(hexToRgb(back));
    expect(Math.abs(result.l - orig.l)).toBeLessThanOrEqual(2);
  });
});

describe("saturate / desaturate", () => {
  test("saturate increases saturation", () => {
    const result = saturate("#62D491", 20);
    const hsl = rgbToHsl(hexToRgb(result));
    expect(hsl.s).toBeGreaterThan(50);
  });

  test("desaturate decreases saturation", () => {
    const result = desaturate("#62D491", 50);
    const hsl = rgbToHsl(hexToRgb(result));
    expect(hsl.s).toBeLessThan(50);
  });
});

describe("blend", () => {
  test("fully opaque fg returns fg", () => {
    expect(blend("#FF0000", "#00FF00", 1)).toBe("#ff0000");
  });

  test("fully transparent fg returns bg", () => {
    expect(blend("#FF0000", "#00FF00", 0)).toBe("#00ff00");
  });

  test("50% blend merges colors", () => {
    expect(blend("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe("withAlpha", () => {
  test("appends alpha channel", () => {
    expect(withAlpha("#FF0000", 0.5)).toBe("#ff000080");
  });

  test("clamps alpha to 0-1", () => {
    expect(withAlpha("#FF0000", 1.5)).toBe("#ff0000ff");
    expect(withAlpha("#FF0000", -0.5)).toBe("#ff000000");
  });
});

describe("detectAppearance", () => {
  test("dark bg returns dark", () => {
    expect(detectAppearance("#1E1E2E")).toBe("dark");
  });

  test("light bg returns light", () => {
    expect(detectAppearance("#F5F5F5")).toBe("light");
  });
});

describe("normalizeHex", () => {
  test("adds # prefix and lowercases", () => {
    expect(normalizeHex("FF0000")).toBe("#ff0000");
    expect(normalizeHex("#FF0000")).toBe("#ff0000");
  });

  test("throws on invalid hex", () => {
    expect(() => normalizeHex("xyz")).toThrow();
  });
});

describe("hasAlpha", () => {
  test("detects alpha in hex strings", () => {
    expect(hasAlpha("#FF0000")).toBe(false);
    expect(hasAlpha("#FF000080")).toBe(true);
    expect(hasAlpha("#F00F")).toBe(true);
    expect(hasAlpha("#F00")).toBe(false);
  });
});
