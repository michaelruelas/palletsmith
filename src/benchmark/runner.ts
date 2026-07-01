import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { deriveBase24 } from "../core/derive.js";
import { expandMasterSchema } from "../core/expand.js";
import { internalRegistry } from "../plugins/apps/index.js";
import type { MasterSchema, Palette } from "../core/types.js";
import type { PluginInput } from "../plugins/types.js";
import { draculaPreset } from "../presets/dracula.js";
import { oneDarkPreset } from "../presets/onedark.js";
import { evergreenPreset } from "../presets/evergreen.js";
import { githubPreset } from "../presets/github.js";
import type { PresetPack } from "../presets/index.js";

interface Comparison {
  score: number;
  total: number;
  matched: number;
  closeCount: number;
  exactCount: number;
}

interface AppResult {
  keys: number;
  score?: number;
  total?: number;
  matched?: number;
  closeCount?: number;
  exactCount?: number;
}

interface ThemeResult {
  theme: string;
  appearance: string;
  apps: Record<string, AppResult>;
}

interface BenchmarkOutput {
  generatedAt: string;
  commit: string;
  results: ThemeResult[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(__dirname, "../../test/mapping/fixtures");

const PRESET_PACKS: PresetPack[] = [
  draculaPreset,
  oneDarkPreset,
  evergreenPreset,
  githubPreset,
];

function buildMasterSchema(palette: Palette, name: string): MasterSchema {
  const base24 = deriveBase24(palette);
  const accent = palette.accent;
  const { tokens, syntax, terminal, status, players } = expandMasterSchema(base24, accent, palette);
  return {
    meta: {
      name,
      author: "PalletSmith",
      appearance: base24.appearance,
      version: "1.0.0",
      basePalette: palette,
    },
    base24,
    tokens,
    syntax,
    terminal,
    status,
    players,
  };
}

function countColorKeys(content: string, format?: string): number {
  if (format === "json") {
    try {
      const obj = JSON.parse(content);
      return countLeafColorValues(obj);
    } catch {
      return content.split("\n").filter((l) => l.includes("#")).length;
    }
  }
  const lines = content.split("\n").filter((l) => l.includes("#") && l.includes("="));
  return lines.length;
}

function countLeafColorValues(obj: unknown): number {
  if (typeof obj === "string" && /^#[0-9a-fA-F]{3,8}$/.test(obj)) {
    return 1;
  }
  if (obj && typeof obj === "object") {
    let count = 0;
    for (const val of Object.values(obj as Record<string, unknown>)) {
      count += countLeafColorValues(val);
    }
    return count;
  }
  return 0;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function compareColorMaps(
  generated: Record<string, string>,
  official: Record<string, string>,
): Comparison {
  const common = Object.keys(generated).filter((k) => k in official);
  let matched = 0;
  let closeCount = 0;
  let exactCount = 0;

  for (const key of common) {
    const expected = official[key]!;
    const got = generated[key]!;
    if (!expected.startsWith("#") || !got.startsWith("#")) continue;

    const dist = colorDistance(expected, got);
    if (dist === 0) {
      exactCount++;
      matched++;
    } else if (dist <= 10) {
      closeCount++;
      matched++;
    }
  }

  return {
    score: common.length > 0 ? Math.round((matched / common.length) * 100) : 0,
    total: common.length,
    matched,
    closeCount,
    exactCount,
  };
}

// ---------- Fixture loaders ----------

function tryLoadVscodeFixture(themeName: string): Record<string, string> | null {
  const slug = themeName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const fp = resolve(FIXTURE_DIR, `${slug}_vscode.json`);
  if (!existsSync(fp)) return null;
  try {
    const raw = JSON.parse(readFileSync(fp, "utf-8"));
    const colors: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.colors as Record<string, unknown>)) {
      const vs = String(v);
      if (vs.startsWith("#")) colors[k] = vs.toLowerCase();
    }
    return colors;
  } catch {
    return null;
  }
}

function flattenZedStyle(obj: unknown, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof val === "string" && /^#[0-9a-fA-F]{3,8}$/.test(val)) {
        result[path] = val.toLowerCase();
      } else if (val && typeof val === "object" && !Array.isArray(val)) {
        Object.assign(result, flattenZedStyle(val, path));
      }
    }
  }
  return result;
}

