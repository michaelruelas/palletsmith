// ─── Color Primitives ─────────────────────────────────────────

/** Hex color string, with or without # prefix. May include alpha channel (e.g. #62D49133). */
export type ColorHex = string;

export type Appearance = "dark" | "light";

// ─── User Input: Palette ──────────────────────────────────────

/**
 * The 13 colors a user provides. All hex strings.
 * These are the minimum viable input for a complete theme.
 */
export interface Palette {
  /** Primary editor/canvas background. Dark for dark themes, light for light. */
  bg: ColorHex;
  /** Panel, sidebar, card surface color. Slightly different from bg. */
  surface: ColorHex;
  /** Selection/highlight background. Semi-transparent often. */
  selection: ColorHex;
  /** Border color for panels, inputs, dividers. */
  border: ColorHex;
  /** Muted/placeholder text, secondary UI elements. */
  muted: ColorHex;
  /** Primary text color. High contrast against bg. */
  text: ColorHex;
  /** Brand accent. Keywords, links, focus rings, active states. */
  accent: ColorHex;
  /** Semantic red. Errors, deletions, tags. */
  red: ColorHex;
  /** Semantic orange. Warmth, warnings (mild), decorators. */
  orange: ColorHex;
  /** Semantic yellow. Warnings, markdown headings, search matches. */
  yellow: ColorHex;
  /** Semantic green. Strings, success, additions. */
  green: ColorHex;
  /** Semantic cyan. Support, regex, escape chars, markdown quotes. */
  cyan: ColorHex;
  /** Semantic blue. Functions, methods, links, info. */
  blue: ColorHex;
  /** Semantic magenta/purple. Keywords, storage, constants. */
  magenta: ColorHex;
}

// ─── Intermediate: Color in different spaces ──────────────────

export interface RGB {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
}

export interface RGBA extends RGB {
  a: number; // 0–1
}

export interface HSL {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

// ─── Base24 Slotting ──────────────────────────────────────────

/**
 * All 24 Base24 color slots, fully derived from the user palette.
 * base00-base07: neutral ramp (dark→light in dark themes, light→dark in light)
 * base08-base0F: accent colors
 * base10-base11: extra background depths
 * base12-base17: bright accent variants (for terminal ANSI)
 */
export interface Base24Slots {
  appearance: Appearance;
  scheme: string;
  author: string;

  // Neutral ramp (background → foreground)
  base00: ColorHex; // Default Background
  base01: ColorHex; // Lighter Background (panels)
  base02: ColorHex; // Selection Background
  base03: ColorHex; // Comments, Invisibles, Muted text
  base04: ColorHex; // Dark Foreground (status bar items)
  base05: ColorHex; // Default Foreground (primary text)
  base06: ColorHex; // Light Foreground
  base07: ColorHex; // Lightest Foreground

  // Accent colors
  base08: ColorHex; // Red (variables, errors)
  base09: ColorHex; // Orange (numbers, constants)
  base0A: ColorHex; // Yellow (classes, search, warnings)
  base0B: ColorHex; // Green (strings, success)
  base0C: ColorHex; // Cyan (support, regex)
  base0D: ColorHex; // Blue (functions, info, links)
  base0E: ColorHex; // Magenta/Purple (keywords, storage)
  base0F: ColorHex; // Deprecated/Brown (legacy, deprecated)

  // Extra background depths (for 3D layering effects)
  base10: ColorHex; // Darker Background variant
  base11: ColorHex; // Darkest Background variant

  // Bright accent variants (for terminal bold/emphasis — ANSI 8-15)
  base12: ColorHex; // Bright Red
  base13: ColorHex; // Bright Yellow
  base14: ColorHex; // Bright Green
  base15: ColorHex; // Bright Cyan
  base16: ColorHex; // Bright Blue
  base17: ColorHex; // Bright Magenta
}

// ─── Semantic UI Tokens ───────────────────────────────────────

export interface SemanticTokens {
  // Background hierarchy
  /** Deepest background — editor canvas */
  background: ColorHex;
  /** Panel/sidebar/surface backgrounds */
  surface: ColorHex;
  /** Elevated surfaces (dropdowns, modals, popovers) */
  elevatedSurface: ColorHex;
  /** Overlay/modal backdrop */
  overlay: ColorHex;

  // Borders
  /** Default border for panels, inputs, containers */
  border: ColorHex;
  /** Muted/subtle border for dividers, separators */
  borderMuted: ColorHex;
  /** Focused/brand border for active elements */
  borderFocused: ColorHex;
  /** Selected border for toggled/active elements */
  borderSelected: ColorHex;

