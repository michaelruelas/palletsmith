import type { MasterSchema, ColorHex } from "../core/types.js";

export interface PluginOutput {
  filename: string;
  content: string;
  outputPath?: string;
  format?: "json" | "yaml" | "ini" | "conf" | "js" | "toml";
}

export interface PluginInput {
  master: MasterSchema;
  config: Record<string, unknown>;
}

export interface ExtraTokenDefinition {
  description: string;
  derive: (master: MasterSchema, config: Record<string, unknown>) => ColorHex;
}

export type TokenCategory = "tokens" | "syntax" | "terminal" | "status" | "players" | "base24";

export interface AppPlugin<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
  TExtraTokens extends Record<string, string> = Record<string, string>,
> {
  id: string;
  name: string;
  version: string;
  description: string;
  consumes: TokenCategory[];
  configSchema?: Record<string, unknown>;
  extraTokens?: Record<string, ExtraTokenDefinition>;
  render(input: PluginInput): PluginOutput[] | Promise<PluginOutput[]>;
}

export type AppRegistry = Record<string, AppPlugin>;

export function definePlugin<
  C extends Record<string, unknown> = Record<string, unknown>,
  E extends Record<string, string> = Record<string, string>,
>(plugin: AppPlugin<C, E>): AppPlugin<C, E> {
  return plugin;
}
