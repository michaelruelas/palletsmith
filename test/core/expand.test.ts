import { describe, expect, test } from "bun:test";
import { expandMasterSchema } from "../../src/core/expand.ts";
import { deriveBase24 } from "../../src/core/derive.ts";
import type { Palette, Base24Slots } from "../../src/core/types.ts";

const palette: Palette = {
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

function deriveFixtures(): { base24: Base24Slots; accent: string } {
  const base24 = deriveBase24(palette);
  return { base24, accent: palette.accent };
}

describe("expandMasterSchema", () => {
  test("returns all required sections", () => {
    const { base24 } = deriveFixtures();
    const result = expandMasterSchema(base24, palette.accent, palette);
    expect(result).toHaveProperty("tokens");
    expect(result).toHaveProperty("syntax");
    expect(result).toHaveProperty("terminal");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("players");
  });

  test("semantic tokens have all required fields", () => {
    const { base24 } = deriveFixtures();
    const { tokens } = expandMasterSchema(base24, palette.accent, palette);
    expect(tokens.background).toBeTruthy();
    expect(tokens.textPrimary).toBeTruthy();
    expect(tokens.border).toBeTruthy();
    expect(tokens.selectionBackground).toBeTruthy();
    expect(tokens.editorBackground).toBeTruthy();
    expect(tokens.buttonBackground).toBe(palette.accent);
    expect(tokens.errorForeground).toBe(palette.red.toLowerCase());
  });

  test("syntax tokens have all fields with color", () => {
    const { base24 } = deriveFixtures();
    const { syntax } = expandMasterSchema(base24, palette.accent, palette);
    const keys = Object.keys(syntax);
    expect(keys.length).toBe(79);
    for (const key of keys) {
      expect(syntax[key as keyof typeof syntax]).toHaveProperty("color");
    }
  });

  test("terminal palette has all 16 ANSI colors", () => {
    const { base24 } = deriveFixtures();
    const { terminal } = expandMasterSchema(base24, palette.accent, palette);
    expect(terminal.background).toBeTruthy();
    expect(terminal.foreground).toBeTruthy();
    expect(terminal.black).toBeTruthy();
    expect(terminal.red).toBeTruthy();
    expect(terminal.green).toBeTruthy();
    expect(terminal.yellow).toBeTruthy();
    expect(terminal.blue).toBeTruthy();
    expect(terminal.magenta).toBeTruthy();
    expect(terminal.cyan).toBeTruthy();
    expect(terminal.white).toBeTruthy();
    expect(terminal.brightBlack).toBeTruthy();
    expect(terminal.brightRed).toBeTruthy();
    expect(terminal.brightGreen).toBeTruthy();
    expect(terminal.brightYellow).toBeTruthy();
    expect(terminal.brightBlue).toBeTruthy();
    expect(terminal.brightMagenta).toBeTruthy();
    expect(terminal.brightCyan).toBeTruthy();
    expect(terminal.brightWhite).toBeTruthy();
  });

  test("status colors are present", () => {
    const { base24 } = deriveFixtures();
    const { status } = expandMasterSchema(base24, palette.accent, palette);
    expect(status.info).toBeTruthy();
    expect(status.success).toBeTruthy();
    expect(status.warning).toBeTruthy();
    expect(status.error).toBeTruthy();
  });

  test("player colors return exactly 8 entries", () => {
    const { base24 } = deriveFixtures();
    const { players } = expandMasterSchema(base24, palette.accent, palette);
    expect(players).toHaveLength(8);
    for (const player of players) {
      expect(player).toHaveProperty("cursor");
      expect(player).toHaveProperty("background");
      expect(player).toHaveProperty("selection");
    }
  });

  test("light theme results are different from dark", () => {
    const lightPalette: Palette = {
      ...palette,
      bg: "#FFFFFF",
      text: "#000000",
    };
    const lightBase24 = deriveBase24(lightPalette);
    const light = expandMasterSchema(lightBase24, lightPalette.accent, lightPalette);

    const darkBase24 = deriveBase24(palette);
    const dark = expandMasterSchema(darkBase24, palette.accent, palette);

    expect(light.tokens.background).not.toBe(dark.tokens.background);
  });
});
