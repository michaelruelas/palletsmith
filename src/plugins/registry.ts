import type { AppPlugin, PluginOutput } from "./types.js";
import type { MasterSchema } from "../core/types.js";
import type { PluginSource } from "./manifest.js";
import { parsePluginSource } from "./manifest.js";
import { PluginLoader } from "./loader.js";
import { internalRegistry } from "./apps/index.js";

const loader = new PluginLoader();

/**
 * Resolve a plugin by ID or source descriptor.
 * First tries the built-in registry, then falls through to generic loading.
 */
export async function resolvePlugin(id: string): Promise<AppPlugin> {
  if (id in internalRegistry) {
    return internalRegistry[id as keyof typeof internalRegistry] as AppPlugin;
  }

  return resolveExternalPlugin(id);
}

async function resolveExternalPlugin(input: string): Promise<AppPlugin> {
  const source = parsePluginSource(input);
  return loader.load(source);
}

/**
 * List all available built-in plugins.
 */
export async function listPlugins(): Promise<Array<{
  id: string;
  name: string;
  version: string;
  description: string;
  consumes: string[];
}>> {
  return Object.entries(internalRegistry).map(([id, plugin]) => ({
    id,
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    consumes: plugin.consumes,
  }));
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
