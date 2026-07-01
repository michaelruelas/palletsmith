#!/usr/bin/env node

import { Command } from "commander";
import type { MasterSchema } from "../core/types.js";
import type { AppPlugin } from "../plugins/types.js";

const program = new Command();

program
  .name("palletsmith")
  .description("A TypeScript-first theme builder that converts a color palette into native themes for any app.")
  .version("0.1.0");

// ─── build command ───────────────────────────────────────────

program
  .command("build")
  .description("Build themes from a palette file")
  .option("--palette <path>", "Path to palette.yml or palette.json")
  .option("--config <path>", "Path to palletsmith.yml")
  .option("--out <dir>", "Output directory", "./apps")
  .option("--apps <names>", "Comma-separated app plugins to build (default: all)")
  .action(async (opts) => {
    try {
      await runBuild(opts);
    } catch (err) {
      console.error("Build failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

// ─── list command ────────────────────────────────────────────

program
  .command("list")
  .description("List available plugins and presets")
  .option("--category <category>", "Filter by category: apps, presets, all")
  .action(async (opts) => {
    const category = opts.category ?? "all";

    if (category === "apps" || category === "all") {
      const { listPlugins } = await import("../plugins/registry.js");
      const plugins = await listPlugins();
      console.log("\n📦 App Plugins:");
      if (plugins.length === 0) {
        console.log("  (no built-in plugins found)");
      } else {
        console.log(`  ${plugins.length} plugin(s) available:`);
        for (const p of plugins) {
          console.log(`    ${p.id.padEnd(12)} ${p.name} (${p.version})`);
          console.log(`              consumes: ${p.consumes.join(", ")}`);
        }
      }
    }

    if (category === "presets" || category === "all") {
      console.log("\n🎨 Preset Palettes:");
      console.log("  evergreen    Evergreen green-accent dark/light theme");
      console.log("  dracula      Dracula purple-dark theme");
    }

    console.log();
  });

// ─── init command ────────────────────────────────────────────

program
  .command("init")
  .description("Scaffold a new theme project")
  .option("--name <name>", "Theme name", "My Theme")
  .option("--preset <name>", "Start from a preset (evergreen, dracula)")
  .option("--out <dir>", "Output directory", ".")
  .action(async (opts) => {
    await runInit(opts);
  });

// ─── Build logic ─────────────────────────────────────────────

async function runBuild(opts: {
  palette?: string;
  config?: string;
  out?: string;
  apps?: string;
}) {
  console.log("🎨 PalletSmith build\n");

  const { resolvePalette: rp } = await import("../core/config.js");
  const { loadConfig } = await import("../core/config.js");
  const { deriveBase24 } = await import("../core/derive.js");
  const { expandMasterSchema } = await import("../core/expand.js");
  const { validatePalette } = await import("../core/validate.js");
  const { resolvePlugin, runPlugins } = await import("../plugins/registry.js");

  let config: { name: string; author: string; version: string; palette: string; apps: Record<string, { output: string; config?: Record<string, unknown> }>; customizations?: import("../core/types.js").ThemeCustomizations };
  if (opts.config) {
    const loaded = await loadConfig(opts.config);
    config = { ...loaded, palette: loaded.palette as string };
  } else if (opts.palette) {
    const palette = await rp(opts.palette);
    config = {
      name: opts.palette.replace(/\.(yml|yaml|json)$/, ""),
      author: "PalletSmith",
      version: "1.0.0",
      palette: opts.palette,
      apps: {},
    };
  } else {
    console.error("Error: provide --config or --palette");
    process.exit(1);
    return;
  }

  const palette = await rp(config.palette);

  const { resolvePresetCustomizations } = await import("../presets/index.js");

  const validation = validatePalette(palette);
  if (!validation.valid) {
    console.error("❌ Palette validation failed:");
    for (const e of validation.errors) {
      console.error(`  ${e.field}: ${e.message}`);
    }
    process.exit(1);
  }
  if (validation.warnings.length > 0) {
    for (const w of validation.warnings) {
      console.warn(`⚠  ${w.field}: ${w.message}`);
    }
  }

  const base24 = deriveBase24(palette);
  const { tokens, syntax, terminal, status, players } = expandMasterSchema(base24, palette.accent, palette);

  const master: MasterSchema = {
    meta: {
      name: config.name,
      author: config.author,
      version: config.version,
      appearance: base24.appearance,
      basePalette: palette,
      customizations: config.customizations ?? resolvePresetCustomizations(config.name),
    },
    base24,
    tokens,
    syntax,
    terminal,
    status,
    players,
  };

  const appNames = opts.apps
    ? opts.apps.split(",").map((s) => s.trim())
    : Object.keys(config.apps);

  if (appNames.length === 0) {
    console.log("No apps configured. Add apps to palletsmith.yml or use --apps.");
    return;
  }

  console.log(`Building for: ${appNames.join(", ")}\n`);

  const pluginConfigs: Array<{ plugin: AppPlugin; config: Record<string, unknown> }> = [];
  for (const name of appNames) {
    try {
      const plugin = await resolvePlugin(name);
      pluginConfigs.push({ plugin, config: config.apps[name]?.config ?? {} });
    } catch {
      console.warn(`⚠  Plugin not found: "${name}"`);
    }
  }

  if (pluginConfigs.length === 0) {
    console.error("No valid plugins found.");
    process.exit(1);
  }

  const results = await runPlugins(pluginConfigs, master);

  const fs = await import("fs");
  const path = await import("path");
  const outDir = opts.out ?? "./apps";

  for (const { pluginId, outputs } of results) {
    const appDir = path.resolve(outDir, pluginId);
    fs.mkdirSync(appDir, { recursive: true });
    for (const output of outputs) {
      const filePath = path.join(appDir, output.filename);
      fs.writeFileSync(filePath, output.content, "utf-8");
      console.log(`  ✅ ${pluginId}/${output.filename}`);
    }
  }

  console.log("\nBuild complete!");
}

async function runInit(opts: { name: string; preset?: string; out?: string }) {
  const fs = await import("fs");
  const path = await import("path");
  const yaml = await import("js-yaml");

  const outDir = path.resolve(opts.out ?? ".");

  let palette: any;
  if (opts.preset === "evergreen") {
    const { evergreenDark } = await import("../presets/evergreen.js");
    palette = evergreenDark;
  } else if (opts.preset === "dracula") {
    const { draculaPalette } = await import("../presets/dracula.js");
    palette = draculaPalette;
  } else {
    palette = {
      bg: "#1E1E2E",
      surface: "#313244",
      selection: "#45475A",
      border: "#585B70",
      muted: "#7F849C",
      text: "#CDD6F4",
      accent: "#89B4FA",
      red: "#F38BA8",
      orange: "#FAB387",
      yellow: "#F9E2AF",
      green: "#A6E3A1",
      cyan: "#94E2D5",
      blue: "#89B4FA",
      magenta: "#CBA6F7",
    };
  }

  const themeName = opts.name ?? "My Theme";

  const themeYaml = yaml.dump({
    name: themeName,
    author: "PalletSmith",
    version: "1.0.0",
    palette: "./palette.yml",
    apps: {
      zed: { output: "./apps/zed" },
      ghostty: { output: "./apps/ghostty" },
      vscode: { output: "./apps/vscode" },
      chrome: { output: "./apps/chrome" },
      openchamber: { output: "./apps/openchamber" },
    },
  });

  const paletteYaml = yaml.dump({ palette });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "palletsmith.yml"), themeYaml, "utf-8");
  fs.writeFileSync(path.join(outDir, "palette.yml"), paletteYaml, "utf-8");

  console.log(`\n✅ Scaffolded "${themeName}" in ${outDir}`);
  console.log("  palletsmith.yml — configuration");
  console.log("  palette.yml   — color palette");
  console.log("\nNext: palletsmith build");
}

export { runBuild, runInit };

if (import.meta.url === `file://${process.argv[1]}?.split("?")[0]}`) {
  program.parse();
}
