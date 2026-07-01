import { definePlugin } from "../types.js";
import type { PluginOutput, PluginInput, MasterSchema } from "../types.js";
import type { Appearance } from "../../core/types.js";

interface ZedStyleOverrides {
  [key: string]: string | null;
}

interface ZedSyntaxOverride {
  color?: string;
  background_color?: string | null;
  font_style?: string | null;
  font_weight?: number | null;
}

interface ZedCustomizations {
  style?: ZedStyleOverrides;
  syntax?: Record<string, ZedSyntaxOverride>;
}

export const zedPlugin = definePlugin({
  id: "zed",
  name: "Zed Editor",
  version: "1.0.0",
  description: "Generates a Zed theme JSON file from the master schema.",
  consumes: ["tokens", "syntax", "terminal", "status", "players", "base24"],

  render(input: PluginInput): PluginOutput[] {
    const { master } = input;

    const appearance: Appearance = master.meta.appearance;

    const theme = {
      $schema: "https://zed.dev/schema/themes/v0.2.0.json",
      name: master.meta.name,
      author: master.meta.author,
      themes: [
        {
          name: `${master.meta.name} ${appearance === "dark" ? "Dark" : "Light"}`,
          appearance,
          style: buildZedStyle(master),
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

function buildZedStyle(m: MasterSchema) {
  const t = m.tokens;
  const term = m.terminal;
  const s = m.syntax;
  const players = m.players;
  const base24 = m.base24;
  const palette = m.meta.basePalette;

  const zedCustom = (m.meta.customizations?.plugins?.zed ?? {}) as ZedCustomizations;
  const overrides = zedCustom.style ?? {};

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

  function ov(key: string, fallback: string | null): string | null {
    const v = (overrides as Record<string, string | null | undefined>)[key];
    return v !== undefined ? v : fallback;
  }

  return {
    "background.appearance": ov("background.appearance", "opaque")!,
    accents: [
      palette.accent,
      t.textMuted,
      t.textPlaceholder,
      palette.accent,
      t.textMuted,
      t.textPlaceholder,
      palette.accent,
      t.textMuted,
      t.textPlaceholder,
    ],
    border: ov("border", t.border)!,
    "border.variant": ov("border.variant", withAlpha(t.border, 0.7))!,
    "border.focused": ov("border.focused", t.borderFocused)!,
    "border.selected": ov("border.selected", t.borderSelected)!,
    "border.transparent": ov("border.transparent", t.border)!,
    "border.disabled": ov("border.disabled", t.border)!,
    "elevated_surface.background": ov("elevated_surface.background", t.elevatedSurface)!,
    "surface.background": ov("surface.background", blend(t.surface, t.background, 0.75))!,
    background: ov("background", t.background)!,
    "element.background": ov("element.background", t.surface)!,
    "element.hover": ov("element.hover", t.hoverBackground)!,
    "element.active": ov("element.active", t.activeBackground)!,
    "element.selected": ov("element.selected", t.selectionBackground)!,
    "element.disabled": ov("element.disabled", t.border)!,
    "drop_target.background": ov("drop_target.background", withAlpha(t.textAccent, 0.2))!,
    "ghost_element.background": ov("ghost_element.background", t.background)!,
    "ghost_element.hover": ov("ghost_element.hover", t.hoverBackground)!,
    "ghost_element.active": ov("ghost_element.active", t.activeBackground)!,
    "ghost_element.selected": ov("ghost_element.selected", t.selectionBackground)!,
    "ghost_element.disabled": ov("ghost_element.disabled", t.border)!,
    text: ov("text", t.textPrimary)!,
    "text.muted": ov("text.muted", t.textMuted)!,
    "text.placeholder": ov("text.placeholder", t.textPlaceholder)!,
    "text.disabled": ov("text.disabled", t.textDisabled)!,
    "text.accent": ov("text.accent", t.textAccent)!,
    icon: ov("icon", t.iconAccent)!,
    "icon.muted": ov("icon.muted", t.iconMuted)!,
    "icon.disabled": ov("icon.disabled", t.textDisabled)!,
    "icon.placeholder": ov("icon.placeholder", t.textDisabled)!,
    "icon.accent": ov("icon.accent", t.iconAccent)!,
    "debugger.accent": ov("debugger.accent", t.textAccent)!,
    "status_bar.background": ov("status_bar.background", t.statusBarBackground)!,
    "title_bar.background": ov("title_bar.background", t.titleBarBackground)!,
    "title_bar.inactive_background": ov("title_bar.inactive_background", t.titleBarBackground)!,
    "toolbar.background": ov("toolbar.background", t.surface)!,
    "tab_bar.background": ov("tab_bar.background", t.tabBarBackground)!,
    "tab.inactive_background": ov("tab.inactive_background", t.tabInactiveBackground)!,
    "tab.active_background": ov("tab.active_background", t.tabActiveBackground)!,
    "search.match_background": ov("search.match_background", withAlpha(t.textAccent, 0.2))!,
    "panel.background": ov("panel.background", t.panelBackground)!,
    "panel.focused_border": ov("panel.focused_border", t.panelBorder)!,
    "panel.indent_guide": ov("panel.indent_guide", t.editorIndentGuide)!,
    "panel.indent_guide_hover": ov("panel.indent_guide_hover", withAlpha(t.editorIndentGuide, 0.5))!,
    "panel.indent_guide_active": ov("panel.indent_guide_active", t.editorActiveIndentGuide)!,
    "pane.focused_border": ov("pane.focused_border", t.borderMuted)!,
    "pane_group.border": ov("pane_group.border", t.border)!,
    "scrollbar.thumb.background": ov("scrollbar.thumb.background", t.scrollbarThumb)!,
    "scrollbar.thumb.hover_background": ov("scrollbar.thumb.hover_background", t.scrollbarThumbHover)!,
    "scrollbar.thumb.active_background": ov("scrollbar.thumb.active_background", withAlpha(t.scrollbarThumb, 0.5))!,
    "scrollbar.thumb.border": ov("scrollbar.thumb.border", t.scrollbarThumb)!,
    "scrollbar.track.background": ov("scrollbar.track.background", t.scrollbarTrack)!,
    "scrollbar.track.border": ov("scrollbar.track.border", withAlpha(t.border, 0.7))!,
    "minimap.thumb.background": ov("minimap.thumb.background", t.scrollbarThumb)!,
    "minimap.thumb.hover_background": ov("minimap.thumb.hover_background", t.scrollbarThumbHover)!,
    "minimap.thumb.active_background": ov("minimap.thumb.active_background", withAlpha(t.scrollbarThumb, 0.5))!,
    "minimap.thumb.border": ov("minimap.thumb.border", t.scrollbarThumb)!,
    "editor.foreground": ov("editor.foreground", t.editorForeground)!,
    "editor.background": ov("editor.background", t.editorBackground)!,
    "editor.gutter.background": ov("editor.gutter.background", t.editorGutterBackground)!,
    "editor.subheader.background": ov("editor.subheader.background", t.border)!,
    "editor.active_line.background": ov("editor.active_line.background", t.background)!,
    "editor.highlighted_line.background": ov("editor.highlighted_line.background", t.background)!,
    "editor.debugger_active_line.background": ov("editor.debugger_active_line.background", t.background)!,
    "editor.line_number": ov("editor.line_number", t.editorLineNumber)!,
    "editor.active_line_number": ov("editor.active_line_number", t.editorActiveLineNumber)!,
    "editor.hover_line_number": ov("editor.hover_line_number", t.editorActiveLineNumber)!,
    "editor.invisible": ov("editor.invisible", withAlpha(t.editorIndentGuide, 0.4))!,
    "editor.wrap_guide": ov("editor.wrap_guide", t.editorIndentGuide)!,
    "editor.active_wrap_guide": ov("editor.active_wrap_guide", t.border)!,
    "editor.indent_guide": ov("editor.indent_guide", t.editorIndentGuide)!,
    "editor.indent_guide_active": ov("editor.indent_guide_active", t.editorActiveIndentGuide)!,
    "editor.document_highlight.read_background": ov("editor.document_highlight.read_background", withAlpha(t.textAccent, 0.2))!,
    "editor.document_highlight.write_background": ov("editor.document_highlight.write_background", withAlpha(t.textAccent, 0.2))!,
    "editor.document_highlight.bracket_background": ov("editor.document_highlight.bracket_background", withAlpha(t.textPrimary, 0.1))!,
    "terminal.background": ov("terminal.background", t.editorBackground)!,
    "terminal.foreground": ov("terminal.foreground", t.editorForeground)!,
    "terminal.ansi.background": ov("terminal.ansi.background", term.background)!,
    "terminal.bright_foreground": ov("terminal.bright_foreground", term.foreground)!,
    "terminal.dim_foreground": ov("terminal.dim_foreground", withAlpha(term.foreground, 0.5))!,
    "terminal.ansi.black": ov("terminal.ansi.black", term.black)!,
    "terminal.ansi.bright_black": ov("terminal.ansi.bright_black", term.brightBlack)!,
    "terminal.ansi.red": ov("terminal.ansi.red", term.red)!,
    "terminal.ansi.bright_red": ov("terminal.ansi.bright_red", term.brightRed)!,
    "terminal.ansi.green": ov("terminal.ansi.green", term.green)!,
    "terminal.ansi.bright_green": ov("terminal.ansi.bright_green", term.brightGreen)!,
    "terminal.ansi.yellow": ov("terminal.ansi.yellow", term.yellow)!,
    "terminal.ansi.bright_yellow": ov("terminal.ansi.bright_yellow", term.brightYellow)!,
    "terminal.ansi.blue": ov("terminal.ansi.blue", term.blue)!,
    "terminal.ansi.bright_blue": ov("terminal.ansi.bright_blue", term.brightBlue)!,
    "terminal.ansi.magenta": ov("terminal.ansi.magenta", term.magenta)!,
    "terminal.ansi.bright_magenta": ov("terminal.ansi.bright_magenta", term.brightMagenta)!,
    "terminal.ansi.cyan": ov("terminal.ansi.cyan", term.cyan)!,
    "terminal.ansi.bright_cyan": ov("terminal.ansi.bright_cyan", term.brightCyan)!,
    "terminal.ansi.white": ov("terminal.ansi.white", term.white)!,
    "terminal.ansi.bright_white": ov("terminal.ansi.bright_white", term.brightWhite)!,
    "link_text.hover": ov("link_text.hover", t.linkHoverForeground)!,
    "version_control.added": ov("version_control.added", m.status.success)!,
    "version_control.deleted": ov("version_control.deleted", m.status.error)!,
    "version_control.modified": ov("version_control.modified", m.status.warning)!,
    "version_control.renamed": ov("version_control.renamed", m.status.success)!,
    "version_control.conflict": ov("version_control.conflict", m.status.warning)!,
    "version_control.ignored": ov("version_control.ignored", t.textMuted)!,
    conflict: ov("conflict", withAlpha(m.status.warning, 0.7))!,
    "conflict.background": ov("conflict.background", null),
    "conflict.border": ov("conflict.border", null),
    created: ov("created", m.status.success)!,
    "created.background": ov("created.background", null),
    "created.border": ov("created.border", null),
    deleted: ov("deleted", m.status.error)!,
    "deleted.background": ov("deleted.background", null),
    "deleted.border": ov("deleted.border", null),
    error: ov("error", m.status.error)!,
    "error.background": ov("error.background", withAlpha(m.status.error, 0.1))!,
    "error.border": ov("error.border", m.status.error)!,
    hidden: ov("hidden", t.textMuted)!,
    "hidden.background": ov("hidden.background", null),
    "hidden.border": ov("hidden.border", null),
    hint: ov("hint", t.textMuted)!,
    "hint.background": ov("hint.background", null),
    "hint.border": ov("hint.border", null),
    ignored: ov("ignored", withAlpha(t.textMuted, 0.3))!,
    "ignored.background": ov("ignored.background", null),
    "ignored.border": ov("ignored.border", null),
    info: ov("info", m.status.info)!,
    "info.background": ov("info.background", null),
    "info.border": ov("info.border", null),
    modified: ov("modified", m.status.info)!,
    "modified.background": ov("modified.background", null),
    "modified.border": ov("modified.border", null),
    predictive: ov("predictive", t.textMuted)!,
    "predictive.background": ov("predictive.background", null),
    "predictive.border": ov("predictive.border", null),
    renamed: ov("renamed", m.status.success)!,
    "renamed.background": ov("renamed.background", null),
    "renamed.border": ov("renamed.border", null),
    success: ov("success", m.status.success)!,
    "success.background": ov("success.background", null),
    "success.border": ov("success.border", null),
    unreachable: ov("unreachable", m.status.error)!,
    "unreachable.background": ov("unreachable.background", null),
    "unreachable.border": ov("unreachable.border", null),
    warning: ov("warning", m.status.warning)!,
    "warning.background": ov("warning.background", withAlpha(m.status.warning, 0.1))!,
    "warning.border": ov("warning.border", m.status.warning)!,
    players: players.map((p) => ({
      cursor: p.cursor,
      background: p.background,
      selection: p.selection,
    })),
    syntax: buildSyntaxObject(s, m),
  };
}

function buildSyntaxObject(s: MasterSchema["syntax"], m: MasterSchema): Record<string, unknown> {
  const zedCustom = (m.meta.customizations?.plugins?.zed ?? {}) as ZedCustomizations;
  const syntaxOverrides = zedCustom.syntax ?? {};

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(s)) {
    result[key] = {
      color: val.color,
      background_color: null,
      font_style: val.fontStyle ?? null,
      font_weight: val.fontWeight ?? null,
    };
  }

  for (const [key, value] of Object.entries(syntaxOverrides)) {
    const existing = result[key] as Record<string, unknown> | undefined;
    result[key] = { ...existing, ...value };
  }

  return result;
}
