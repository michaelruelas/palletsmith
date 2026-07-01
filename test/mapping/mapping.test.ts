import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { deriveBase24 } from "../../src/core/derive.ts";
import { expandMasterSchema } from "../../src/core/expand.ts";
import { vscodePlugin } from "../../src/plugins/apps/vscode.ts";
import type { MasterSchema, Palette } from "../../src/core/types.ts";
import { draculaPalette } from "../../src/presets/dracula.ts";
import { oneDarkPalette } from "../../src/presets/onedark.ts";
import { githubDarkPalette } from "../../src/presets/github.ts";

interface VscodeTheme {
  name: string;
  type: string;
  colors: Record<string, string>;
  tokenColors: Array<{ scope: string | string[]; settings: { foreground?: string } }>;
}

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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function normalizeFixture(theme: VscodeTheme): VscodeTheme {
  const colors: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.colors)) {
    const v = String(val);
    if (v.startsWith("#")) {
      colors[key] = v.toLowerCase();
    }
  }

  let tokenColors: VscodeTheme["tokenColors"] = [];
  for (const tc of theme.tokenColors) {
    const scopes = Array.isArray(tc.scope) ? tc.scope : [tc.scope];
    for (const scope of scopes) {
      if (tc.settings?.foreground?.startsWith("#")) {
        tokenColors.push({
          scope: scope,
          settings: { foreground: tc.settings.foreground.toLowerCase() },
        });
      }
    }
  }

  return { name: theme.name, type: theme.type, colors, tokenColors };
}

interface ComparisonResult {
  themeName: string;
  colorKeys: {
    total: number;
    matched: number;
    exact: number;
    close: number;
  };
  tokenKeys: {
    total: number;
    matched: number;
    exact: number;
    close: number;
  };
  fixtureKeysNotInGenerated: string[];
  generatedKeysNotInFixture: string[];
  mismatches: Array<{ key: string; expected: string; got: string; distance: number }>;
}

function compareThemes(
  generated: VscodeTheme,
  official: VscodeTheme,
  maxMatchDistance: number = 10,
): ComparisonResult {
  const result: ComparisonResult = {
    themeName: generated.name,
    colorKeys: { total: 0, matched: 0, exact: 0, close: 0 },
    tokenKeys: { total: 0, matched: 0, exact: 0, close: 0 },
    fixtureKeysNotInGenerated: [],
    generatedKeysNotInFixture: [],
    mismatches: [],
  };

  const officialColors = official.colors;
  const genColors = generated.colors;

  const colorKeys = Object.keys(genColors).filter((k) => k in officialColors);
  result.colorKeys.total = colorKeys.length;

  for (const key of colorKeys) {
    const expected = officialColors[key]!;
    const got = genColors[key]!;
    const dist = colorDistance(expected, got);

    if (dist === 0) {
      result.colorKeys.exact++;
      result.colorKeys.matched++;
    } else if (dist <= maxMatchDistance) {
      result.colorKeys.close++;
      result.colorKeys.matched++;
    }

    if (dist > 0) {
      result.mismatches.push({ key, expected, got, distance: Math.round(dist) });
    }
  }

  const officialColorKeys = new Set(Object.keys(officialColors));
  const genColorKeys = new Set(Object.keys(genColors));
  for (const key of genColorKeys) {
    if (!officialColorKeys.has(key)) {
      result.generatedKeysNotInFixture.push(key);
    }
  }
  for (const key of officialColorKeys) {
    if (!genColorKeys.has(key)) {
      result.fixtureKeysNotInGenerated.push(key);
    }
  }

  const officialTokenColors = official.tokenColors;
  const genTokenColors = generated.tokenColors;

  const genTokenMap = new Map<string, string>();
  for (const tc of genTokenColors) {
    const scopes = Array.isArray(tc.scope) ? tc.scope : [tc.scope];
    for (const s of scopes) {
      if (tc.settings?.foreground) {
        genTokenMap.set(String(s).toLowerCase(), tc.settings.foreground.toLowerCase());
      }
    }
  }

  const officialTokenMap = new Map<string, string>();
  for (const tc of officialTokenColors) {
    const scopes = Array.isArray(tc.scope) ? tc.scope : [tc.scope];
    for (const s of scopes) {
      if (tc.settings?.foreground) {
        officialTokenMap.set(String(s).toLowerCase(), tc.settings.foreground.toLowerCase());
      }
    }
  }

  const commonTokenScopes = [...genTokenMap.keys()].filter((k) => officialTokenMap.has(k));
  result.tokenKeys.total = commonTokenScopes.length;

  for (const scope of commonTokenScopes) {
    const expected = officialTokenMap.get(scope)!;
    const got = genTokenMap.get(scope)!;
    const dist = colorDistance(expected, got);

    if (dist === 0) {
      result.tokenKeys.exact++;
      result.tokenKeys.matched++;
    } else if (dist <= maxMatchDistance) {
      result.tokenKeys.close++;
      result.tokenKeys.matched++;
    }
  }

  return result;
}

