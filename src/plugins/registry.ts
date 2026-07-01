import type { AppPlugin, AppRegistry, PluginOutput } from "./types.js";
import type { MasterSchema } from "../core/types.js";
import type { PluginSource } from "./manifest.js";
import { parsePluginSource } from "./manifest.js";
import { PluginLoader } from "./loader.js";

const loader = new PluginLoader();

/**
 * Resolve a plugin by ID or source descriptor.
 * First tries the bundled palletsmith-plugins package, then falls through to generic loading.
 */
export async function resolvePlugin(id: string): Promise<AppPlugin> {
  try {
    const { registry } = await import("palletsmith-plugins");
    if (id in registry) {
      return registry[id as keyof typeof registry] as AppPlugin;
    }
  } catch {
    // palletsmith-plugins not installed; fall through to generic loader
  }

  return resolveExternalPlugin(id);
}

async function resolveExternalPlugin(input: string): Promise<AppPlugin> {
  const source = parsePluginSource(input);
  return loader.load(source);
}

/**
 * List all available plugins (from palletsmith-plugins if installed).
 */
export async function listPlugins(): Promise<Array<{
  id: string;
  name: string;
  version: string;
  description: string;
  consumes: string[];
}>> {
  try {
    const { registry } = await import("palletsmith-plugins");
    return Object.entries(registry).map(([id, plugin]) => ({
      id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      consumes: plugin.consumes,
    }));
  } catch {
    return [];
  }
}

export async function runPlugin(
  plugin: AppPlugin,
  master: MasterSchema,
  config: Record<string, unknown>
): Promise<PluginOutput[]> {
  return await plugin.render({ master, config });
}

export async function runPlugins(
  plugins: Array<{ plugin: AppPlugin; config: Record<string, unknown> }>,
  master: MasterSchema
): Promise<Array<{ pluginId: string; outputs: PluginOutput[] }>> {
  const results: Array<{ pluginId: string; outputs: PluginOutput[] }> = [];
  for (const { plugin, config } of plugins) {
    const outputs = await runPlugin(plugin, master, config);
    results.push({ pluginId: plugin.id, outputs });
  }
  return results;
}

export function clearPluginCache(): void {
  loader.clearCache();
}
