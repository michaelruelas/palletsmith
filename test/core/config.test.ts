import { describe, expect, test } from "bun:test";
import { paletteFromRecord } from "../../src/core/config.ts";

const fullRecord: Record<string, string> = {
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

describe("paletteFromRecord", () => {
  test("reads from top-level keys", () => {
    const result = paletteFromRecord({ ...fullRecord });
    expect(result.bg).toBe("#1e1e2e");
    expect(result.surface).toBe("#313244");
  });

  test("reads from nested palette key", () => {
    const result = paletteFromRecord({
      palette: { ...fullRecord },
    });
    expect(result.bg).toBe("#1e1e2e");
  });

  test("falls back background to bg", () => {
    const record = { ...fullRecord, background: "#000000", bg: undefined as any };
    const { bg, ...rest } = fullRecord;
    const result = paletteFromRecord({
      ...rest,
      background: "#000000",
    });
    expect(result.bg).toBe("#000000");
  });

  test("throws on invalid hex values", () => {
    expect(() =>
      paletteFromRecord({
        ...fullRecord,
        bg: "not-hex",
      })
    ).toThrow();
  });

  test("normalizes hex values", () => {
    const result = paletteFromRecord({
      ...fullRecord,
      bg: "FF0000",
      surface: "#00FF00",
    });
    expect(result.bg).toBe("#ff0000");
    expect(result.surface).toBe("#00ff00");
  });
});
