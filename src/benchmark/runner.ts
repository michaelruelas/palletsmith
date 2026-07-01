import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { deriveBase24 } from "../core/derive.js";
import { expandMasterSchema } from "../core/expand.js";
import { hexToRgb, rgbToHsl, relativeLuminance } from "../core/color.js";
import { internalRegistry } from "../plugins/apps/index.js";
import type { MasterSchema, Palette } from "../core/types.js";
import type { PluginInput } from "../plugins/types.js";
import { draculaPreset } from "../presets/dracula.js";
import { oneDarkPreset } from "../presets/onedark.js";
import { evergreenPreset } from "../presets/evergreen.js";
import { githubPreset } from "../presets/github.js";
import type { PresetPack } from "../presets/index.js";

// ─── Constants ─────────────────────────────────────────────

/** Distance at which closeness % reaches 0 (max RGB Euclidean = 441.67) */
const MAX_CLOSENESS_DIST = 150;

const BUCKET_DEFS = [
  { label: "exact",    minDist: 0,   maxDist: 0    },
  { label: "near",     minDist: 0.1, maxDist: 2    },
  { label: "close",    minDist: 2.1, maxDist: 10   },
  { label: "moderate", minDist: 10.1,maxDist: 50   },
  { label: "far",      minDist: 50.1,maxDist: 442  },
] as const;

// ─── Data Types ────────────────────────────────────────────

interface ColorDelta {
  key: string;
  expected: string;
  actual: string;
  distance: number;
  closeness: number;
  deltaR: number;
  deltaG: number;
  deltaB: number;
  deltaH: number;
  deltaS: number;
  deltaL: number;
  luminanceDelta: number;
}

interface Bucket {
  label: string;
  minDist: number;
  maxDist: number;
  count: number;
  keys: string[];
}

interface CategoryStats {
  count: number;
  meanDistance: number;
  meanCloseness: number;
}

interface DetailedComparison {
  overallCloseness: number;
  meanDistance: number;
  medianDistance: number;
  maxDistance: number;
  minDistance: number;
  stdDevDistance: number;
  total: number;
  exactCount: number;
  nearCount: number;
  closeCount: number;
  buckets: Bucket[];
  deltas: ColorDelta[];
  worstKeys: ColorDelta[];
  bestKeys: ColorDelta[];
  byCategory: Record<string, CategoryStats>;
}

