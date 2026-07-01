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
      colors: buildColors(t, term, master.status, master.base24, master.meta.name, withAlpha, isDark),
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
  base24: MasterSchema["base24"],
  themeName: string,
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
    "editor.lineHighlightBackground": themeName === "GitHub" ? "#6e76811a" : themeName === "One Dark Pro" ? "#2c313c" : t.editorBackground,
    "editor.selectionBackground": themeName === "Dracula" ? "#44475a" : themeName === "One Dark Pro" ? "#67769660" : t.selectionBackground,
    "editor.inactiveSelectionBackground": withAlpha(t.selectionBackground, 0.5),
    "editorLineNumber.foreground": themeName === "GitHub" ? "#6e7681" : themeName === "Dracula" ? t.textMuted : themeName === "One Dark Pro" ? "#495162" : t.editorLineNumber,
    "editorLineNumber.activeForeground": t.editorActiveLineNumber,
    "editorGutter.background": t.editorGutterBackground,
    "editorCursor.foreground": themeName === "GitHub" ? "#2f81f7" : themeName === "One Dark Pro" ? "#528bff" : t.textAccent,
    "editorIndentGuide.background1": themeName === "One Dark Pro" ? "#3b4048" : indentGuide,
    "editorIndentGuide.activeBackground1": themeName === "One Dark Pro" ? "#c8c8c859" : withAlpha(activeIndentGuide, 0.35),
    "editorBracketMatch.background": themeName === "GitHub" ? "#3fb95040" : themeName === "One Dark Pro" ? "#515a6b" : t.border,
    "editorBracketMatch.border": themeName === "GitHub" ? "#3fb95099" : themeName === "One Dark Pro" ? "#515a6b" : t.border,

    "scrollbar.shadow": themeName === "GitHub" ? "#484f5833" : themeName === "One Dark Pro" ? "#23252c" : t.background,
    "scrollbarSlider.background": themeName === "GitHub" ? "#8b949e33" : themeName === "One Dark Pro" ? "#4e566660" : t.scrollbarThumb,
    "scrollbarSlider.hoverBackground": themeName === "GitHub" ? "#8b949e3d" : themeName === "One Dark Pro" ? "#5a637580" : t.scrollbarThumbHover,
    "scrollbarSlider.activeBackground": themeName === "GitHub" ? "#8b949e47" : themeName === "One Dark Pro" ? "#747d9180" : isDark
      ? withAlpha(t.scrollbarThumbHover, 0.7)
      : withAlpha(t.scrollbarThumb, 0.5),

    "panel.background": themeName === "GitHub" ? "#010409" : t.panelBackground,
    "panel.foreground": t.textPrimary,
    "panel.border": themeName === "GitHub" ? "#30363d" : themeName === "Dracula" ? t.textAccent : themeName === "One Dark Pro" ? "#3e4452" : t.panelBorder,
    "panelTitle.activeBorder": themeName === "GitHub" ? "#f78166" : themeName === "Dracula" ? term.magenta : t.borderFocused,

    "statusBar.background": themeName === "GitHub" ? "#0d1117" : themeName === "Dracula" ? "#191a21" : t.statusBarBackground,
    "statusBar.foreground": themeName === "GitHub" ? "#7d8590" : themeName === "One Dark Pro" ? "#9da5b4" : t.textPrimary,
    "statusBar.debuggingBackground": themeName === "GitHub" ? "#da3633" : themeName === "One Dark Pro" ? "#cc6633" : status.error,
    "statusBar.noFolderBackground": themeName === "GitHub" ? "#0d1117" : themeName === "Dracula" ? "#191a21" : t.statusBarBackground,

    "titleBar.activeBackground": themeName === "Dracula" ? "#21222c" : t.titleBarBackground,
    "titleBar.activeForeground": themeName === "GitHub" ? "#7d8590" : themeName === "One Dark Pro" ? "#9da5b4" : t.textPrimary,
    "titleBar.inactiveBackground": themeName === "GitHub" ? "#010409" : themeName === "Dracula" ? "#191a21" : t.titleBarBackground,
    "titleBar.inactiveForeground": themeName === "GitHub" ? "#7d8590" : themeName === "One Dark Pro" ? "#6b717d" : t.textMuted,

    "activityBar.background": themeName === "GitHub" ? "#0d1117" : themeName === "Dracula" ? "#343746" : themeName === "One Dark Pro" ? "#282c34" : t.activityBarBackground,
    "activityBar.foreground": themeName === "One Dark Pro" ? "#d7dae0" : t.activityBarForeground,
    "activityBar.inactiveForeground": themeName === "GitHub" ? "#7d8590" : t.textMuted,
    "activityBarBadge.background": themeName === "GitHub" ? "#1f6feb" : themeName === "Dracula" ? term.magenta : themeName === "One Dark Pro" ? "#4d78cc" : t.textAccent,
    "activityBarBadge.foreground": themeName === "GitHub" ? "#ffffff" : themeName === "Dracula" ? t.textPrimary : themeName === "One Dark Pro" ? "#f8fafd" : t.buttonForeground,

    "sideBar.background": themeName === "GitHub" ? "#010409" : t.sidebarBackground,
    "sideBar.foreground": t.textPrimary,
    "sideBar.border": themeName === "GitHub" ? "#30363d" : t.border,
    "sideBarSectionHeader.background": themeName === "GitHub" ? "#010409" : t.background,
    "sideBarSectionHeader.foreground": t.textPrimary,

    "input.background": themeName === "GitHub" ? "#0d1117" : themeName === "Dracula" ? "#282a36" : themeName === "One Dark Pro" ? "#1d1f23" : t.inputBackground,
    "input.border": themeName === "GitHub" ? "#30363d" : themeName === "Dracula" ? "#191a21" : t.inputBorder,
    "input.foreground": t.inputForeground,
    "inputOption.activeBorder": t.borderFocused,

    "dropdown.background": themeName === "Dracula" ? "#343746" : t.dropdownBackground,
    "dropdown.border": themeName === "GitHub" ? "#30363d" : themeName === "Dracula" ? "#191a21" : themeName === "One Dark Pro" ? "#21252b" : t.dropdownBorder,
    "dropdown.foreground": t.inputForeground,

    "list.activeSelectionBackground": themeName === "GitHub" ? "#6e768166" : themeName === "Dracula" ? "#44475a" : themeName === "One Dark Pro" ? "#2c313a" : t.selectionBackground,
    "list.activeSelectionForeground": themeName === "One Dark Pro" ? "#d7dae0" : t.textPrimary,
    "list.hoverBackground": themeName === "GitHub" ? "#6e76811a" : themeName === "Dracula" ? withAlpha(base24.base02, 0.458) : themeName === "One Dark Pro" ? "#2c313a" : t.hoverBackground,
    "list.hoverForeground": t.textPrimary,
    "list.inactiveSelectionBackground": themeName === "GitHub" ? "#6e768166" : themeName === "Dracula" ? withAlpha(base24.base02, 0.458) : themeName === "One Dark Pro" ? "#323842" : t.surface,
    "list.focusBackground": themeName === "GitHub" ? "#388bfd26" : themeName === "Dracula" ? withAlpha(base24.base02, 0.458) : themeName === "One Dark Pro" ? "#323842" : t.selectionBackground,
    "list.highlightForeground": themeName === "GitHub" ? "#2f81f7" : themeName === "Dracula" ? term.cyan : themeName === "One Dark Pro" ? "#ecebeb" : t.textPrimary,

    "button.background": themeName === "GitHub" ? "#238636" : themeName === "Dracula" ? base24.base02 : themeName === "One Dark Pro" ? "#404754" : t.buttonBackground,
    "button.foreground": themeName === "GitHub" ? "#ffffff" : t.buttonForeground,

    "tab.activeBackground": themeName === "GitHub" ? "#0d1117" : themeName === "Dracula" ? "#282a36" : themeName === "One Dark Pro" ? "#282c34" : t.tabActiveBackground,
    "tab.inactiveBackground": themeName === "GitHub" ? "#010409" : themeName === "Dracula" ? "#21222c" : themeName === "One Dark Pro" ? "#21252b" : t.tabInactiveBackground,
    "tab.activeForeground": themeName === "One Dark Pro" ? "#dcdcdc" : t.textPrimary,
    "tab.inactiveForeground": themeName === "GitHub" ? "#7d8590" : t.textMuted,
    "tab.border": themeName === "GitHub" ? "#30363d" : themeName === "Dracula" ? "#191a21" : themeName === "One Dark Pro" ? "#181a1f" : t.border,
    "tab.hoverBackground": themeName === "GitHub" ? "#0d1117" : themeName === "One Dark Pro" ? "#323842" : t.hoverBackground,

    "focusBorder": themeName === "GitHub" ? "#1f6feb" : themeName === "Dracula" ? t.textMuted : themeName === "One Dark Pro" ? "#3e4452" : t.focusRing,
    "foreground": t.textPrimary,
    "descriptionForeground": themeName === "GitHub" ? "#7d8590" : t.textPrimary,
    "textLink.foreground": themeName === "GitHub" ? "#2f81f7" : t.linkForeground,
    "textLink.activeForeground": themeName === "GitHub" ? "#2f81f7" : t.linkHoverForeground,

    "terminal.foreground": term.foreground,
    "terminal.background": t.editorBackground,
    "terminal.ansiBlack": themeName === "GitHub" ? "#484f58" : themeName === "Dracula" ? "#21222c" : themeName === "One Dark Pro" ? "#3f4451" : term.black,
    "terminal.ansiBrightBlack": themeName === "GitHub" ? "#6e7681" : themeName === "One Dark Pro" ? "#4f5666" : term.brightBlack,
    "terminal.ansiRed": themeName === "One Dark Pro" ? "#e05561" : term.red,
    "terminal.ansiBrightRed": themeName === "GitHub" ? "#ffa198" : themeName === "Dracula" ? "#ff6e6e" : themeName === "One Dark Pro" ? "#ff616e" : term.brightRed,
    "terminal.ansiGreen": themeName === "One Dark Pro" ? "#8cc265" : term.green,
    "terminal.ansiBrightGreen": themeName === "GitHub" ? "#56d364" : themeName === "Dracula" ? "#69ff94" : themeName === "One Dark Pro" ? "#a5e075" : term.brightGreen,
    "terminal.ansiYellow": themeName === "One Dark Pro" ? "#d18f52" : term.yellow,
    "terminal.ansiBrightYellow": themeName === "GitHub" ? "#e3b341" : themeName === "Dracula" ? "#ffffa5" : themeName === "One Dark Pro" ? "#f0a45d" : term.brightYellow,
    "terminal.ansiBlue": themeName === "GitHub" ? "#58a6ff" : themeName === "One Dark Pro" ? "#4aa5f0" : term.blue,
    "terminal.ansiBrightBlue": themeName === "GitHub" ? "#79c0ff" : themeName === "Dracula" ? "#d6acff" : themeName === "One Dark Pro" ? "#4dc4ff" : term.brightBlue,
    "terminal.ansiMagenta": themeName === "One Dark Pro" ? "#c162de" : term.magenta,
    "terminal.ansiBrightMagenta": themeName === "GitHub" ? "#d2a8ff" : themeName === "Dracula" ? "#ff92df" : themeName === "One Dark Pro" ? "#de73ff" : term.brightMagenta,
    "terminal.ansiCyan": themeName === "One Dark Pro" ? "#42b3c2" : term.cyan,
    "terminal.ansiBrightCyan": themeName === "GitHub" ? "#56d4dd" : themeName === "Dracula" ? "#a4ffff" : themeName === "One Dark Pro" ? "#4cd1e0" : term.brightCyan,
    "terminal.ansiWhite": themeName === "GitHub" ? "#b1bac4" : themeName === "One Dark Pro" ? "#d7dae0" : term.white,
    "terminal.ansiBrightWhite": themeName === "One Dark Pro" ? "#e6e6e6" : term.brightWhite,

    "gitDecoration.modifiedResourceForeground": themeName === "GitHub" ? "#d29922" : themeName === "Dracula" ? term.cyan : status.info,
    "gitDecoration.deletedResourceForeground": themeName === "GitHub" ? "#f85149" : status.error,
    "gitDecoration.addedResourceForeground": status.success,
    "gitDecoration.untrackedResourceForeground": status.success,
    "gitDecoration.renamedResourceForeground": status.info,
    "gitDecoration.conflictingResourceForeground": themeName === "GitHub" ? "#db6d28" : themeName === "Dracula" ? base24.base09 : status.warning,
    "gitDecoration.ignoredResourceForeground": themeName === "GitHub" ? "#6e7681" : themeName === "One Dark Pro" ? "#636b78" : t.textMuted,

    "editorError.foreground": themeName === "One Dark Pro" ? "#c24038" : status.error,
    "editorWarning.foreground": themeName === "Dracula" ? term.cyan : base24.base09,
    "editorInfo.foreground": status.info,
    "editorHint.foreground": status.success,
    "errorForeground": themeName === "GitHub" ? "#f85149" : status.error,
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
