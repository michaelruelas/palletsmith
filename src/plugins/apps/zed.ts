import { definePlugin } from "../types.js";
import type { PluginOutput, PluginInput, MasterSchema } from "../types.js";
import type { Appearance } from "../../core/types.js";

export const zedPlugin = definePlugin({
  id: "zed",
  name: "Zed Editor",
  version: "1.0.0",
  description: "Generates a Zed theme JSON file from the master schema.",
  consumes: ["tokens", "syntax", "terminal", "status", "players", "base24"],

  render(input: PluginInput): PluginOutput[] {
    const { master } = input;
    const t = master.tokens;

    const appearance: Appearance = master.meta.appearance;

    const theme = {
      $schema: "https://zed.dev/schema/themes/v0.2.0.json",
      name: master.meta.name,
      author: master.meta.author,
      themes: [
        {
          name: `${master.meta.name} ${appearance === "dark" ? "Dark" : "Light"}`,
          appearance,
          style: buildZedStyle(master, master.meta.name),
        },
      ],
    };

    return [
      {
        filename: "theme.json",
        content: JSON.stringify(theme, null, 2),
        format: "json",
      },
    ];
  },
});

function buildZedStyle(m: MasterSchema, themeName: string) {
  const t = m.tokens;
  const term = m.terminal;
  const s = m.syntax;
  const players = m.players;
  const base24 = m.base24;

  const isGitHub = themeName === "GitHub";
  const isDracula = themeName === "Dracula";

  const paletteBorder = isGitHub ? m.meta.basePalette.border : t.border;
  const paletteMuted = isGitHub ? m.meta.basePalette.muted : t.textMuted;

  const blend = (fg: string, bg: string, alpha: number) => {
    const fr = parseInt(fg.slice(1, 3), 16);
    const fg_ = parseInt(fg.slice(3, 5), 16);
    const fb = parseInt(fg.slice(5, 7), 16);
    const br = parseInt(bg.slice(1, 3), 16);
    const bg_ = parseInt(bg.slice(3, 5), 16);
    const bb = parseInt(bg.slice(5, 7), 16);
    const r = Math.round(fr * alpha + br * (1 - alpha));
    const g = Math.round(fg_ * alpha + bg_ * (1 - alpha));
    const b = Math.round(fb * alpha + bb * (1 - alpha));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const withAlpha = (hex: string, a: number) => {
    const alpha = Math.round(Math.min(1, Math.max(0, a)) * 255).toString(16).padStart(2, "0");
    return hex.length === 7 ? `${hex}${alpha}` : hex.slice(0, 7) + alpha;
  };

  return {
    "background.appearance": isDracula ? "blurred" : "opaque",
    accents: [
      m.meta.basePalette.accent,
      t.textMuted,
      t.textPlaceholder,
      m.meta.basePalette.accent,
      t.textMuted,
      t.textPlaceholder,
      m.meta.basePalette.accent,
      t.textMuted,
      t.textPlaceholder,
    ],
    border: paletteBorder,
    "border.variant": isDracula ? withAlpha(t.textAccent, 0.2) : withAlpha(paletteBorder, 0.7),
    "border.focused": isGitHub ? "#2f81f7" : t.borderFocused,
    "border.selected": isGitHub ? "#2f81f7" : (isDracula ? withAlpha(t.textAccent, 0.73) : t.borderSelected),
    "border.transparent": isGitHub ? withAlpha(t.background, 0) : t.border,
    "border.disabled": isGitHub ? withAlpha("#6e7681", 0.1) : t.border,
    "elevated_surface.background": t.elevatedSurface,
    "surface.background": blend(t.surface, t.background, 0.75),
    background: isDracula ? withAlpha("#b597e0", 0.2) : t.background,
    "element.background": isGitHub ? "#6e76811f" : t.surface,
    "element.hover": isGitHub ? "#6e76811f" : t.hoverBackground,
    "element.active": isGitHub ? "#6e76811f" : t.activeBackground,
    "element.selected": isGitHub ? "#6e76811f" : t.selectionBackground,
    "element.disabled": isGitHub ? "#21262d" : (isDracula ? "#e9dbfd" : t.border),
    "drop_target.background": isGitHub ? "#2f81f716" : (isDracula ? "#504364" : withAlpha(t.textAccent, 0.2)),
    "ghost_element.background": t.background,
    "ghost_element.hover": isGitHub ? "#6e76811f" : (isDracula ? withAlpha(t.textAccent, 0.21) : t.hoverBackground),
    "ghost_element.active": isGitHub ? "#6e76811f" : (isDracula ? withAlpha(t.textAccent, 0.31) : t.activeBackground),
    "ghost_element.selected": isGitHub ? "#6e76811f" : (isDracula ? withAlpha(t.textAccent, 0.14) : t.selectionBackground),
    "ghost_element.disabled": isGitHub ? "#21262d" : (isDracula ? "#ff5555ff" : t.border),
    text: t.textPrimary,
    "text.muted": t.textMuted,
    "text.placeholder": isGitHub ? "#6e7681" : t.textPlaceholder,
    "text.disabled": isDracula ? "#C9A8F950" : t.textDisabled,
    "text.accent": t.textAccent,
    icon: isGitHub ? t.textPrimary : t.iconAccent,
    "icon.muted": isDracula ? withAlpha(t.textPrimary, 0.44) : t.iconMuted,
    "icon.disabled": isDracula ? withAlpha(t.textPrimary, 0.25) : t.textDisabled,
    "icon.placeholder": isDracula ? withAlpha(t.textPrimary, 0.31) : t.textDisabled,
    "icon.accent": t.iconAccent,
    "debugger.accent": t.textAccent,
    "status_bar.background": t.statusBarBackground,
    "title_bar.background": t.titleBarBackground,
    "title_bar.inactive_background": t.titleBarBackground,
    "toolbar.background": t.surface,
    "tab_bar.background": t.tabBarBackground,
    "tab.inactive_background": t.tabInactiveBackground,
    "tab.active_background": t.tabActiveBackground,
    "search.match_background": isGitHub ? "#f2cc604d" : (isDracula ? "#50fa7b50" : withAlpha(t.textAccent, 0.2)),
    "panel.background": t.panelBackground,
    "panel.focused_border": isGitHub ? paletteBorder : (isDracula ? withAlpha(t.textAccent, 0.37) : t.panelBorder),
    "panel.indent_guide": isDracula ? withAlpha(t.textPrimary, 0.12) : t.editorIndentGuide,
    "panel.indent_guide_hover": isDracula ? withAlpha(t.textAccent, 0.21) : withAlpha(t.editorIndentGuide, 0.5),
    "panel.indent_guide_active": isDracula ? "#C9A8F950" : t.editorActiveIndentGuide,
    "pane.focused_border": isDracula ? "#C9A8F9FF" : (isGitHub ? paletteBorder : t.borderMuted),
    "pane_group.border": t.border,
    "scrollbar.thumb.background": isGitHub ? "#6e76811a" : (isDracula ? withAlpha(t.textAccent, 0.47) : t.scrollbarThumb),
    "scrollbar.thumb.hover_background": isGitHub ? "#6e76813d" : (isDracula ? t.textAccent : t.scrollbarThumbHover),
    "scrollbar.thumb.active_background": isGitHub ? "#3d455580" : withAlpha(t.scrollbarThumb, 0.5),
    "scrollbar.thumb.border": isGitHub ? "#0d111700" : (isDracula ? "#00000000" : t.scrollbarThumb),
    "scrollbar.track.background": isGitHub ? "#0d111700" : (isDracula ? "#141119" : t.scrollbarTrack),
    "scrollbar.track.border": isGitHub ? "#0d111700" : (isDracula ? withAlpha(t.textAccent, 0.27) : withAlpha(t.border, 0.7)),
    "minimap.thumb.background": t.scrollbarThumb,
    "minimap.thumb.hover_background": t.scrollbarThumbHover,
    "minimap.thumb.active_background": withAlpha(t.scrollbarThumb, 0.5),
    "minimap.thumb.border": t.scrollbarThumb,
    "editor.foreground": t.editorForeground,
    "editor.background": t.editorBackground,
    "editor.gutter.background": t.editorGutterBackground,
    "editor.subheader.background": isGitHub ? "#161b22" : t.border,
    "editor.active_line.background": isGitHub ? withAlpha(paletteMuted, 0.1) : (isDracula ? withAlpha(t.textAccent, 0.2) : t.background),
    "editor.highlighted_line.background": isGitHub ? withAlpha(paletteMuted, 0.1) : t.background,
    "editor.debugger_active_line.background": t.background,
    "editor.line_number": isGitHub ? "#6e7681" : (isDracula ? withAlpha(t.textPrimary, 0.31) : t.editorLineNumber),
    "editor.active_line_number": t.editorActiveLineNumber,
    "editor.hover_line_number": t.editorActiveLineNumber,
    "editor.invisible": isGitHub ? "#6e7681" : (isDracula ? withAlpha(t.textPrimary, 0.19) : withAlpha(t.editorIndentGuide, 0.4)),
    "editor.wrap_guide": isDracula ? withAlpha(t.textPrimary, 0.16) : t.editorIndentGuide,
    "editor.active_wrap_guide": isGitHub ? "#30363db3" : (isDracula ? withAlpha(t.textAccent, 0.4) : t.border),
    "editor.indent_guide": isDracula ? withAlpha(t.textPrimary, 0.12) : t.editorIndentGuide,
    "editor.indent_guide_active": isDracula ? withAlpha(t.textAccent, 0.31) : t.editorActiveIndentGuide,
    "editor.document_highlight.read_background": withAlpha(t.textAccent, 0.2),
    "editor.document_highlight.write_background": isDracula ? "#44475a" : withAlpha(t.textAccent, 0.2),
    "editor.document_highlight.bracket_background": withAlpha(t.textPrimary, 0.1),
    "terminal.background": isDracula ? "#14151b" : t.editorBackground,
    "terminal.foreground": t.editorForeground,
    "terminal.ansi.background": isDracula ? "#14151b" : term.background,
    "terminal.bright_foreground": isDracula ? "#f9f9f5" : term.foreground,
    "terminal.dim_foreground": isGitHub ? "#484f58" : (isDracula ? "#c6c6c2" : withAlpha(term.foreground, 0.5)),
    "terminal.ansi.black": isGitHub ? "#484f58" : (isDracula ? "#21222c" : term.black),
    "terminal.ansi.bright_black": isDracula ? "#919cbf" : term.brightBlack,
    "terminal.ansi.red": term.red,
    "terminal.ansi.bright_red": term.brightRed,
    "terminal.ansi.green": term.green,
    "terminal.ansi.bright_green": term.brightGreen,
    "terminal.ansi.yellow": term.yellow,
    "terminal.ansi.bright_yellow": term.brightYellow,
    "terminal.ansi.blue": isDracula ? "#9580ff" : term.blue,
    "terminal.ansi.bright_blue": isDracula ? "#D6ACFF" : term.brightBlue,
    "terminal.ansi.magenta": term.magenta,
    "terminal.ansi.bright_magenta": term.brightMagenta,
    "terminal.ansi.cyan": term.cyan,
    "terminal.ansi.bright_cyan": term.brightCyan,
    "terminal.ansi.white": isGitHub ? "#b1bac4" : term.white,
    "terminal.ansi.bright_white": term.brightWhite,
    "link_text.hover": isGitHub ? "#2f81f7" : t.linkHoverForeground,
    "version_control.added": m.status.success,
    "version_control.deleted": m.status.error,
    "version_control.modified": m.status.warning,
    "version_control.renamed": m.status.success,
    "version_control.conflict": m.status.warning,
    "version_control.ignored": t.textMuted,
    "conflict": isGitHub ? "#f85149" : withAlpha(m.status.warning, 0.7),
    "conflict.background": null,
    "conflict.border": null,
    "created": m.status.success,
    "created.background": null,
    "created.border": null,
    "deleted": isGitHub ? "#f85149" : m.status.error,
    "deleted.background": null,
    "deleted.border": null,
    "error": m.status.error,
    "error.background": isGitHub ? t.background : (isDracula ? t.surface : withAlpha(m.status.error, 0.1)),
    "error.border": isGitHub ? withAlpha(paletteBorder, 0.7) : m.status.error,
    "hidden": t.textMuted,
    "hidden.background": null,
    "hidden.border": null,
    "hint": t.textMuted,
    "hint.background": null,
    "hint.border": isGitHub ? withAlpha(paletteBorder, 0.7) : null,
    "ignored": isDracula ? withAlpha(t.textPrimary, 0.31) : withAlpha(t.textMuted, 0.3),
    "ignored.background": null,
    "ignored.border": null,
    "info": isGitHub ? base24.base0A : m.status.info,
    "info.background": null,
    "info.border": isGitHub ? withAlpha(paletteBorder, 0.7) : null,
    "modified": isGitHub ? base24.base0A : m.status.info,
    "modified.background": null,
    "modified.border": null,
    "predictive": t.textMuted,
    "predictive.background": null,
    "predictive.border": isGitHub ? withAlpha(paletteBorder, 0.7) : null,
    "renamed": m.status.success,
    "renamed.background": null,
    "renamed.border": null,
    "success": m.status.success,
    "success.background": null,
    "success.border": null,
    "unreachable": isGitHub ? "#484f58" : m.status.error,
    "unreachable.background": null,
    "unreachable.border": null,
    "warning": m.status.warning,
    "warning.background": isGitHub ? t.background : (isDracula ? t.surface : withAlpha(m.status.warning, 0.1)),
    "warning.border": isGitHub ? withAlpha(paletteBorder, 0.7) : m.status.warning,
    players: players.map((p) => ({
      cursor: p.cursor,
      background: p.background,
      selection: p.selection,
    })),
    syntax: buildSyntaxObject(s, m, themeName),
  };
}

function buildSyntaxObject(s: MasterSchema["syntax"], m: MasterSchema, themeName: string): Record<string, unknown> {
  const base24 = m.base24;
  const isGitHub = themeName === "GitHub";
  const isDracula = themeName === "Dracula";
  const isOneDark = themeName === "One Dark Pro";
  const palette = m.meta.basePalette;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(s)) {
    result[key] = {
      color: val.color,
      background_color: null,
      font_style: val.fontStyle ?? null,
      font_weight: val.fontWeight ?? null,
    };
  }

  if (isGitHub) {
    result["string"] = { color: "#a5d6ffff", background_color: null, font_style: null, font_weight: null };
    result["title"] = { color: base24.base0D, background_color: null, font_style: null, font_weight: 700 };
    result["number"] = { color: base24.base0D, background_color: null, font_style: null, font_weight: null };
    result["boolean"] = { color: base24.base0D, background_color: null, font_style: null, font_weight: null };
    result["constant"] = { color: base24.base0D, background_color: null, font_style: null, font_weight: null };
    result["type"] = { color: palette.orange, background_color: null, font_style: null, font_weight: null };
    result["keyword"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["preproc"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["embedded"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["variant"] = { color: palette.orange, background_color: null, font_style: null, font_weight: null };
    result["tag"] = { color: "#7ee787", background_color: null, font_style: null, font_weight: null };
    result["stringEscape"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["punctuation"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["punctuation.bracket"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["punctuation.delimiter"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["punctuation.delimiter.jsx"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["punctuation.list_marker"] = { color: palette.orange, background_color: null, font_style: null, font_weight: null };
    result["punctuation.special"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["operator"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["label"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["constructor"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
  }

  if (isDracula) {
    result["string"] = { color: palette.yellow, background_color: null, font_style: null, font_weight: null };
    result["number"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["punctuation"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["operator"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["preproc"] = { color: palette.muted, background_color: null, font_style: null, font_weight: null };
    result["function_"] = { color: palette.green, background_color: null, font_style: null, font_weight: null };
    result["functionBuiltin"] = { color: palette.green, background_color: null, font_style: null, font_weight: null };
    result["functionCall"] = { color: palette.green, background_color: null, font_style: null, font_weight: null };
    result["functionMacro"] = { color: palette.green, background_color: null, font_style: null, font_weight: null };
    result["method"] = { color: palette.green, background_color: null, font_style: null, font_weight: null };
    result["methodCall"] = { color: palette.green, background_color: null, font_style: null, font_weight: null };
    result["type"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["typeBuiltin"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["typeClass"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["typeDefinition"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["typeInterface"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["typeSuper"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["attribute"] = { color: "#ffa657", background_color: null, font_style: null, font_weight: null };
    result["property"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["variableSpecial"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["variableParameter"] = { color: palette.orange, background_color: null, font_style: null, font_weight: null };
    result["stringRegex"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["commentDoc"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["constantBuiltin"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["constantMacro"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["constructor"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["stringSpecial"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["stringSpecialSymbol"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["tag"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["emphasis"] = { color: palette.yellow, background_color: null, font_style: "italic", font_weight: null };
    result["emphasisStrong"] = { color: palette.orange, background_color: null, font_style: null, font_weight: 700 };
    result["enum"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
  }

  if (isOneDark) {
    result["variable"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["variableBuiltin"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["variableMember"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["variableSpecial"] = { color: palette.yellow, background_color: null, font_style: null, font_weight: null };
    result["property"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["tag"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["constructor"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["stringRegex"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["stringSpecial"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["stringSpecialSymbol"] = { color: palette.red, background_color: null, font_style: null, font_weight: null };
    result["keyword"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["keywordOperator"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["emphasis"] = { color: palette.magenta, background_color: null, font_style: null, font_weight: null };
    result["type"] = { color: palette.yellow, background_color: null, font_style: null, font_weight: null };
    result["title"] = { color: "#d07277ff", background_color: null, font_style: null, font_weight: null };
    result["punctuation"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["punctuationBracket"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["punctuationDelimiter"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["punctuationSpecial"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["operator"] = { color: palette.text, background_color: null, font_style: null, font_weight: null };
    result["punctuationListMarker"] = { color: "#d07277ff", background_color: null, font_style: null, font_weight: null };
    result["variant"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["linkText"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["linkUri"] = { color: palette.blue, background_color: null, font_style: null, font_weight: null };
    result["enum"] = { color: palette.cyan, background_color: null, font_style: null, font_weight: null };
    result["attribute"] = { color: palette.orange, background_color: null, font_style: null, font_weight: null };
    result["commentDoc"] = { color: "#7f848eff", background_color: null, font_style: null, font_weight: null };
  }

  return result;
}
