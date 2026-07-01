import type { Palette, Appearance } from "../core/types.js";
import type { PresetPack } from "./index.js";

export const githubDarkPalette: Palette = {
  bg: "#0d1117",
  surface: "#161b22",
  selection: "#264f78",
  border: "#30363d",
  muted: "#8b949e",
  text: "#e6edf3",
  accent: "#58a6ff",
  red: "#ff7b72",
  orange: "#f78166",
  yellow: "#d29922",
  green: "#3fb950",
  cyan: "#39c5cf",
  blue: "#79c0ff",
  magenta: "#bc8cff",
};

export const githubPreset: PresetPack = {
  name: "GitHub",
  description: "GitHub Dark — based on GitHub's official VS Code and Zed themes.",
  author: "GitHub / Primer",
  themes: [
    { id: "github", name: "GitHub", appearance: "dark" as Appearance, palette: githubDarkPalette },
  ],
};