interface AppResult {
  keys: number;
  comparison?: DetailedComparison;
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

// ─── Setup ─────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(__dirname, "../../test/mapping/fixtures");

const PRESET_PACKS: PresetPack[] = [
  draculaPreset,
  oneDarkPreset,
  evergreenPreset,
  githubPreset,
];

// ─── Master Schema Builder ─────────────────────────────────

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

// ─── Key Counting ──────────────────────────────────────────

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

// ─── Color Delta Engine ────────────────────────────────────

function categorizeKey(key: string): string {
  const dot = key.indexOf(".");
  return dot === -1 ? "general" : key.slice(0, dot);
}

function computeColorDelta(
  key: string,
  expected: string,
  actual: string,
): ColorDelta {
  const eRgb = hexToRgb(expected);
  const aRgb = hexToRgb(actual);

  const dr = aRgb.r - eRgb.r;
  const dg = aRgb.g - eRgb.g;
  const db = aRgb.b - eRgb.b;

  const distance = Math.sqrt(dr * dr + dg * dg + db * db);
  const closeness = Math.round(100 * Math.max(0, 1 - distance / MAX_CLOSENESS_DIST));

  const eHsl = rgbToHsl(eRgb);
  const aHsl = rgbToHsl(aRgb);

  const eLum = relativeLuminance(eRgb);
  const aLum = relativeLuminance(aRgb);

  return {
    key,
    expected: expected.toLowerCase(),
    actual: actual.toLowerCase(),
    distance: Math.round(distance * 100) / 100,
    closeness,
    deltaR: dr,
    deltaG: dg,
    deltaB: db,
    deltaH: aHsl.h - eHsl.h,
    deltaS: aHsl.s - eHsl.s,
    deltaL: aHsl.l - eHsl.l,
    luminanceDelta: Math.abs(aLum - eLum),
  };
}

function buildBuckets(deltas: ColorDelta[]): Bucket[] {
  return BUCKET_DEFS.map((def) => {
    const keys = deltas
      .filter((d) => d.distance >= def.minDist && d.distance <= def.maxDist)
      .map((d) => d.key);
    return { ...def, count: keys.length, keys };
  });
}

function buildCategoryStats(deltas: ColorDelta[]): Record<string, CategoryStats> {
  const grouped: Record<string, number[]> = {};
  for (const d of deltas) {
    const cat = categorizeKey(d.key);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(d.distance);
  }

  const result: Record<string, CategoryStats> = {};
  for (const [cat, dists] of Object.entries(grouped)) {
    const count = dists.length;
    const meanDistance = dists.reduce((s, d) => s + d, 0) / count;
    const meanCloseness = dists
      .map((d) => Math.round(100 * Math.max(0, 1 - d / MAX_CLOSENESS_DIST)))
      .reduce((s, c) => s + c, 0) / count;
    result[cat] = {
      count,
      meanDistance: Math.round(meanDistance * 100) / 100,
      meanCloseness: Math.round(meanCloseness * 100) / 100,
    };
  }
  return result;
}

function computeDetailedComparison(
  generated: Record<string, string>,
  fixture: Record<string, string>,
): DetailedComparison {
  const common = Object.keys(generated).filter((k) => k in fixture);
  const deltas: ColorDelta[] = [];

  for (const key of common) {
    const expected = fixture[key]!;
    const actual = generated[key]!;
    if (!expected.startsWith("#") || !actual.startsWith("#")) continue;
    deltas.push(computeColorDelta(key, expected, actual));
  }

  const distances = deltas.map((d) => d.distance);
  const closenesses = deltas.map((d) => d.closeness);
  const total = deltas.length;

  const exactCount = deltas.filter((d) => d.distance === 0).length;
  const nearCount = deltas.filter((d) => d.distance > 0 && d.distance <= 2).length;
  const closeCount = deltas.filter((d) => d.distance > 2 && d.distance <= 10).length;

  const overallCloseness = total > 0
    ? Math.round(closenesses.reduce((s, c) => s + c, 0) / total)
    : 0;

  const meanDistance = total > 0
    ? distances.reduce((s, d) => s + d, 0) / total
    : 0;

  const sorted = [...distances].sort((a, b) => a - b);
  const medianDistance = total > 0
    ? total % 2 === 0
      ? (sorted[total / 2 - 1]! + sorted[total / 2]!) / 2
      : sorted[Math.floor(total / 2)]!
    : 0;

  const maxDistance = total > 0 ? Math.max(...distances) : 0;
  const minDistance = total > 0 ? Math.min(...distances) : 0;

  const variance = total > 0
    ? distances.reduce((s, d) => s + (d - meanDistance) ** 2, 0) / total
    : 0;
  const stdDevDistance = Math.sqrt(variance);

  const buckets = buildBuckets(deltas);

  const sortedDeltas = [...deltas].sort((a, b) => b.distance - a.distance);
  const worstKeys = sortedDeltas.slice(0, 10);
  const bestKeys = [...deltas]
    .filter((d) => d.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  const byCategory = buildCategoryStats(deltas);

  return {
    overallCloseness,
    meanDistance: Math.round(meanDistance * 100) / 100,
    medianDistance: Math.round(medianDistance * 100) / 100,
    maxDistance: Math.round(maxDistance * 100) / 100,
    minDistance: Math.round(minDistance * 100) / 100,
    stdDevDistance: Math.round(stdDevDistance * 100) / 100,
    total,
    exactCount,
    nearCount,
    closeCount,
    buckets,
    deltas,
    worstKeys,
    bestKeys,
    byCategory,
  };
}

// ─── Fixture Loaders ───────────────────────────────────────

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
): DetailedComparison | null {
  try {
    const gen = JSON.parse(generatedContent);
    const genStyle = gen.themes?.[0]?.style;
    if (!genStyle) return null;
    const genFlat = flattenZedStyle(genStyle);
    return computeDetailedComparison(genFlat, fixtureColors);
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
): DetailedComparison | null {
  const gen = parseGhosttyConfig(generatedContent);
  return computeDetailedComparison(gen, fixtureColors);
}

// ─── Console Report ────────────────────────────────────────

const W = 68;

function pct(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function printDetailedReport(
  themeName: string,
  appId: string,
  cmp: DetailedComparison,
): void {
  const bar = "─".repeat(W);

  console.error(`\n  ┌${bar}┐`);
  console.error(`  │  ${themeName}  ×  ${appId.toUpperCase()}`);
  console.error(`  └${bar}┘`);

  console.error(`\n    Overall Closeness:  ${cmp.overallCloseness}%`);
  console.error(`    Mean Distance:      ${cmp.meanDistance}`);
  console.error(`    Median Distance:    ${cmp.medianDistance}`);
  console.error(`    Std Dev:            ${cmp.stdDevDistance}`);
  console.error(`    Range:              ${cmp.minDistance} – ${cmp.maxDistance}`);
  console.error(`    Keys Compared:      ${cmp.total}`);

  const maxCount = Math.max(...cmp.buckets.map((b) => b.count), 1);
  const bw = 36;
  console.error(`\n    Distribution:`);
  for (const bucket of cmp.buckets) {
    const pc = cmp.total > 0 ? ((bucket.count / cmp.total) * 100).toFixed(1) : "0.0";
    const fill = Math.round((bucket.count / maxCount) * bw);
    const barStr = "▓".repeat(fill) + "░".repeat(Math.max(0, bw - fill));
    const label = `${bucket.label}:`.padEnd(10);
    console.error(`      ${label} ${barStr}  ${String(bucket.count).padStart(3)} (${pc}%)`);
  }

  if (cmp.deltas.length === 0) return;

  const worst = cmp.worstKeys.slice(0, 5).filter((d) => d.distance > 0);
  if (worst.length > 0) {
    console.error(`\n    Worst Mismatches (top ${worst.length}):`);
    for (const d of worst) {
      const key = d.key.length > 50 ? d.key.slice(0, 47) + "..." : d.key;
      console.error(`      ${key.padEnd(50)} ${d.expected}  →  ${d.actual}`);
      console.error(`      ${" ".repeat(50)} RGB Δr=${sign(d.deltaR)} Δg=${sign(d.deltaG)} Δb=${sign(d.deltaB)}`);
      console.error(`      ${" ".repeat(50)} HSL Δh=${sign(d.deltaH)}° Δs=${sign(d.deltaS)}% Δl=${sign(d.deltaL)}%`);
      console.error(`      ${" ".repeat(50)} distance=${d.distance}  closeness=${d.closeness}%  lumaΔ=${d.luminanceDelta.toFixed(4)}`);
    }
  }

  const cats = Object.entries(cmp.byCategory)
    .sort((a, b) => a[1].meanCloseness - b[1].meanCloseness);
  const attention = cats.filter(([, s]) => s.meanCloseness < 70);
  const ok = cats.filter(([, s]) => s.meanCloseness >= 70);

  if (cats.length > 0) {
    console.error(`\n    Category Breakdown:`);
    for (const [cat, stats] of cats) {
      const marker = stats.meanCloseness < 70 ? "  ← needs attention" : "";
      console.error(
        `      ${cat.padEnd(16)} ${String(stats.count).padStart(3)} keys  μ=${String(stats.meanDistance).padStart(7)}  closeness=${String(stats.meanCloseness).padStart(5)}%${marker}`,
      );
    }
  }

  if (attention.length > 0) {
    console.error(`\n    🎯 Action Items — categories below 70% closeness:`);
    for (const [cat, stats] of attention) {
      console.error(`       - ${cat} (${stats.count} keys, μ=${stats.meanDistance}, closeness=${stats.meanCloseness}%)`);
    }
  }

  if (ok.length > 0) {
    console.error(`\n    ✅ Strong categories (≥70% closeness):`);
    for (const [cat, stats] of ok) {
      console.error(`       - ${cat} (${stats.count} keys, closeness=${stats.meanCloseness}%)`);
    }
  }

  console.error();
}

// ─── Main Runner ───────────────────────────────────────────

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
            result.comparison = computeDetailedComparison(vscOutput.colors, fixture);
          }
        }

        if (id === "zed") {
          const fixture = tryLoadZedFixture(theme.name);
          if (fixture) {
            const cmp = compareZedThemes(outputs[0]!.content, fixture);
            if (cmp) result.comparison = cmp;
          }
        }

        if (id === "ghostty") {
          const fixture = tryLoadGhosttyFixture(theme.name);
          if (fixture) {
            const cmp = compareGhosttyThemes(outputs[0]!.content, fixture);
            if (cmp) result.comparison = cmp;
          }
        }

        appResults[id] = result;
      }

      for (const [id, result] of Object.entries(appResults)) {
        if (result.comparison) {
          printDetailedReport(theme.name, id, result.comparison);
        }
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
  console.error(`\nResults written to ${outPath}`);
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
