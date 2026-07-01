import { definePlugin } from "./types.js";
import type { PluginOutput, PluginInput } from "./types.js";
import type { MasterSchema } from "../core/types.js";
import { withAlpha, blend } from "../core/color.js";

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

    const theme = {
      name: `${master.meta.name} ${appearance === "dark" ? "Dark" : "Light"}`,
      type: appearance,
      colors: buildColors(t, term, master.status),
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

function buildColors(
  t: MasterSchema["tokens"],
  term: MasterSchema["terminal"],
  status: MasterSchema["status"]
): Record<string, string> {
  return {
    // Editor
    "editor.background": t.editorBackground,
    "editor.foreground": t.editorForeground,
    "editor.lineHighlightBackground": t.editorBackground,
    "editor.selectionBackground": t.selectionBackground,
    "editor.inactiveSelectionBackground": withAlpha(t.selectionBackground, 0.5),
    "editorLineNumber.foreground": t.editorLineNumber,
    "editorLineNumber.activeForeground": t.editorActiveLineNumber,
    "editorGutter.background": t.editorGutterBackground,
    "editorIndentGuide.background1": t.editorIndentGuide,
    "editorIndentGuide.activeBackground1": t.editorActiveIndentGuide,
    "editorBracketMatch.background": withAlpha(t.textAccent, 0.2),
    "editorBracketMatch.border": t.textAccent,

    // Scrollbar
    "scrollbar.shadow": t.background,
    "scrollbarSlider.background": t.scrollbarThumb,
    "scrollbarSlider.hoverBackground": t.scrollbarThumbHover,
    "scrollbarSlider.activeBackground": withAlpha(t.scrollbarThumb, 0.5),

    // Panel
    "panel.background": t.panelBackground,
    "panel.border": t.panelBorder,
    "panelTitle.activeBorder": t.borderFocused,

    // Status bar
    "statusBar.background": t.statusBarBackground,
    "statusBar.foreground": t.textPrimary,
    "statusBar.debuggingBackground": status.error,
    "statusBar.noFolderBackground": t.statusBarBackground,

    // Title bar
    "titleBar.activeBackground": t.titleBarBackground,
    "titleBar.activeForeground": t.textPrimary,
    "titleBar.inactiveBackground": t.titleBarBackground,

    // Activity bar
    "activityBar.background": t.activityBarBackground,
    "activityBar.foreground": t.activityBarForeground,
    "activityBarBadge.background": t.textAccent,
    "activityBarBadge.foreground": t.background,

    // Sidebar
    "sideBar.background": t.sidebarBackground,
    "sideBarSectionHeader.background": t.background,

    // Input
    "input.background": t.inputBackground,
    "input.border": t.inputBorder,
    "input.foreground": t.inputForeground,
    "inputOption.activeBorder": t.borderFocused,

    // Dropdown
    "dropdown.background": t.dropdownBackground,
    "dropdown.border": t.dropdownBorder,
    "dropdown.foreground": t.inputForeground,

    // List
    "list.activeSelectionBackground": t.selectionBackground,
    "list.hoverBackground": t.hoverBackground,
    "list.inactiveSelectionBackground": t.surface,

    // Button
    "button.background": t.buttonBackground,
    "button.foreground": t.buttonForeground,

    // Focus & foreground
    "focusBorder": t.focusRing,
    "foreground": t.textPrimary,
    "textLink.foreground": t.linkForeground,
    "textLink.activeForeground": t.linkHoverForeground,

    // Terminal
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

    // Git
    "gitDecoration.modifiedResourceForeground": status.info,
    "gitDecoration.deletedResourceForeground": status.error,
    "gitDecoration.addedResourceForeground": status.success,
    "gitDecoration.untrackedResourceForeground": status.success,
    "gitDecoration.renamedResourceForeground": status.info,
    "gitDecoration.conflictingResourceForeground": status.warning,

    // Editor info/warning/error
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
  // Group syntax tokens by scope
  const scopes: Array<{ name: string; scope: string[]; settings: { foreground: string; fontStyle?: string } }> = [];

  const entries: Array<[string, { color: string; fontStyle?: string }]> = Object.entries(s);

  for (const [key, val] of entries) {
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