  // Text
  /** Primary text on backgrounds */
  textPrimary: ColorHex;
  /** Muted/secondary text */
  textMuted: ColorHex;
  /** Placeholder text */
  textPlaceholder: ColorHex;
  /** Accent/brand text (links, emphasis) */
  textAccent: ColorHex;
  /** Disabled text */
  textDisabled: ColorHex;

  // Icons
  /** Primary icon color */
  iconPrimary: ColorHex;
  /** Muted icon color (secondary actions) */
  iconMuted: ColorHex;
  /** Accent icon color (active states) */
  iconAccent: ColorHex;

  // Interactive states
  /** Selection/highlight background */
  selectionBackground: ColorHex;
  /** Hover state background */
  hoverBackground: ColorHex;
  /** Active/pressed state background */
  activeBackground: ColorHex;
  /** Focus ring/outline color */
  focusRing: ColorHex;

  // Editor-specific
  /** Editor text area background */
  editorBackground: ColorHex;
  /** Editor primary text color */
  editorForeground: ColorHex;
  /** Editor gutter line numbers */
  editorLineNumber: ColorHex;
  /** Active line number (cursor line) */
  editorActiveLineNumber: ColorHex;
  /** Editor gutter background */
  editorGutterBackground: ColorHex;
  /** Editor indent guide lines */
  editorIndentGuide: ColorHex;
  /** Active indent guide line */
  editorActiveIndentGuide: ColorHex;

  // Navigation
  tabActiveBackground: ColorHex;
  tabInactiveBackground: ColorHex;
  tabBarBackground: ColorHex;
  titleBarBackground: ColorHex;
  statusBarBackground: ColorHex;
  activityBarBackground: ColorHex;
  activityBarForeground: ColorHex;
  sidebarBackground: ColorHex;

  // Scrollbar
  scrollbarThumb: ColorHex;
  scrollbarThumbHover: ColorHex;
  scrollbarTrack: ColorHex;

  // Panel
  panelBackground: ColorHex;
  panelBorder: ColorHex;

  // Inputs
  inputBackground: ColorHex;
  inputBorder: ColorHex;
  inputForeground: ColorHex;
  dropdownBackground: ColorHex;
  dropdownBorder: ColorHex;

  // Buttons
  buttonBackground: ColorHex;
  buttonForeground: ColorHex;
  buttonHoverBackground: ColorHex;

