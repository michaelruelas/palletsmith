import type { Palette } from "./types.js";
import { normalizeHex } from "./color.js";

export interface ThemeSmithConfig {
  name: string;
  author: string;
  version: string;
  palette: string | Palette;
  apps: Record<string, AppConfig>;
  overrides?: { tokens?: Record<string, string> };
}

export interface AppConfig {
  output: string;
  config?: Record<string, unknown>;
}

export async function resolvePalette(paletteRef: string | Palette): Promise<Palette> {
  if (typeof paletteRef !== "string") return paletteRef as Palette;

  const fs = await import("fs");
  const path = await import("path");
  const yaml = await import("js-yaml");

  const resolvedPath = path.resolve(paletteRef);
  const content = fs.readFileSync(resolvedPath, "utf-8");

  let parsed: Record<string, unknown>;
  if (paletteRef.endsWith(".yaml") || paletteRef.endsWith(".yml")) {
    parsed = yaml.load(content) as Record<string, unknown>;
  } else if (paletteRef.endsWith(".json")) {
    parsed = JSON.parse(content);
  } else {
    throw new Error(`Unsupported palette format: ${paletteRef}. Use .yml, .yaml, or .json.`);
  }

  return paletteFromRecord(parsed);
}

export function paletteFromRecord(record: Record<string, unknown>): Palette {
  const raw = (record.palette ?? record) as Record<string, unknown>;

  return {
    bg: normalizeHex(String(raw.bg ?? raw.background ?? "")),
    surface: normalizeHex(String(raw.surface ?? "")),
    selection: normalizeHex(String(raw.selection ?? "")),
    border: normalizeHex(String(raw.border ?? "")),
    muted: normalizeHex(String(raw.muted ?? "")),
    text: normalizeHex(String(raw.text ?? "")),
    accent: normalizeHex(String(raw.accent ?? "")),
    red: normalizeHex(String(raw.red ?? "")),
    orange: normalizeHex(String(raw.orange ?? "")),
    yellow: normalizeHex(String(raw.yellow ?? "")),
    green: normalizeHex(String(raw.green ?? "")),
    cyan: normalizeHex(String(raw.cyan ?? "")),
    blue: normalizeHex(String(raw.blue ?? "")),
    magenta: normalizeHex(String(raw.magenta ?? "")),
  };
}

export async function loadConfig(configPath?: string): Promise<ThemeSmithConfig> {
  const path = await import("path");
  const fs = await import("fs");
  const yaml = await import("js-yaml");

  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), "themesmith.yml");

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config not found: ${resolvedPath}. Create themesmith.yml or use --config.`);
  }

  const content = fs.readFileSync(resolvedPath, "utf-8");
  const parsed = yaml.load(content) as Record<string, unknown>;

  return {
    name: String(parsed.name ?? "Untitled Theme"),
    author: String(parsed.author ?? "Unknown"),
    version: String(parsed.version ?? "1.0.0"),
    palette: parsed.palette as string | Palette,
    apps: parsed.apps as Record<string, AppConfig>,
    overrides: parsed.overrides as { tokens?: Record<string, string> } | undefined,
  };
}
