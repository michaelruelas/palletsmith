import type { Palette, Appearance } from "../core/types.js";
import type { PresetPack } from "./index.js";

export const evergreenDark: Palette = {
  bg: "#141414",
  surface: "#1A1A1A",
  selection: "#2A2A2A",
  border: "#171717",
  muted: "#989697",
  text: "#E4E6E7",
  accent: "#62D491",
  red: "#E57373",
  orange: "#DAA06A",
  yellow: "#E5C07B",
  green: "#81D89D",
  cyan: "#85D3EC",
  blue: "#64B5F6",
  magenta: "#BA68C8",
};

export const evergreenLight: Palette = {
  bg: "#F5F5F5",
  surface: "#FFFFFF",
  selection: "#E8E8E8",
  border: "#E8E8E8",
  muted: "#616161",
  text: "#222222",
  accent: "#4DD689",
  red: "#C74E39",
  orange: "#8B7355",
  yellow: "#8B7355",
  green: "#2E8B57",
  cyan: "#0891B2",
  blue: "#2563EB",
  magenta: "#8B5CF6",
};

export const evergreenPreset: PresetPack = {
  name: "Evergreen",
  description: "A clean green-accent theme with dark and light modes.",
  author: "PalletSmith",
  themes: [
    { id: "evergreen-dark", name: "Evergreen Dark", appearance: "dark" as Appearance, palette: evergreenDark },
    { id: "evergreen-light", name: "Evergreen Light", appearance: "light" as Appearance, palette: evergreenLight },
  ],
};
