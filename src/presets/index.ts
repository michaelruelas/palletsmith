import type { Palette, Appearance } from "../core/types.js";

export type { Palette, Appearance } from "../core/types.js";

export interface PresetTheme {
  id: string;
  name: string;
  appearance: Appearance;
  palette: Palette;
}

export interface PresetPack {
  name: string;
  description?: string;
  author: string;
  themes: PresetTheme[];
}

export { evergreenDark, evergreenLight, evergreenPreset } from "./evergreen.js";
export { draculaPalette, draculaPreset } from "./dracula.js";
export { oneDarkPalette, oneDarkPreset } from "./onedark.js";
export { githubDarkPalette, githubPreset } from "./github.js";