function tryLoadZedFixture(themeName: string): Record<string, string> | null {
  const slug = themeName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const fp = resolve(FIXTURE_DIR, `${slug}_zed.json`);
  if (!existsSync(fp)) return null;
  try {
    const raw = JSON.parse(readFileSync(fp, "utf-8"));
    const style = raw.themes?.[0]?.style;
    if (!style) return null;
    return flattenZedStyle(style);
  } catch {
    return null;
  }
}

function compareZedThemes(
  generatedContent: string,
  fixtureColors: Record<string, string>,
): Comparison | null {
  try {
    const gen = JSON.parse(generatedContent);
    const genStyle = gen.themes?.[0]?.style;
    if (!genStyle) return null;
    const genFlat = flattenZedStyle(genStyle);
    return compareColorMaps(genFlat, fixtureColors);
  } catch {
    return null;
  }
}

function parseGhosttyConfig(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    let key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    if (key === "palette") {
      const parts = val.split("=") as [string, string];
      key = `palette.${parts[0]}`;
      val = parts[1]?.trim() ?? "";
    }

    if (val.startsWith("#")) {
      result[key] = val.toLowerCase();
    }
  }
  return result;
}

function tryLoadGhosttyFixture(themeName: string): Record<string, string> | null {
  const slug = themeName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const fp = resolve(FIXTURE_DIR, `${slug}_ghostty.conf`);
  if (!existsSync(fp)) return null;
  try {
    return parseGhosttyConfig(readFileSync(fp, "utf-8"));
  } catch {
    return null;
  }
}

function compareGhosttyThemes(
  generatedContent: string,
  fixtureColors: Record<string, string>,
): Comparison | null {
  const gen = parseGhosttyConfig(generatedContent);
  return compareColorMaps(gen, fixtureColors);
}

// ---------- Main ----------

async function run(): Promise<void> {
  const results: ThemeResult[] = [];

  for (const pack of PRESET_PACKS) {
    for (const theme of pack.themes) {
      const master = buildMasterSchema(theme.palette, theme.name);
      const input: PluginInput = { master, config: {} };
      const appResults: Record<string, AppResult> = {};

      for (const [id, plugin] of Object.entries(internalRegistry)) {
        const outputs = await plugin.render(input);
        let totalKeys = 0;

        for (const out of outputs) {
          totalKeys += countColorKeys(out.content, out.format);
        }

        const result: AppResult = { keys: totalKeys };

        if (id === "vscode") {
          const fixture = tryLoadVscodeFixture(theme.name);
          if (fixture) {
            const vscOutput = JSON.parse(outputs[0]!.content);
            const cmp = compareColorMaps(vscOutput.colors, fixture);
            result.score = cmp.score;
            result.total = cmp.total;
            result.matched = cmp.matched;
            result.closeCount = cmp.closeCount;
            result.exactCount = cmp.exactCount;
          }
        }

        if (id === "zed") {
          const fixture = tryLoadZedFixture(theme.name);
          if (fixture) {
            const cmp = compareZedThemes(outputs[0]!.content, fixture);
            if (cmp) {
              result.score = cmp.score;
              result.total = cmp.total;
              result.matched = cmp.matched;
              result.closeCount = cmp.closeCount;
              result.exactCount = cmp.exactCount;
            }
          }
        }

        if (id === "ghostty") {
          const fixture = tryLoadGhosttyFixture(theme.name);
          if (fixture) {
            const cmp = compareGhosttyThemes(outputs[0]!.content, fixture);
            if (cmp) {
              result.score = cmp.score;
              result.total = cmp.total;
              result.matched = cmp.matched;
              result.closeCount = cmp.closeCount;
              result.exactCount = cmp.exactCount;
            }
          }
        }

        appResults[id] = result;
      }

      results.push({
        theme: theme.name,
        appearance: theme.appearance,
        apps: appResults,
      });
    }
  }

  const commit = process.env.GITHUB_SHA || (await getLocalCommit());

  const output: BenchmarkOutput = {
    generatedAt: new Date().toISOString(),
    commit,
    results,
  };

  const json = JSON.stringify(output, null, 2);
  console.log(json);

  const outPath = resolve(__dirname, "../../benchmark/results.json");
  writeFileSync(outPath, json, "utf-8");
  console.error(`Written to ${outPath}`);
}

async function getLocalCommit(): Promise<string> {
  try {
    const proc = Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"]);
    return proc.stdout.toString().trim();
  } catch {
    return "unknown";
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