  // Links & status
  linkForeground: ColorHex;
  linkHoverForeground: ColorHex;
  errorForeground: ColorHex;
  warningForeground: ColorHex;
  infoForeground: ColorHex;
  successForeground: ColorHex;
}

// ─── Syntax Tokens ────────────────────────────────────────────

export interface SyntaxTokenStyle {
  color: ColorHex;
  fontStyle?: "italic" | "normal";
  fontWeight?: number;
}

export interface SyntaxTokens {
  comment: SyntaxTokenStyle;
  commentDoc: SyntaxTokenStyle;
  commentTodo: SyntaxTokenStyle;
  commentError: SyntaxTokenStyle;
  commentWarning: SyntaxTokenStyle;
  commentNote: SyntaxTokenStyle;
  commentHint: SyntaxTokenStyle;
  string: SyntaxTokenStyle;
  stringEscape: SyntaxTokenStyle;
  stringRegex: SyntaxTokenStyle;
  stringSpecial: SyntaxTokenStyle;
  stringSpecialUrl: SyntaxTokenStyle;
  stringSpecialPath: SyntaxTokenStyle;
  stringSpecialSymbol: SyntaxTokenStyle;
  number: SyntaxTokenStyle;
  boolean: SyntaxTokenStyle;
  constant: SyntaxTokenStyle;
  constantBuiltin: SyntaxTokenStyle;
  constantMacro: SyntaxTokenStyle;
  keyword: SyntaxTokenStyle;
  keywordControl: SyntaxTokenStyle;
  keywordConditional: SyntaxTokenStyle;
  keywordRepeat: SyntaxTokenStyle;
  keywordReturn: SyntaxTokenStyle;
  keywordException: SyntaxTokenStyle;
  keywordImport: SyntaxTokenStyle;
  keywordExport: SyntaxTokenStyle;
  keywordFunction: SyntaxTokenStyle;
  keywordType: SyntaxTokenStyle;
  keywordOperator: SyntaxTokenStyle;
  function_: SyntaxTokenStyle;
  functionCall: SyntaxTokenStyle;
  functionDecorator: SyntaxTokenStyle;
  functionBuiltin: SyntaxTokenStyle;
  functionMacro: SyntaxTokenStyle;
  method: SyntaxTokenStyle;
  methodCall: SyntaxTokenStyle;
  type: SyntaxTokenStyle;
  typeBuiltin: SyntaxTokenStyle;
  typeClass: SyntaxTokenStyle;
  typeDefinition: SyntaxTokenStyle;
  typeInterface: SyntaxTokenStyle;
  variable: SyntaxTokenStyle;
  variableBuiltin: SyntaxTokenStyle;
  variableSpecial: SyntaxTokenStyle;
  variableMember: SyntaxTokenStyle;
  variableParameter: SyntaxTokenStyle;
  parameter: SyntaxTokenStyle;
  property: SyntaxTokenStyle;
  attribute: SyntaxTokenStyle;
  namespace: SyntaxTokenStyle;
  module: SyntaxTokenStyle;
  label: SyntaxTokenStyle;
  symbol: SyntaxTokenStyle;
  tag: SyntaxTokenStyle;
  tagAttribute: SyntaxTokenStyle;
  tagDelimiter: SyntaxTokenStyle;
  tagDoctype: SyntaxTokenStyle;
  punctuation: SyntaxTokenStyle;
  punctuationBracket: SyntaxTokenStyle;
  punctuationDelimiter: SyntaxTokenStyle;
  punctuationSpecial: SyntaxTokenStyle;
  punctuationListMarker: SyntaxTokenStyle;
  operator: SyntaxTokenStyle;
  preproc: SyntaxTokenStyle;
  embedded: SyntaxTokenStyle;
  diffPlus: SyntaxTokenStyle;
  diffMinus: SyntaxTokenStyle;
  linkText: SyntaxTokenStyle;
  linkUri: SyntaxTokenStyle;
  emphasis: SyntaxTokenStyle;
  emphasisStrong: SyntaxTokenStyle;
  textLiteral: SyntaxTokenStyle;
  character: SyntaxTokenStyle;
  characterSpecial: SyntaxTokenStyle;
  concept: SyntaxTokenStyle;
  variant: SyntaxTokenStyle;
  enum_: SyntaxTokenStyle;
  title: SyntaxTokenStyle;
}

// ─── Terminal ANSI Palette ────────────────────────────────────

export interface TerminalPalette {
  background: ColorHex;
  foreground: ColorHex;
  cursor: ColorHex;
  cursorAccent: ColorHex;
  selectionBackground: ColorHex;
  selectionForeground: ColorHex;

  // 16 ANSI colors (indices 0–15)
  black: ColorHex;
  red: ColorHex;
  green: ColorHex;
  yellow: ColorHex;
  blue: ColorHex;
  magenta: ColorHex;
  cyan: ColorHex;
  white: ColorHex;
  brightBlack: ColorHex;
  brightRed: ColorHex;
  brightGreen: ColorHex;
  brightYellow: ColorHex;
  brightBlue: ColorHex;
  brightMagenta: ColorHex;
  brightCyan: ColorHex;
  brightWhite: ColorHex;
}

// ─── Status Colors ────────────────────────────────────────────

export interface StatusColors {
  info: ColorHex;
  infoBackground: ColorHex;
  success: ColorHex;
  successBackground: ColorHex;
  warning: ColorHex;
  warningBackground: ColorHex;
  error: ColorHex;
  errorBackground: ColorHex;
}

// ─── Player / Collaborator Cursors ────────────────────────────

export interface PlayerColor {
  cursor: ColorHex;
  background: ColorHex;
  selection: ColorHex;
}

export type PlayerColors = PlayerColor[]; // exactly 8 entries

// ─── Master Schema (the full contract) ────────────────────────

/**
 * The complete derived theme — this is what gets passed to every plugin.
 * All fields are fully resolved hex colors.
 */
export interface MasterSchema {
  meta: {
    name: string;
    author: string;
    appearance: Appearance;
    version: string;
    /** The original palette the user supplied */
    basePalette: Palette;
  };
  /** Base24 slots (24 colors, including bright variants) */
  base24: Base24Slots;
  /** Derived semantic UI tokens (~45 tokens) */
  tokens: SemanticTokens;
  /** Derived syntax highlighting tokens (~75 tokens) */
  syntax: SyntaxTokens;
  /** Derived terminal ANSI palette (18 values) */
  terminal: TerminalPalette;
  /** Derived status indicator colors (8 values) */
  status: StatusColors;
  /** Derived collaborator cursor colors (8 entries) */
  players: PlayerColors;
}
