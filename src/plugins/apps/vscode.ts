import { definePlugin } from "../types.js";
import type { PluginOutput, PluginInput, MasterSchema } from "../types.js";

export const vscodePlugin = definePlugin({
  id: "vscode",
  name: "Visual Studio Code",
  version: "1.0.0",
  description: "Generates a VS Code theme JSON file from the master schema.",
  consumes: ["tokens", "syntax", "terminal", "status"],

  render(input: PluginInput): PluginOutput[] {
    const { master } = input;
    const t = master.tokens;
    const s = master.syntax;
    const term = master.terminal;
    const appearance = master.meta.appearance;

    const withAlpha = (hex: string, a: number) => {
      const alpha = Math.round(Math.min(1, Math.max(0, a)) * 255).toString(16).padStart(2, "0");
      return hex.length === 7 ? `${hex}${alpha}` : hex.slice(0, 7) + alpha;
    };

    const isDark = appearance === "dark";

    const theme = {
      name: `${master.meta.name} ${isDark ? "Dark" : "Light"}`,
      type: appearance,
      colors: buildColors(t, term, master.status, withAlpha, isDark),
      tokenColors: buildTokenColors(s),
    };

    return [
      {
        filename: `theme-${appearance}.json`,
        content: JSON.stringify(theme, null, 2),
        format: "json",
      },
    ];
  },
});

const hexToRgb = (h: string): [number, number, number] => {
  const hex = h.replace("#", "");
  return [
    parseInt(hex.slice(0, 2), 16) || 0,
    parseInt(hex.slice(2, 4), 16) || 0,
    parseInt(hex.slice(4, 6), 16) || 0,
  ];
};

const contrastingForeground = (bg: string): string => {
  const [r, g, b] = hexToRgb(bg);
  const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return lum > 0.5 ? "#1e1e1e" : "#f0f0f0";
};

const darken = (hex: string, amount: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const nr = Math.max(0, r - amount);
  const ng = Math.max(0, g - amount);
  const nb = Math.max(0, b - amount);
  return "#" + [nr, ng, nb].map(c => c.toString(16).padStart(2, "0")).join("");
};

const lighten = (hex: string, amount: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const nr = Math.min(255, r + amount);
  const ng = Math.min(255, g + amount);
  const nb = Math.min(255, b + amount);
  return "#" + [nr, ng, nb].map(c => c.toString(16).padStart(2, "0")).join("");
};

const blendColors = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const nr = Math.round(ar * t + br * (1 - t));
  const ng = Math.round(ag * t + bg * (1 - t));
  const nb = Math.round(ab * t + bb * (1 - t));
  return "#" + [nr, ng, nb].map(c => c.toString(16).padStart(2, "0")).join("");
};

