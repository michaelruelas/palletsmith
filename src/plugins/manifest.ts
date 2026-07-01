import type { TokenCategory } from "./types.js";

export const MANIFEST_SCHEMA = "palletsmith-plugin-v1";

/**
 * A plugin manifest describes a plugin for distribution.
 * Manifests can be published as npm packages or hosted in GitHub repos.
 */
export interface PluginManifest {
  /** Schema version identifier — must be "palletsmith-plugin-v1" */
  schema: typeof MANIFEST_SCHEMA;
  /** Unique plugin identifier (e.g., "my-awesome-plugin") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semantic version string */
  version: string;
  /** Short description of what the plugin does */
  description: string;
  /** Entry point relative to the package root (e.g., "./dist/plugin.js") */
  entry: string;
  /** Which token categories this plugin consumes */
  consumes: TokenCategory[];
  /** Optional JSON Schema for plugin-specific config */
  configSchema?: Record<string, unknown>;
  /** Optional URL to the plugin's repository */
  repository?: string;
  /** Optional author information */
  author?: string;
  /** Optional license identifier */
  license?: string;
}

/**
 * Describes where a plugin comes from.
 */
export type PluginSource =
  | { type: "builtin"; id: string }
  | { type: "npm"; package: string; version?: string }
  | { type: "github"; repo: string; ref?: string; path?: string }
  | { type: "local"; path: string }
  | { type: "url"; url: string };

/**
 * A resolved plugin reference, ready to be loaded.
 */
export interface ResolvedPlugin {
  manifest: PluginManifest;
  source: PluginSource;
}

/**
 * Parse a plugin source string in the format:
 *   "builtin:zed"
 *   "npm:@scope/package-name"
 *   "github:owner/repo[/path]"
 *   "local:./path/to/plugin"
 *   "url:https://example.com/plugin.js"
 */
export function parsePluginSource(input: string): PluginSource {
  const colonIndex = input.indexOf(":");
  if (colonIndex === -1) {
    return { type: "npm", package: input };
  }

  const prefix = input.slice(0, colonIndex) as PluginSource["type"];
  const value = input.slice(colonIndex + 1);

  switch (prefix) {
    case "builtin":
      return { type: "builtin", id: value };
    case "npm":
      return { type: "npm", package: value };
    case "github": {
      const parts = value.split("/");
      if (parts.length < 2) {
        throw new Error(`Invalid GitHub source: "${input}". Expected "github:owner/repo[/path]"`);
      }
      const repo = `${parts[0]}/${parts[1]!}`;
      const path = parts.slice(2).join("/") || undefined;
      return { type: "github", repo, path };
    }
    case "local":
      return { type: "local", path: value };
    case "url":
      return { type: "url", url: value };
    default:
      return { type: "npm", package: input };
  }
}

/**
 * Validate the shape of a loaded plugin manifest.
 */
export function validateManifest(raw: unknown): PluginManifest {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Plugin manifest must be a non-null object");
  }

  const m = raw as Record<string, unknown>;

  if (m.schema !== MANIFEST_SCHEMA) {
    throw new Error(
      `Unsupported manifest schema "${m.schema}". Expected "${MANIFEST_SCHEMA}".`
    );
  }

  if (typeof m.id !== "string" || m.id.length === 0) {
    throw new Error("Plugin manifest must have a non-empty 'id'");
  }

  if (typeof m.name !== "string" || m.name.length === 0) {
    throw new Error("Plugin manifest must have a non-empty 'name'");
  }

  if (typeof m.version !== "string") {
    throw new Error("Plugin manifest must have a 'version' string");
  }

  if (typeof m.description !== "string") {
    throw new Error("Plugin manifest must have a 'description' string");
  }

  if (typeof m.entry !== "string" || m.entry.length === 0) {
    throw new Error("Plugin manifest must have a non-empty 'entry'");
  }

  if (!Array.isArray(m.consumes)) {
    throw new Error("Plugin manifest must have a 'consumes' array");
  }

  return m as unknown as PluginManifest;
}
