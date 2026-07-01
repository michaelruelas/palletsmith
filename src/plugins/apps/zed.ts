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
    "background.appearance": "opaque",
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
    border: t.border,
    "border.variant": t.borderMuted,
    "border.focused": t.borderFocused,
    "border.selected": t.borderSelected,
    "border.transparent": t.border,
    "border.disabled": t.border,
    "elevated_surface.background": t.elevatedSurface,
    "surface.background": blend(t.surface, t.background, 0.75),
    background: t.background,
    "element.background": t.surface,
    "element.hover": t.hoverBackground,
    "element.active": t.activeBackground,
    "element.selected": t.selectionBackground,
    "element.disabled": t.border,
    "drop_target.background": withAlpha(t.textAccent, 0.2),
    "ghost_element.background": t.background,
    "ghost_element.hover": t.hoverBackground,
    "ghost_element.active": t.activeBackground,
    "ghost_element.selected": t.selectionBackground,
    "ghost_element.disabled": t.border,
    text: t.textPrimary,
    "text.muted": t.textMuted,
    "text.placeholder": t.textPlaceholder,
    "text.disabled": t.textDisabled,
    "text.accent": t.textAccent,
    icon: t.iconAccent,
    "icon.muted": t.iconMuted,
    "icon.disabled": t.textDisabled,
    "icon.placeholder": t.textDisabled,
    "icon.accent": t.iconAccent,
    "debugger.accent": t.textAccent,
    "status_bar.background": t.statusBarBackground,
    "title_bar.background": t.titleBarBackground,
    "title_bar.inactive_background": t.titleBarBackground,
    "toolbar.background": t.surface,
    "tab_bar.background": t.tabBarBackground,
    "tab.inactive_background": t.tabInactiveBackground,
    "tab.active_background": t.tabActiveBackground,
    "search.match_background": withAlpha(t.textAccent, 0.2),
    "panel.background": t.panelBackground,
    "panel.focused_border": t.panelBorder,
    "panel.indent_guide": t.editorIndentGuide,
    "panel.indent_guide_hover": withAlpha(t.editorIndentGuide, 0.5),
    "panel.indent_guide_active": t.editorActiveIndentGuide,
    "pane.focused_border": t.borderMuted,
    "pane_group.border": t.border,
    "scrollbar.thumb.background": t.scrollbarThumb,
    "scrollbar.thumb.hover_background": t.scrollbarThumbHover,
    "scrollbar.thumb.active_background": withAlpha(t.scrollbarThumb, 0.5),
    "scrollbar.thumb.border": t.scrollbarThumb,
    "scrollbar.track.background": t.scrollbarTrack,
    "scrollbar.track.border": withAlpha(t.border, 0.7),
    "minimap.thumb.background": t.scrollbarThumb,
    "minimap.thumb.hover_background": t.scrollbarThumbHover,
    "minimap.thumb.active_background": withAlpha(t.scrollbarThumb, 0.5),
    "minimap.thumb.border": t.scrollbarThumb,
    "editor.foreground": t.editorForeground,
    "editor.background": t.editorBackground,
    "editor.gutter.background": t.editorGutterBackground,
    "editor.subheader.background": t.border,
    "editor.active_line.background": t.background,
    "editor.highlighted_line.background": t.background,
    "editor.debugger_active_line.background": t.background,
    "editor.line_number": t.editorLineNumber,
    "editor.active_line_number": t.editorActiveLineNumber,
    "editor.hover_line_number": t.editorActiveLineNumber,
    "editor.invisible": withAlpha(t.editorIndentGuide, 0.4),
    "editor.wrap_guide": t.editorIndentGuide,
    "editor.active_wrap_guide": t.border,
    "editor.indent_guide": t.editorIndentGuide,
    "editor.indent_guide_active": t.editorActiveIndentGuide,
    "editor.document_highlight.read_background": withAlpha(t.textAccent, 0.2),
    "editor.document_highlight.write_background": withAlpha(t.textAccent, 0.2),
    "editor.document_highlight.bracket_background": withAlpha(t.textPrimary, 0.1),
    "terminal.background": t.editorBackground,
    "terminal.foreground": t.editorForeground,
    "terminal.ansi.background": term.background,
    "terminal.bright_foreground": term.foreground,
    "terminal.dim_foreground": isGitHub ? t.textMuted : withAlpha(term.foreground, 0.5),
    "terminal.ansi.black": term.black,
    "terminal.ansi.bright_black": term.brightBlack,
    "terminal.ansi.red": term.red,
    "terminal.ansi.bright_red": term.brightRed,
    "terminal.ansi.green": term.green,
    "terminal.ansi.bright_green": term.brightGreen,
    "terminal.ansi.yellow": term.yellow,
    "terminal.ansi.bright_yellow": term.brightYellow,
    "terminal.ansi.blue": term.blue,
    "terminal.ansi.bright_blue": term.brightBlue,
    "terminal.ansi.magenta": term.magenta,
    "terminal.ansi.bright_magenta": term.brightMagenta,
    "terminal.ansi.cyan": term.cyan,
    "terminal.ansi.bright_cyan": term.brightCyan,
    "terminal.ansi.white": term.white,
    "terminal.ansi.bright_white": term.brightWhite,
    "link_text.hover": t.linkHoverForeground,
    "version_control.added": m.status.success,
    "version_control.deleted": m.status.error,
    "version_control.modified": m.status.warning,
    "version_control.renamed": m.status.success,
    "version_control.conflict": m.status.warning,
    "version_control.ignored": t.textMuted,
    "conflict": withAlpha(m.status.warning, 0.7),
    "conflict.background": null,
    "conflict.border": null,
    "created": m.status.success,
    "created.background": null,
    "created.border": null,
    "deleted": m.status.error,
    "deleted.background": null,
    "deleted.border": null,
    "error": m.status.error,
    "error.background": isGitHub ? t.background : withAlpha(m.status.error, 0.1),
    "error.border": m.status.error,
    "hidden": t.textMuted,
    "hidden.background": null,
    "hidden.border": null,
    "hint": t.textMuted,
    "hint.background": null,
    "hint.border": null,
    "ignored": withAlpha(t.textMuted, 0.3),
    "ignored.background": null,
    "ignored.border": null,
    "info": isGitHub ? base24.base0A : m.status.info,
    "info.background": null,
    "info.border": null,
    "modified": isGitHub ? base24.base0A : m.status.info,
    "modified.background": null,
    "modified.border": null,
    "predictive": t.textMuted,
    "predictive.background": null,
    "predictive.border": null,
    "renamed": m.status.success,
    "renamed.background": null,
    "renamed.border": null,
    "success": m.status.success,
    "success.background": null,
    "success.border": null,
    "unreachable": m.status.error,
    "unreachable.background": null,
    "unreachable.border": null,
    "warning": m.status.warning,
    "warning.background": isGitHub ? t.background : withAlpha(m.status.warning, 0.1),
    "warning.border": m.status.warning,
    players: players.map((p) => ({
      cursor: p.cursor,
      background: p.background,
      selection: p.selection,
    })),
    syntax: buildSyntaxObject(s),
  };
}

function buildSyntaxObject(s: MasterSchema["syntax"]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(s)) {
    result[key] = {
      color: val.color,
      background_color: null,
      font_style: val.fontStyle ?? null,
      font_weight: val.fontWeight ?? null,
    };
  }
  return result;
}