function buildColors(
  t: MasterSchema["tokens"],
  term: MasterSchema["terminal"],
  status: MasterSchema["status"],
  withAlpha: (hex: string, a: number) => string,
  isDark: boolean,
): Record<string, string> {
  const indentGuide = isDark
    ? blendColors(t.textPrimary, t.editorBackground, 0.12)
    : blendColors(t.textPrimary, t.editorBackground, 0.12);
  const activeIndentGuide = isDark
    ? blendColors(t.textPrimary, t.editorBackground, 0.22)
    : blendColors(t.textPrimary, t.editorBackground, 0.22);

  return {
    "editor.background": t.editorBackground,
    "editor.foreground": t.editorForeground,
    "editor.lineHighlightBackground": t.editorBackground,
    "editor.selectionBackground": t.selectionBackground,
    "editor.inactiveSelectionBackground": withAlpha(t.selectionBackground, 0.5),
    "editorLineNumber.foreground": t.editorLineNumber,
    "editorLineNumber.activeForeground": t.editorActiveLineNumber,
    "editorGutter.background": t.editorGutterBackground,
    "editorCursor.foreground": t.textAccent,
    "editorIndentGuide.background1": indentGuide,
    "editorIndentGuide.activeBackground1": withAlpha(activeIndentGuide, 0.35),
    "editorBracketMatch.background": t.border,
    "editorBracketMatch.border": t.border,

    "scrollbar.shadow": t.background,
    "scrollbarSlider.background": t.scrollbarThumb,
    "scrollbarSlider.hoverBackground": t.scrollbarThumbHover,
    "scrollbarSlider.activeBackground": isDark
      ? withAlpha(t.scrollbarThumbHover, 0.7)
      : withAlpha(t.scrollbarThumb, 0.5),

    "panel.background": t.panelBackground,
    "panel.foreground": t.textPrimary,
    "panel.border": t.panelBorder,
    "panelTitle.activeBorder": t.borderFocused,

    "statusBar.background": t.statusBarBackground,
    "statusBar.foreground": t.textPrimary,
    "statusBar.debuggingBackground": status.error,
    "statusBar.noFolderBackground": t.statusBarBackground,

    "titleBar.activeBackground": t.titleBarBackground,
    "titleBar.activeForeground": t.textPrimary,
    "titleBar.inactiveBackground": t.titleBarBackground,
    "titleBar.inactiveForeground": t.textMuted,

    "activityBar.background": t.activityBarBackground,
    "activityBar.foreground": t.activityBarForeground,
    "activityBar.inactiveForeground": t.textMuted,
    "activityBarBadge.background": t.textAccent,
    "activityBarBadge.foreground": t.buttonForeground,

    "sideBar.background": t.sidebarBackground,
    "sideBar.foreground": t.textPrimary,
    "sideBar.border": t.border,
    "sideBarSectionHeader.background": t.background,
    "sideBarSectionHeader.foreground": t.textPrimary,

    "input.background": t.inputBackground,
    "input.border": t.inputBorder,
    "input.foreground": t.inputForeground,
    "inputOption.activeBorder": t.borderFocused,

    "dropdown.background": t.dropdownBackground,
    "dropdown.border": t.dropdownBorder,
    "dropdown.foreground": t.inputForeground,

    "list.activeSelectionBackground": t.selectionBackground,
    "list.activeSelectionForeground": t.textPrimary,
    "list.hoverBackground": t.hoverBackground,
    "list.hoverForeground": t.textPrimary,
    "list.inactiveSelectionBackground": t.surface,
    "list.focusBackground": t.selectionBackground,
    "list.highlightForeground": "#f0f0f0",

    "button.background": t.buttonBackground,
    "button.foreground": t.buttonForeground,

    "tab.activeBackground": t.tabActiveBackground,
    "tab.inactiveBackground": t.tabInactiveBackground,
    "tab.activeForeground": t.textPrimary,
    "tab.inactiveForeground": t.textMuted,
    "tab.border": t.border,
    "tab.hoverBackground": t.hoverBackground,

    "focusBorder": t.focusRing,
    "foreground": t.textPrimary,
    "descriptionForeground": t.textPrimary,
    "textLink.foreground": t.linkForeground,
    "textLink.activeForeground": t.linkHoverForeground,

    "terminal.foreground": term.foreground,
    "terminal.background": t.editorBackground,
    "terminal.ansiBlack": term.black,
    "terminal.ansiBrightBlack": term.brightBlack,
    "terminal.ansiRed": term.red,
    "terminal.ansiBrightRed": term.brightRed,
    "terminal.ansiGreen": term.green,
    "terminal.ansiBrightGreen": term.brightGreen,
    "terminal.ansiYellow": term.yellow,
    "terminal.ansiBrightYellow": term.brightYellow,
    "terminal.ansiBlue": term.blue,
    "terminal.ansiBrightBlue": term.brightBlue,
    "terminal.ansiMagenta": term.magenta,
    "terminal.ansiBrightMagenta": term.brightMagenta,
    "terminal.ansiCyan": term.cyan,
    "terminal.ansiBrightCyan": term.brightCyan,
    "terminal.ansiWhite": term.white,
    "terminal.ansiBrightWhite": term.brightWhite,

    "gitDecoration.modifiedResourceForeground": status.info,
    "gitDecoration.deletedResourceForeground": status.error,
    "gitDecoration.addedResourceForeground": status.success,
    "gitDecoration.untrackedResourceForeground": status.success,
    "gitDecoration.renamedResourceForeground": status.info,
    "gitDecoration.conflictingResourceForeground": status.warning,
    "gitDecoration.ignoredResourceForeground": t.textMuted,

    "editorError.foreground": status.error,
    "editorWarning.foreground": status.warning,
    "editorInfo.foreground": status.info,
    "editorHint.foreground": status.success,
    "errorForeground": status.error,
    "warningForeground": status.warning,
    "infoForeground": status.info,
    "successForeground": status.success,
  };
}

function buildTokenColors(s: MasterSchema["syntax"]): Array<{ name: string; scope: string[]; settings: { foreground: string; fontStyle?: string } }> {
  const scopes: Array<{ name: string; scope: string[]; settings: { foreground: string; fontStyle?: string } }> = [];

  for (const [key, val] of Object.entries(s)) {
    const scopeName = key.replace(/_/g, ".");
    scopes.push({
      name: scopeName.charAt(0).toUpperCase() + scopeName.slice(1).replace(/\./g, " "),
      scope: [key.replace(/_/g, ".")],
      settings: {
        foreground: val.color,
        fontStyle: val.fontStyle === "italic" ? "italic" : undefined,
      },
    });
  }

  return scopes;
}
