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
import type { PresetPack } from "../presets/index.js";

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

const PRESET_PACKS: PresetPack[] = [
  draculaPreset,
  oneDarkPreset,
  evergreenPreset,
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

function compareVscodeThemes(generated: Record<string, string>, official: Record<string, string>): { score: number; total: number; matched: number; closeCount: number; exactCount: number } {
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

function tryLoadVscodeFixture(themeName: string): Record<string, string> | null {
  const slug = themeName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const fixturePath = resolve(__dirname, "../../test/mapping/fixtures");

  const candidates = [
    resolve(fixturePath, `${slug}.json`),
  ];

  for (const fp of candidates) {
    if (existsSync(fp)) {
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
  }
  return null;
}

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
            const comparison = compareVscodeThemes(vscOutput.colors, fixture);
            result.score = comparison.score;
            result.total = comparison.total;
            result.matched = comparison.matched;
            result.closeCount = comparison.closeCount;
            result.exactCount = comparison.exactCount;
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
