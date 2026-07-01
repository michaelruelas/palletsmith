import { definePlugin } from "./types.js";
import type { PluginOutput, PluginInput } from "./types.js";
import type { MasterSchema } from "../core/types.js";
import { withAlpha } from "../core/color.js";

export const chromePlugin = definePlugin({
  id: "chrome",
  name: "Chrome DevTools",
  version: "1.0.0",
  description: "Generates a Chrome DevTools theme JSON file from the master schema.",
  consumes: ["tokens", "syntax", "status"],

  render(input: PluginInput): PluginOutput[] {
    const { master } = input;
    const t = master.tokens;
    const s = master.syntax;
    const status = master.status;
    const appearance = master.meta.appearance;

    const theme = {
      version: 1,
      title: `${master.meta.name} ${appearance === "dark" ? "Dark" : "Light"}`,
      colors: {
        general: {
          text: t.textPrimary,
          textDim: t.textMuted,
          textHighlighted: t.textPrimary,
          textSelected: t.textPrimary,
          background: t.background,
          backgroundDim: t.surface,
          backgroundHighlighted: t.hoverBackground,
          backgroundSelected: t.selectionBackground,
          border: t.border,
        },
        syntax: {
          comment: s.comment?.color ?? t.textMuted,
          string: s.string?.color ?? t.textPrimary,
          number: s.number?.color ?? t.textPrimary,
          keyword: s.keyword?.color ?? t.textAccent,
          function: s.function_?.color ?? t.textPrimary,
          variable: s.variable?.color ?? t.textPrimary,
          type: s.type?.color ?? t.textPrimary,
          operator: s.operator?.color ?? t.textMuted,
          namespace: s.namespace?.color ?? t.textPrimary,
          property: s.property?.color ?? t.textPrimary,
        },
        console: {
          log: t.textPrimary,
          warn: status.warning,
          error: status.error,
          info: status.info,
          debug: t.cyan,
          verbose: t.textMuted,
        },
        sources: {
          background: t.editorBackground,
          gutter: t.editorGutterBackground,
          lineNumber: t.editorLineNumber,
          lineNumberActive: t.editorActiveLineNumber,
          selectionBackground: t.selectionBackground,
          currentLineBackground: t.editorBackground,
          matchingBracketBackground: withAlpha(t.textAccent, 0.2),
          matchingBracketBorder: t.textAccent,
        },
        elements: {
          link: t.linkForeground,
          linkActive: t.linkHoverForeground,
          focused: t.focusRing,
          panel: t.sidebarBackground,
          toolbar: t.titleBarBackground,
        },
        network: {
          response: status.success,
          webSocketFrame: status.warning,
          chunk: t.cyan,
          file: t.textPrimary,
        },
        perf: {
          glass: status.success,
          memory: t.cyan,
          heap: t.textPrimary,
          native: status.warning,
        },
      },
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
