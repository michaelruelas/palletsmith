import { describe, expect, test } from "bun:test";
import { validatePluginOutputs, validatePluginConsumes } from "../../src/plugins/validate.ts";
import { definePlugin } from "../../src/plugins/types.ts";
import type { AppPlugin, PluginOutput } from "../../src/plugins/types.ts";
import type { MasterSchema } from "../../src/core/types.ts";

const testPlugin = definePlugin({
  id: "test",
  name: "Test",
  version: "1.0.0",
  description: "Test plugin",
  consumes: ["tokens", "syntax"],
  render() {
    return [];
  },
});

describe("validatePluginOutputs", () => {
  test("accepts valid outputs", () => {
    const outputs: PluginOutput[] = [
      { filename: "theme.json", content: '{"valid": true}', format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects empty filename", () => {
    const outputs: PluginOutput[] = [
      { filename: "", content: "content", format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("no filename"))).toBe(true);
  });

  test("rejects path traversal", () => {
    const outputs: PluginOutput[] = [
      { filename: "../malicious.json", content: "{}", format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("path traversal"))).toBe(true);
  });

  test("rejects absolute paths", () => {
    const outputs: PluginOutput[] = [
      { filename: "/etc/passwd", content: "{}", format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(false);
  });

  test("warns on empty content", () => {
    const outputs: PluginOutput[] = [
      { filename: "empty.txt", content: "", format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.warnings.some((w) => w.message.includes("empty content"))).toBe(true);
  });

  test("rejects invalid JSON", () => {
    const outputs: PluginOutput[] = [
      { filename: "theme.json", content: "not json", format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("valid JSON"))).toBe(true);
  });

  test("accepts valid JSON", () => {
    const outputs: PluginOutput[] = [
      { filename: "theme.json", content: '{"key": "value"}', format: "json" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(true);
  });

  test("rejects empty YAML", () => {
    const outputs: PluginOutput[] = [
      { filename: "theme.yml", content: "", format: "yaml" },
    ];
    const result = validatePluginOutputs(testPlugin, outputs);
    expect(result.valid).toBe(false);
  });
});

describe("validatePluginConsumes", () => {
  const mockMaster = {
    meta: {} as any,
    base24: {} as any,
    tokens: {} as any,
    syntax: {} as any,
    terminal: {} as any,
    status: {} as any,
    players: [] as any,
  } as MasterSchema;

  test("returns empty for matching consumes", () => {
    const missing = validatePluginConsumes(testPlugin, mockMaster);
    expect(missing).toHaveLength(0);
  });

  test("reports missing categories", () => {
    const plugin = definePlugin({
      id: "needy",
      name: "Needy",
      version: "1.0.0",
      description: "",
      consumes: ["tokens", "syntax", "terminal", "status", "players", "base24"],
      render() {
        return [];
      },
    });
    const partialMaster = { meta: {} as any } as MasterSchema;
    const missing = validatePluginConsumes(plugin, partialMaster);
    expect(missing.length).toBeGreaterThan(0);
  });
});
