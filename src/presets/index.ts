import type { Palette, Appearance, ThemeCustomizations } from "../core/types.js";

export type { Palette, Appearance, ThemeCustomizations } from "../core/types.js";

export interface PresetTheme {
  id: string;
  name: string;
  appearance: Appearance;
  palette: Palette;
  /** Per-plugin overrides specific to this theme */
  customizations?: ThemeCustomizations;
}

export interface PresetPack {
  name: string;
  description?: string;
  author: string;
  themes: PresetTheme[];
}

import { draculaPreset } from "./dracula.js";
import { githubPreset } from "./github.js";
import { oneDarkPreset } from "./onedark.js";

export { evergreenDark, evergreenLight, evergreenPreset } from "./evergreen.js";
export { draculaPalette, draculaPreset } from "./dracula.js";
export { oneDarkPalette, oneDarkPreset } from "./onedark.js";
export { githubDarkPalette, githubPreset } from "./github.js";

/**
 * Resolve preset customizations by matching the theme name against built-in presets.
 * This allows default overrides to flow through without requiring the user's
 * palletsmith.yml to specify them explicitly.
 */
export function resolvePresetCustomizations(name: string): ThemeCustomizations | undefined {
  const presets = [draculaPreset, githubPreset, oneDarkPreset];
  for (const pack of presets) {
    for (const theme of pack.themes) {
      if (theme.name === name) {
        return theme.customizations;
      }
    }
  }
  return undefined;
}
