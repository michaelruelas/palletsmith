import { zedPlugin } from "./zed.js";
import { ghosttyPlugin } from "./ghostty.js";
import { vscodePlugin } from "./vscode.js";
import { chromePlugin } from "./chrome.js";
import { openchamberPlugin } from "./openchamber.js";
import type { AppPlugin, AppRegistry, PluginOutput } from "./types.js";
import type { MasterSchema } from "../core/types.js";

export const builtinPlugins: AppRegistry = {
  zed: zedPlugin,
  ghostty: ghosttyPlugin,
  vscode: vscodePlugin,
  chrome: chromePlugin,
  openchamber: openchamberPlugin,
} as const;

export type BuiltinPluginId = keyof typeof builtinPlugins;

export function resolvePlugin(id: string): AppPlugin {
  if (id in builtinPlugins) {
    return builtinPlugins[id as BuiltinPluginId] as AppPlugin;
  }
  throw new Error(
    `Unknown plugin: "${id}". Available: ${Object.keys(builtinPlugins).join(", ")}`
  );
}

export function listPlugins(): Array<{
  id: string;
  name: string;
  version: string;
  description: string;
  consumes: string[];
}> {
  return Object.entries(builtinPlugins).map(([id, plugin]) => ({
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
