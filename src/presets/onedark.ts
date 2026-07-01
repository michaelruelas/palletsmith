import type { Palette, Appearance } from "../core/types.js";
import type { PresetPack } from "./index.js";

export const oneDarkPalette: Palette = {
  bg: "#282c34",
  surface: "#21252b",
  selection: "#3E4451",
  border: "#3E4451",
  muted: "#5c6370",
  text: "#abb2bf",
  accent: "#61afef",
  red: "#e06c75",
  orange: "#d19a66",
  yellow: "#e5c07b",
  green: "#98c379",
  cyan: "#56b6c2",
  blue: "#61afef",
  magenta: "#c678dd",
};

export const oneDarkPreset: PresetPack = {
  name: "One Dark Pro",
  description: "One Dark Pro — a dark theme inspired by Atom's One Dark, popular across editors.",
  author: "binaryify",
  themes: [
    { id: "onedark", name: "One Dark Pro", appearance: "dark" as Appearance, palette: oneDarkPalette },
  ],
};
