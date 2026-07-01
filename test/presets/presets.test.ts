import { describe, expect, test } from "bun:test";
import { evergreenPreset, evergreenDark, evergreenLight } from "../../src/presets/evergreen.ts";
import { draculaPreset, draculaPalette } from "../../src/presets/dracula.ts";
import { oneDarkPalette, oneDarkPreset } from "../../src/presets/onedark.ts";
import { githubDarkPalette, githubPreset } from "../../src/presets/github.ts";

describe("evergreenPreset", () => {
  test("has correct structure", () => {
    expect(evergreenPreset.name).toBe("Evergreen");
    expect(evergreenPreset.author).toBe("PalletSmith");
    expect(evergreenPreset.themes).toHaveLength(2);
  });

  test("evergreenDark has all palette keys", () => {
    expect(evergreenDark.bg).toBe("#141414");
    expect(evergreenDark.accent).toBe("#62D491");
    expect(Object.keys(evergreenDark)).toHaveLength(14);
  });

  test("evergreenLight has all palette keys", () => {
    expect(evergreenLight.bg).toBe("#F5F5F5");
    expect(evergreenLight.accent).toBe("#4DD689");
    expect(Object.keys(evergreenLight)).toHaveLength(14);
  });
});

describe("draculaPreset", () => {
  test("has correct structure", () => {
    expect(draculaPreset.name).toBe("Dracula");
    expect(draculaPreset.themes).toHaveLength(1);
  });

  test("draculaPalette has correct values", () => {
    expect(draculaPalette.bg).toBe("#282A36");
    expect(draculaPalette.accent).toBe("#BD93F9");
    expect(Object.keys(draculaPalette)).toHaveLength(14);
  });
});

describe("oneDarkPreset", () => {
  test("has correct structure", () => {
    expect(oneDarkPreset.name).toBe("One Dark Pro");
    expect(oneDarkPreset.themes).toHaveLength(1);
  });

  test("oneDarkPalette has correct values", () => {
    expect(oneDarkPalette.bg).toBe("#282c34");
    expect(oneDarkPalette.accent).toBe("#61afef");
    expect(Object.keys(oneDarkPalette)).toHaveLength(14);
  });
});

describe("githubPreset", () => {
  test("has correct structure", () => {
    expect(githubPreset.name).toBe("GitHub");
    expect(githubPreset.themes).toHaveLength(1);
  });

  test("githubDarkPalette has correct values", () => {
    expect(githubDarkPalette.bg).toBe("#0d1117");
    expect(githubDarkPalette.accent).toBe("#58a6ff");
    expect(Object.keys(githubDarkPalette)).toHaveLength(14);
  });
});

describe("all presets produce valid themes", () => {
  const presets = [
    { name: "Evergreen Dark", palette: evergreenDark },
    { name: "Evergreen Light", palette: evergreenLight },
    { name: "Dracula", palette: draculaPalette },
    { name: "One Dark Pro", palette: oneDarkPalette },
    { name: "GitHub", palette: githubDarkPalette },
  ];

  for (const { name, palette } of presets) {
    test(`${name} has valid hex colors`, () => {
      for (const [key, value] of Object.entries(palette)) {
        expect(value).toMatch(/^#?[0-9a-fA-F]{3,8}$/);
      }
    });
  }
});
