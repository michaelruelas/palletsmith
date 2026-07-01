import { describe, expect, test } from "bun:test";
import { definePlugin } from "../../src/plugins/types.ts";
import type { AppPlugin, PluginOutput, PluginInput } from "../../src/plugins/types.ts";

describe("definePlugin", () => {
  test("creates a valid plugin from a definition", () => {
    const plugin = definePlugin({
      id: "test",
      name: "Test Plugin",
      version: "1.0.0",
      description: "A test plugin",
      consumes: ["tokens"],
      render(_input: PluginInput): PluginOutput[] {
        return [{ filename: "test.json", content: "{}", format: "json" }];
      },
    });
    expect(plugin.id).toBe("test");
    expect(plugin.name).toBe("Test Plugin");
    expect(plugin.render({ master: {} as any, config: {} })).toEqual([
      { filename: "test.json", content: "{}", format: "json" },
    ]);
  });
});

describe("AppPlugin type contract", () => {
  test("plugin must have all required fields", () => {
    const plugin: AppPlugin = {
      id: "minimal",
      name: "Minimal Plugin",
      version: "0.0.1",
      description: "Minimal",
      consumes: [],
      render() {
        return [];
      },
    };
    expect(plugin.id).toBe("minimal");
  });

  test("plugin can have extraTokens and configSchema", () => {
    const plugin = definePlugin({
      id: "full",
      name: "Full Plugin",
      version: "1.0.0",
      description: "Has all fields",
      consumes: ["tokens", "syntax"],
      configSchema: { type: "object" },
      extraTokens: {
        customColor: {
          description: "A custom derived color",
          derive: (master) => master.meta.basePalette.accent,
        },
      },
      render() {
        return [];
      },
    });
    expect(plugin.configSchema).toBeDefined();
    expect(plugin.extraTokens).toBeDefined();
  });
});