function printResults(result: ComparisonResult): void {
  const colorScore = result.colorKeys.total > 0
    ? Math.round((result.colorKeys.matched / result.colorKeys.total) * 100)
    : 0;
  const tokenScore = result.tokenKeys.total > 0
    ? Math.round((result.tokenKeys.matched / result.tokenKeys.total) * 100)
    : 0;

  console.log(`
  ═══════════════════════════════════════════════
  ${result.themeName}
  ═══════════════════════════════════════════════
  Colors:     ${result.colorKeys.matched}/${result.colorKeys.total} matched (${colorScore}%)
              ${result.colorKeys.exact} exact, ${result.colorKeys.close} close
  Tokens:     ${result.tokenKeys.matched}/${result.tokenKeys.total} matched (${tokenScore}%)
              ${result.tokenKeys.exact} exact, ${result.tokenKeys.close} close
  `);

  if (result.mismatches.length > 0) {
    const worst = result.mismatches.toSorted((a, b) => b.distance - a.distance).slice(0, 10);
    console.log("  Top color mismatches:");
    for (const m of worst) {
      console.log(`    ${m.key.padEnd(45)} expected: ${m.expected}  got: ${m.got}  Δ: ${m.distance}`);
    }
  }

  if (result.generatedKeysNotInFixture.length > 0 && result.generatedKeysNotInFixture.length <= 10) {
    console.log(`\n  Generated keys not in fixture (${result.generatedKeysNotInFixture.length}):`);
    for (const k of result.generatedKeysNotInFixture) {
      console.log(`    ${k}`);
    }
  }
}

function generateVscodeTheme(palette: Palette, name: string): VscodeTheme {
  const master = buildMasterSchema(palette, name);
  const outputs = vscodePlugin.render({ master, config: {} });
  return JSON.parse(outputs[0]!.content) as VscodeTheme;
}

describe("VS Code theme mapping accuracy", () => {
  const PRESETS: Array<{ name: string; palette: Palette; fixturePath: string }> = [
    {
      name: "One Dark Pro",
      palette: oneDarkPalette,
      fixturePath: resolve(__dirname, "fixtures/onedarkpro_vscode.json"),
    },
    {
      name: "Dracula",
      palette: draculaPalette,
      fixturePath: resolve(__dirname, "fixtures/dracula_vscode.json"),
    },
    {
      name: "GitHub",
      palette: githubDarkPalette,
      fixturePath: resolve(__dirname, "fixtures/github_vscode.json"),
    },
  ];

  for (const { name, palette, fixturePath } of PRESETS) {
    test(`${name} mapping accuracy`, () => {
      const generated = generateVscodeTheme(palette, name);
      const rawFixture = JSON.parse(readFileSync(fixturePath, "utf-8")) as VscodeTheme;
      const official = normalizeFixture(rawFixture);

      expect(generated.colors).toBeDefined();
      expect(official.colors).toBeDefined();

      const result = compareThemes(generated, official);
      printResults(result);

      const overallScore = result.colorKeys.total > 0
        ? Math.round((result.colorKeys.matched / result.colorKeys.total) * 100)
        : 0;

      console.log(`\n  Overall score: ${overallScore}% (threshold: 50%)`);

      // Basic sanity: we must have generated colors, and at least some matched
      expect(result.colorKeys.total).toBeGreaterThan(0);
      expect(result.colorKeys.matched).toBeGreaterThan(0);
      console.log(`  Generated keys not in fixture: ${result.generatedKeysNotInFixture.length}`);
      console.log(`  Fixture keys not generated:    ${result.fixtureKeysNotInGenerated.length}`);
    });
  }
});
