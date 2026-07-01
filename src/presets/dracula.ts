import type { Palette, Appearance } from "../core/types.js";
import type { PresetPack } from "./index.js";

export const draculaPalette: Palette = {
  bg: "#282A36",
  surface: "#44475A",
  selection: "#44475A",
  border: "#44475A",
  muted: "#6272A4",
  text: "#F8F8F2",
  accent: "#BD93F9",
  red: "#FF5555",
  orange: "#FFB86C",
  yellow: "#F1FA8C",
  green: "#50FA7B",
  cyan: "#8BE9FD",
  blue: "#6272A4",
  magenta: "#BD93F9",
};

export const draculaPreset: PresetPack = {
  name: "Dracula",
  description: "Dracula — a dark theme with purple accents, popular across editors and terminals.",
  author: "Dracula Team",
  themes: [
    { id: "dracula", name: "Dracula", appearance: "dark" as Appearance, palette: draculaPalette },
  ],
};
