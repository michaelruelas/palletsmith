import type { AppPlugin, PluginInput, PluginOutput } from "./types.js";
import type { PluginManifest, PluginSource, ResolvedPlugin } from "./manifest.js";
import { validateManifest } from "./manifest.js";

export interface PluginLoaderOptions {
  /** Cache resolved plugins keyed by source string */
  cache?: Map<string, AppPlugin>;
}

/**
 * Loads plugins from various sources (builtin, npm, GitHub, local).
 */
export class PluginLoader {
  private cache: Map<string, AppPlugin>;

  constructor(options?: PluginLoaderOptions) {
    this.cache = options?.cache ?? new Map();
  }

  /**
   * Resolve and load a plugin from a source descriptor.
   */
  async load(source: PluginSource): Promise<AppPlugin> {
    const cacheKey = this.cacheKey(source);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let plugin: AppPlugin;

    switch (source.type) {
      case "builtin": {
        const { registry: builtinRegistry } = await import("palletsmith-plugins");
        if (!(source.id in builtinRegistry)) {
          throw new Error(`Unknown builtin plugin: "${source.id}"`);
        }
        plugin = builtinRegistry[source.id as keyof typeof builtinRegistry] as AppPlugin;
        break;
      }
      case "npm":
        plugin = await this.loadNpm(source);
        break;
      case "github":
        plugin = await this.loadGithub(source);
        break;
      case "local":
        plugin = await this.loadLocal(source);
        break;
      case "url":
        plugin = await this.loadUrl(source);
        break;
      default:
        throw new Error(`Unknown plugin source type: ${(source as PluginSource).type}`);
    }

    this.cache.set(cacheKey, plugin);
    return plugin;
  }

  /**
   * Load a plugin from an npm package.
   */
  private async loadNpm(source: PluginSource & { type: "npm" }): Promise<AppPlugin> {
    try {
      const pkg = await import(source.package);
      const manifest = this.extractManifest(pkg, source);
      const entry = await this.resolveEntry(manifest.entry, source.package);
      return entry;
    } catch (err) {
      throw new Error(
        `Failed to load npm plugin "${source.package}": ${err instanceof Error ? err.message : err}`
      );
    }
  }

  /**
   * Load a plugin from a GitHub repo.
   * For now, this requires the package to be installed locally (via npm/git dependency).
   * A future enhancement could fetch directly from GitHub releases.
   */
  private async loadGithub(source: PluginSource & { type: "github" }): Promise<AppPlugin> {
    const packageName = source.path
      ? `${source.repo}/${source.path}`
      : source.repo;
    try {
      const pkg = await import(packageName);
      const manifest = this.extractManifest(pkg, source);
      const entry = await this.resolveEntry(manifest.entry, packageName);
      return entry;
    } catch (err) {
      throw new Error(
        `Failed to load GitHub plugin "${source.repo}": ${err instanceof Error ? err.message : err}. ` +
        `Ensure the package is installed (e.g., "bun add github:${source.repo}").`
      );
    }
  }

  /**
   * Load a plugin from a local file path.
   */
  private async loadLocal(source: PluginSource & { type: "local" }): Promise<AppPlugin> {
    try {
      const resolved = Bun.resolveSync(source.path, process.cwd());
      const pkg = await import(resolved);
      const manifest = this.extractManifest(pkg, source);
      const entry = manifest.entry
        ? await import(new URL(manifest.entry, `file://${resolved}`).href)
        : pkg;
      return this.toAppPlugin(entry, manifest);
    } catch (err) {
      throw new Error(
        `Failed to load local plugin "${source.path}": ${err instanceof Error ? err.message : err}`
      );
    }
  }

  /**
   * Load a plugin from a URL.
   */
  private async loadUrl(source: PluginSource & { type: "url" }): Promise<AppPlugin> {
    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const code = await response.text();
      const blob = new Blob([code], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const pkg = await import(url);
      URL.revokeObjectURL(url);
      const manifest = this.extractManifest(pkg, source);
      return this.toAppPlugin(pkg, manifest);
    } catch (err) {
      throw new Error(
        `Failed to load URL plugin "${source.url}": ${err instanceof Error ? err.message : err}`
      );
    }
  }

  /**
   * Extract a PluginManifest from a loaded package.
   * Checks for `manifest` export first, then falls back to `pkg` properties.
   */
  private extractManifest(pkg: Record<string, unknown>, source: PluginSource): PluginManifest {
    if (pkg.manifest) {
      return validateManifest(pkg.manifest);
    }
    if (pkg.plugin && typeof pkg.plugin === "object") {
      const pl = pkg.plugin as Record<string, unknown>;
      if (pl.id && pl.name && pl.version) {
        return {
          schema: "palletsmith-plugin-v1" as const,
          id: pl.id as string,
          name: pl.name as string,
          version: pl.version as string,
          description: (pl.description as string) ?? `Plugin: ${pl.id}`,
          entry: "./index.js",
          consumes: (pl.consumes ?? []) as PluginManifest["consumes"],
        };
      }
    }
    throw new Error(
      `No valid plugin manifest found in ${JSON.stringify(source)}. ` +
      `Export a 'manifest' or 'plugin' object from your entry point.`
    );
  }

  /**
   * Resolve the plugin entry point relative to a package.
   */
  private async resolveEntry(entry: string, basePackage: string): Promise<AppPlugin> {
    try {
      const resolved = await import(/* @vite-ignore */ entry);
      return this.toAppPlugin(resolved, {} as PluginManifest);
    } catch {
      try {
        const pkg = await import(basePackage);
        return this.toAppPlugin(pkg, {} as PluginManifest);
      } catch (err) {
        throw new Error(
          `Could not resolve entry "${entry}" in package "${basePackage}": ${err instanceof Error ? err.message : err}`
        );
      }
    }
  }

  /**
   * Convert a loaded module to an AppPlugin interface.
   */
  private toAppPlugin(module: Record<string, unknown>, manifest: PluginManifest): AppPlugin {
    if (module.plugin && typeof module.plugin === "object") {
      return module.plugin as AppPlugin;
    }
    if (module.default && typeof module.default === "object" && "render" in module.default) {
      return module.default as AppPlugin;
    }
    if (typeof module.render === "function") {
      return {
        id: manifest.id ?? "external",
        name: manifest.name ?? "External Plugin",
        version: manifest.version ?? "0.0.0",
        description: manifest.description ?? "",
        consumes: manifest.consumes ?? [],
        configSchema: manifest.configSchema,
        render: module.render as (input: PluginInput) => PluginOutput[] | Promise<PluginOutput[]>,
      };
    }
    throw new Error(
      "Loaded module does not expose a valid plugin. " +
      "Export a 'plugin' object, a default export with 'render', or a named 'render' function."
    );
  }

  private cacheKey(source: PluginSource): string {
    switch (source.type) {
      case "builtin": return `builtin:${source.id}`;
      case "npm": return `npm:${source.package}@${source.version ?? "latest"}`;
      case "github": return `github:${source.repo}@${source.ref ?? "HEAD"}:${source.path ?? ""}`;
      case "local": return `local:${source.path}`;
      case "url": return `url:${source.url}`;
    }
  }

  /** Clear the plugin cache */
  clearCache(): void {
    this.cache.clear();
  }
}
