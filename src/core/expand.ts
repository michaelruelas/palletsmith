import type {
  Base24Slots,
  SemanticTokens,
  SyntaxTokens,
  SyntaxTokenStyle,
  TerminalPalette,
  StatusColors,
  PlayerColor,
  PlayerColors,
  ColorHex,
  Palette,
} from "./types.js";
import {
  hexToRgb,
  rgbToHex,
  hexToRgba,
  rgbToHsl,
  hslToRgb,
  blend,
  lighten,
  darken,
  saturate,
  withAlpha,
  relativeLuminance,
} from "./color.js";

/**
 * Expand Base24 slots into the full MasterSchema.
 */
export function expandMasterSchema(
  base24: Base24Slots,
  accent: ColorHex,
  palette: Palette
): {
  tokens: SemanticTokens;
  syntax: SyntaxTokens;
  terminal: TerminalPalette;
  status: StatusColors;
  players: PlayerColors;
} {
  const isDark = base24.appearance === "dark";

  return {
    tokens: deriveSemanticTokens(base24, accent, isDark),
    syntax: deriveSyntaxTokens(base24, isDark),
    terminal: deriveTerminalPalette(base24, accent, isDark),
    status: deriveStatusColors(base24, accent, isDark),
    players: derivePlayerColors(accent),
  };
}

// ─── Semantic UI Tokens ───────────────────────────────────────

function deriveSemanticTokens(
  b: Base24Slots,
  accent: ColorHex,
  isDark: boolean
): SemanticTokens {
  return {
    // Background hierarchy
    background: b.base00,
    surface: b.base01,
    elevatedSurface: isDark ? lighten(b.base01, 3) : darken(b.base01, 3),
    overlay: isDark ? withAlpha(b.base11, 0.8) : withAlpha(b.base11, 0.15),

    // Borders
    border: b.base02,
    borderMuted: isDark ? lighten(b.base02, 5) : darken(b.base02, 5),
    borderFocused: accent,
    borderSelected: b.base02,

    // Text
    textPrimary: b.base05,
    textMuted: b.base03,
    textPlaceholder: isDark ? lighten(b.base03, 10) : darken(b.base03, 10),
    textAccent: accent,
    textDisabled: blend(b.base03, b.base00, 0.5),

    // Icons
    iconPrimary: b.base05,
    iconMuted: b.base03,
    iconAccent: accent,

    // Interactive states
    selectionBackground: blend(accent, b.base00, 0.24),
    hoverBackground: blend(b.base05, b.base00, isDark ? 0.08 : 0.06),
    activeBackground: blend(b.base05, b.base00, isDark ? 0.12 : 0.10),
    focusRing: blend(accent, b.base00, 0.6),

    // Editor
    editorBackground: b.base00,
    editorForeground: b.base05,
    editorLineNumber: blend(b.base05, b.base00, 0.3),
    editorActiveLineNumber: b.base05,
    editorGutterBackground: b.base00,
    editorIndentGuide: blend(b.base03, b.base00, isDark ? 0.3 : 0.5),
    editorActiveIndentGuide: blend(b.base03, b.base00, isDark ? 0.5 : 0.7),

    // Navigation
    tabActiveBackground: isDark ? lighten(b.base00, 4) : darken(b.base00, 3),
    tabInactiveBackground: b.base00,
    tabBarBackground: b.base00,
    titleBarBackground: b.base00,
    statusBarBackground: b.base01,
    activityBarBackground: b.base01,
    activityBarForeground: b.base05,
    sidebarBackground: b.base01,

    // Scrollbar
    scrollbarThumb: blend(b.base03, b.base00, 0.19),
    scrollbarThumbHover: blend(b.base03, b.base00, 0.38),
    scrollbarTrack: b.base00,

    // Panel
    panelBackground: b.base00,
    panelBorder: b.base02,

    // Inputs
    inputBackground: b.base01,
    inputBorder: b.base02,
    inputForeground: b.base05,
    dropdownBackground: b.base01,
    dropdownBorder: b.base02,

    // Buttons
    buttonBackground: blend(b.base02, b.base01, isDark ? 0.6 : 0.4),
    buttonForeground: getAccessibleForeground(accent, b.base00, b.base05),
    buttonHoverBackground: accent,

    // Links & status
    linkForeground: accent,
    linkHoverForeground: isDark ? lighten(accent, 10) : darken(accent, 10),
    errorForeground: b.base08,
    warningForeground: b.base0A,
    infoForeground: b.base0D,
    successForeground: b.base0B,
  };
}

/**
 * Pick the best readable foreground color against a background.
 * Returns the one with higher contrast (WCAG).
 */
function getAccessibleForeground(
  bg: ColorHex,
  dark: ColorHex,
  light: ColorHex
): ColorHex {
  const withDark = relativeLuminance(hexToRgb(bg));
  const withLight = 1 - withDark; // approximate
  return withDark > withLight ? dark : light;
}

// ─── Syntax Tokens ────────────────────────────────────────────

