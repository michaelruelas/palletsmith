import { describe, expect, test } from "bun:test";
import { resolvePlugin, listPlugins, runPlugin } from "../../src/plugins/registry.ts";
import { registry as builtinPlugins } from "palletsmith-plugins";
import type { MasterSchema } from "../../src/core/types.ts";
import type { Palette, Base24Slots } from "../../src/core/types.ts";

const mockPalette: Palette = {
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

const mockSchema: MasterSchema = {
  meta: {
    name: "Test Theme",
    author: "Test Author",
    appearance: "dark",
    version: "1.0.0",
    basePalette: mockPalette,
  },
  base24: {
    appearance: "dark",
    scheme: "Test",
    author: "Test",
    base00: "#1e1e2e",
    base01: "#313244",
    base02: "#45475a",
    base03: "#7f849c",
    base04: "#585b70",
    base05: "#cdd6f4",
    base06: "#e0e4f8",
    base07: "#f0f4ff",
    base08: "#f38ba8",
    base09: "#fab387",
    base0A: "#f9e2af",
    base0B: "#a6e3a1",
    base0C: "#94e2d5",
    base0D: "#89b4fa",
    base0E: "#cba6f7",
    base0F: "#a88b6a",
    base10: "#16162a",
    base11: "#0e0e22",
    base12: "#f5a9c4",
    base13: "#fce8c7",
    base14: "#b8edb4",
    base15: "#a8e8d8",
    base16: "#a0c4f8",
    base17: "#d4b8f4",
  },
  tokens: {
    background: "#1e1e2e",
    surface: "#313244",
    elevatedSurface: "#3a3a4e",
    overlay: "#0e0e22cc",
    border: "#45475a",
    borderMuted: "#4f5268",
    borderFocused: "#89b4fa",
    borderSelected: "#45475a",
    textPrimary: "#cdd6f4",
    textMuted: "#7f849c",
    textPlaceholder: "#9298b0",
    textAccent: "#89b4fa",
    textDisabled: "#585b70",
    iconPrimary: "#cdd6f4",
    iconMuted: "#7f849c",
    iconAccent: "#89b4fa",
    selectionBackground: "#89b4fa3d",
    hoverBackground: "#cdd6f414",
    activeBackground: "#cdd6f41f",
    focusRing: "#89b4fa99",
    editorBackground: "#1e1e2e",
    editorForeground: "#cdd6f4",
    editorLineNumber: "#cdd6f44d",
    editorActiveLineNumber: "#cdd6f499",
    editorGutterBackground: "#1e1e2e",
    editorIndentGuide: "#45475a66",
    editorActiveIndentGuide: "#45475ab3",
    tabActiveBackground: "#26263a",
    tabInactiveBackground: "#1e1e2e",
    tabBarBackground: "#1e1e2e",
    titleBarBackground: "#1e1e2e",
    statusBarBackground: "#313244",
    activityBarBackground: "#313244",
    activityBarForeground: "#89b4fa",
    sidebarBackground: "#313244",
    scrollbarThumb: "#7f849c30",
    scrollbarThumbHover: "#7f849c61",
    scrollbarTrack: "#1e1e2e",
    panelBackground: "#1e1e2e",
    panelBorder: "#45475a",
    inputBackground: "#313244",
    inputBorder: "#45475a",
    inputForeground: "#cdd6f4",
    dropdownBackground: "#313244",
    dropdownBorder: "#45475a",
    buttonBackground: "#89b4fa",
    buttonForeground: "#1e1e2e",
    buttonHoverBackground: "#a0c4f8",
    linkForeground: "#89b4fa",
    linkHoverForeground: "#a0c4f8",
    errorForeground: "#f38ba8",
    warningForeground: "#f9e2af",
    infoForeground: "#89b4fa",
    successForeground: "#a6e3a1",
  },
  syntax: {} as MasterSchema["syntax"],
  terminal: {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    cursor: "#89b4fa",
    cursorAccent: "#1e1e2e",
    selectionBackground: "#89b4fa3d",
    selectionForeground: "#cdd6f4",
    black: "#1e1e2e",
    red: "#f38ba8",
    green: "#a6e3a1",
    yellow: "#f9e2af",
    blue: "#89b4fa",
    magenta: "#cba6f7",
    cyan: "#94e2d5",
    white: "#cdd6f4",
    brightBlack: "#7f849c",
    brightRed: "#f5a9c4",
    brightGreen: "#b8edb4",
    brightYellow: "#fce8c7",
    brightBlue: "#a0c4f8",
    brightMagenta: "#d4b8f4",
    brightCyan: "#a8e8d8",
    brightWhite: "#f0f4ff",
  },
  status: {
    info: "#89b4fa",
    infoBackground: "#89b4fa33",
    success: "#a6e3a1",
    successBackground: "#a6e3a133",
    warning: "#f9e2af",
    warningBackground: "#f9e2af33",
    error: "#f38ba8",
    errorBackground: "#f38ba833",
  },
  players: Array.from({ length: 8 }, () => ({
    cursor: "#89b4fa",
    background: "#89b4fa",
    selection: "#89b4fa3d",
  })),
};

describe("builtinPlugins", () => {
  test("has all expected plugins", () => {
    expect(builtinPlugins).toHaveProperty("zed");
    expect(builtinPlugins).toHaveProperty("ghostty");
    expect(builtinPlugins).toHaveProperty("vscode");
    expect(builtinPlugins).toHaveProperty("chrome");
    expect(builtinPlugins).toHaveProperty("openchamber");
  });

  test("each plugin has required fields", () => {
    for (const [id, plugin] of Object.entries(builtinPlugins)) {
      expect(plugin.id).toBe(id);
      expect(plugin.name).toBeTruthy();
      expect(plugin.version).toBeTruthy();
      expect(plugin.description).toBeTruthy();
      expect(Array.isArray(plugin.consumes)).toBe(true);
      expect(typeof plugin.render).toBe("function");
    }
  });
});

describe("resolvePlugin", () => {
  test("resolves known plugin", async () => {
    const plugin = await resolvePlugin("zed");
    expect(plugin).toBeDefined();
    expect(plugin.id).toBe("zed");
  });

  test("throws on unknown plugin", async () => {
    await expect(resolvePlugin("nonexistent")).rejects.toThrow();
  });
});

describe("listPlugins", () => {
  test("returns array of plugin summaries", async () => {
    const list = await listPlugins();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (const entry of list) {
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("version");
      expect(entry).toHaveProperty("description");
      expect(entry).toHaveProperty("consumes");
    }
  });
});

describe("runPlugin", () => {
  test("each builtin plugin renders output", async () => {
    const list = await listPlugins();
    for (const entry of list) {
      const plugin = await resolvePlugin(entry.id);
      const outputs = await runPlugin(plugin, mockSchema, {});
      expect(Array.isArray(outputs)).toBe(true);
      expect(outputs.length).toBeGreaterThan(0);
      for (const output of outputs) {
        expect(output).toHaveProperty("filename");
        expect(output).toHaveProperty("content");
        expect(typeof output.content).toBe("string");
        expect(output.content.length).toBeGreaterThan(0);
      }
    }
  }, 30000);
});
