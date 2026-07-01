import { describe, expect, test } from "bun:test";
import {
  parsePluginSource,
  validateManifest,
  MANIFEST_SCHEMA,
} from "../../src/plugins/manifest.ts";
import type { PluginManifest } from "../../src/plugins/manifest.ts";

const validManifest: PluginManifest = {
  schema: MANIFEST_SCHEMA,
  id: "test-plugin",
  name: "Test Plugin",
  version: "1.0.0",
  description: "A test plugin",
  entry: "./dist/plugin.js",
  consumes: ["tokens", "syntax"],
};

describe("parsePluginSource", () => {
  test("parses builtin source", () => {
    const result = parsePluginSource("builtin:zed");
    expect(result).toEqual({ type: "builtin", id: "zed" });
  });

  test("parses npm source", () => {
    const result = parsePluginSource("npm:@scope/my-plugin");
    expect(result).toEqual({ type: "npm", package: "@scope/my-plugin" });
  });

  test("parses github source", () => {
    const result = parsePluginSource("github:owner/repo");
    expect(result).toEqual({ type: "github", repo: "owner/repo", path: undefined });
  });

  test("parses github source with path", () => {
    const result = parsePluginSource("github:owner/repo/packages/plugin");
    expect(result).toEqual({ type: "github", repo: "owner/repo", path: "packages/plugin" });
  });

  test("parses local source", () => {
    const result = parsePluginSource("local:./plugins/my-plugin.ts");
    expect(result).toEqual({ type: "local", path: "./plugins/my-plugin.ts" });
  });

  test("parses url source", () => {
    const result = parsePluginSource("url:https://example.com/plugin.js");
    expect(result).toEqual({ type: "url", url: "https://example.com/plugin.js" });
  });

  test("defaults to npm if no prefix", () => {
    const result = parsePluginSource("my-plugin");
    expect(result).toEqual({ type: "npm", package: "my-plugin" });
  });

  test("handles scoped npm packages with colon", () => {
    const result = parsePluginSource("@scope/my-plugin");
    expect(result).toEqual({ type: "npm", package: "@scope/my-plugin" });
  });
});

describe("validateManifest", () => {
  test("accepts valid manifest", () => {
    const result = validateManifest(validManifest);
    expect(result.id).toBe("test-plugin");
  });

  test("rejects non-object", () => {
    expect(() => validateManifest(null)).toThrow();
    expect(() => validateManifest("string")).toThrow();
  });

  test("rejects wrong schema", () => {
    expect(() =>
      validateManifest({ ...validManifest, schema: "v0" })
    ).toThrow(/schema/);
  });

  test("rejects missing id", () => {
    expect(() =>
      validateManifest({ ...validManifest, id: "" })
    ).toThrow(/id/);
  });

  test("rejects missing entry", () => {
    expect(() =>
      validateManifest({ ...validManifest, entry: "" })
    ).toThrow(/entry/);
  });

  test("rejects missing consumes", () => {
    expect(() =>
      validateManifest({ ...validManifest, consumes: "not-array" })
    ).toThrow(/consumes/);
  });
});