function deriveSyntaxTokens(b: Base24Slots, isDark: boolean): SyntaxTokens {
  const text = b.base05;
  const comment = b.base03;
  const accent = b.base0E;   // magenta/purple (keywords)
  const red = b.base08;      // red (tags, errors)
  const orange = b.base09;   // orange (numbers, decorators)
  const yellow = b.base0A;   // yellow (classes, warnings)
  const green = b.base0B;    // green (strings)
  const cyan = b.base0C;     // cyan (support, regex)
  const blue = b.base0D;     // blue (functions, links)

  const italic = { fontStyle: "italic" as const };
  const normal = {} as Partial<SyntaxTokenStyle>;
  const strong = { fontWeight: 700 as const };

  function style(color: ColorHex, extra?: Partial<SyntaxTokenStyle>): SyntaxTokenStyle {
    return { color, fontStyle: extra?.fontStyle, fontWeight: extra?.fontWeight };
  }

  return {
    // Comments
    comment:       style(comment, italic),
    commentDoc:    style(isDark ? lighten(comment, -5) : darken(comment, -5), italic),
    commentTodo:   style(yellow),
    commentError:  style(red),
    commentWarning: style(yellow),
    commentNote:   style(green),
    commentHint:   style(green),

    // Strings
    string:              style(green),
    stringEscape:        style(isDark ? lighten(green, 12) : darken(green, 12)),
    stringRegex:         style(cyan),
    stringSpecial:       style(green),
    stringSpecialUrl:    style(cyan),
    stringSpecialPath:   style(yellow),
    stringSpecialSymbol: style(yellow),

    // Numbers & constants
    number:         style(orange),
    boolean:        style(orange),
    constant:       style(orange),
    constantBuiltin: style(orange),
    constantMacro:  style(orange),

    // Keywords
    keyword:             style(accent),
    keywordControl:      style(accent),
    keywordConditional:  style(accent),
    keywordRepeat:       style(accent),
    keywordReturn:       style(accent),
    keywordException:    style(accent),
    keywordImport:       style(accent),
    keywordExport:       style(accent),
    keywordFunction:     style(accent),
    keywordType:         style(accent),
    keywordOperator:     style(comment),

    // Functions
    function_:          style(blue),
    functionCall:       style(blue),
    functionDecorator:  style(yellow),
    functionBuiltin:    style(blue),
    functionMacro:      style(accent),
    method:             style(blue),
    methodCall:         style(blue),

    // Types
    type:              style(green),
    typeBuiltin:       style(green),
    typeClass:         style(green),
    typeDefinition:    style(green),
    typeInterface:     style(green),

    // Variables
    variable:            style(text),
    variableBuiltin:     style(red),
    variableSpecial:     style(green),
    variableMember:      style(text),
    variableParameter:   style(text),
    parameter:           style(text),

    // Properties & attributes
    property:    style(text),
    attribute:   style(yellow),

    // Namespaces & modules
    namespace: style(yellow),
    module:    style(accent),
    label:     style(text),
    symbol:    style(text),

    // Tags (HTML/JSX)
    tag:          style(red),
    tagAttribute: style(yellow),
    tagDelimiter: style(comment),
    tagDoctype:   style(comment),

    // Punctuation & operators
    punctuation:            style(comment),
    punctuationBracket:     style(isDark ? lighten(comment, 15) : darken(comment, 15)),
    punctuationDelimiter:   style(comment),
    punctuationSpecial:     style(comment),
    punctuationListMarker:  style(comment),
    operator:               style(comment),

    // Preprocessor
    preproc: style(accent),
    embedded: style(text),

    // Diffs
    diffPlus:  style(green),
    diffMinus: style(red),

    // Links
    linkText: style(green),
    linkUri:  style(cyan),

    // Emphasis / markup
    emphasis:       style(text, italic),
    emphasisStrong: style(text, strong),
    textLiteral:    style(green),

    // Characters
    character:        style(green),
    characterSpecial: style(accent),

    // Meta
    concept: style(accent),
    variant: style(text),
    enum_:   style(green),
    title:   style(yellow),
  };
}

// ─── Terminal ANSI Palette ────────────────────────────────────

function deriveTerminalPalette(
  b: Base24Slots,
  accent: ColorHex,
  isDark: boolean
): TerminalPalette {
  return {
    background: b.base00,
    foreground: b.base05,
    cursor: accent,
    cursorAccent: getAccessibleForeground(accent, b.base00, b.base05),
    selectionBackground: blend(accent, b.base00, 0.24),
    selectionForeground: b.base05,

    // Standard ANSI (0-7)
    black:   b.base00,
    red:     b.base08,
    green:   b.base0B,
    yellow:  b.base0A,
    blue:    b.base0D,
    magenta: b.base0E,
    cyan:    b.base0C,
    white:   b.base05,

    // Bright ANSI (8-15)
    brightBlack:   b.base03,
    brightRed:     b.base12,
    brightGreen:   b.base14,
    brightYellow:  b.base13,
    brightBlue:    b.base16,
    brightMagenta: b.base17,
    brightCyan:    b.base15,
    brightWhite:   b.base07,
  };
}

// ─── Status Colors ────────────────────────────────────────────

function deriveStatusColors(
  b: Base24Slots,
  accent: ColorHex,
  isDark: boolean
): StatusColors {
  return {
    info:    b.base0D,
    infoBackground:    blend(b.base0D, b.base00, 0.2),
    success: b.base0B,
    successBackground: blend(b.base0B, b.base00, 0.2),
    warning: b.base0A,
    warningBackground: blend(b.base0A, b.base00, 0.2),
    error:   b.base08,
    errorBackground:   blend(b.base08, b.base00, 0.2),
  };
}

// ─── Player Cursors ──────────────────────────────────────────

const DEFAULT_PLAYER_HUES = [0, 30, 60, 120, 180, 240, 270, 330];

function derivePlayerColors(accent: ColorHex): PlayerColors {
  const accentHsl = rgbToHsl(hexToRgb(accent));

  return DEFAULT_PLAYER_HUES.map((hue) => {
    const cursor = rgbToHex(
      hslToRgb({
        h: hue,
        s: accentHsl.s,
        l: accentHsl.l,
      })
    );

    return {
      cursor: withAlpha(cursor, 1),
      background: withAlpha(cursor, 1),
      selection: withAlpha(cursor, 0.24),
    } satisfies PlayerColor;
  });
}
