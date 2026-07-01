import type { PluginOutput, AppPlugin } from "./types.js";
import type { MasterSchema } from "../core/types.js";

export interface OutputValidationResult {
  valid: boolean;
  pluginId: string;
  errors: OutputValidationError[];
  warnings: OutputValidationWarning[];
}

export interface OutputValidationError {
  file: string;
  message: string;
}

export interface OutputValidationWarning {
  file: string;
  message: string;
}

/**
 * Validate plugin outputs.
 * Checks that filenames are safe, content is non-empty,
 * and structured formats (JSON, YAML) are well-formed.
 */
export function validatePluginOutputs(
  plugin: AppPlugin,
  outputs: PluginOutput[]
): OutputValidationResult {
  const errors: OutputValidationError[] = [];
  const warnings: OutputValidationWarning[] = [];

  for (const output of outputs) {
    // Check filename
    if (!output.filename || output.filename.length === 0) {
      errors.push({ file: "(empty)", message: "Plugin output has no filename" });
      continue;
    }

    // Path traversal prevention
    if (output.filename.includes("..") || output.filename.startsWith("/")) {
      errors.push({
        file: output.filename,
        message: `Filename contains path traversal or absolute path: "${output.filename}"`,
      });
    }

    // Check content
    if (!output.content || output.content.length === 0) {
      warnings.push({
        file: output.filename,
        message: `Output file "${output.filename}" has empty content`,
      });
    }

    // Validate structured formats
    if (output.format === "json") {
      try {
        JSON.parse(output.content);
      } catch {
        errors.push({
          file: output.filename,
          message: `Output file "${output.filename}" is not valid JSON`,
        });
      }
    }

    if (output.format === "yaml" || output.filename.endsWith(".yml") || output.filename.endsWith(".yaml")) {
      // Basic YAML validation: must contain at least key: value pairs
      if (output.content.trim().length === 0) {
        errors.push({
          file: output.filename,
          message: `Output file "${output.filename}" has empty YAML content`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    pluginId: plugin.id,
    errors,
    warnings,
  };
}

/**
 * Validate all plugin outputs.
 */
export function validateAllOutputs(
  plugins: Array<{ plugin: AppPlugin; outputs: PluginOutput[] }>
): OutputValidationResult[] {
  return plugins.map(({ plugin, outputs }) => validatePluginOutputs(plugin, outputs));
}

/**
 * Check that a master schema has all the token categories a plugin expects.
 */
export function validatePluginConsumes(
  plugin: AppPlugin,
  master: MasterSchema
): string[] {
  const missing: string[] = [];

  for (const category of plugin.consumes) {
    switch (category) {
      case "tokens":
        if (!master.tokens) missing.push("tokens");
        break;
      case "syntax":
        if (!master.syntax) missing.push("syntax");
        break;
      case "terminal":
        if (!master.terminal) missing.push("terminal");
        break;
      case "status":
        if (!master.status) missing.push("status");
        break;
      case "players":
        if (!master.players) missing.push("players");
        break;
      case "base24":
        if (!master.base24) missing.push("base24");
        break;
    }
  }

  return missing;
}
