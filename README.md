# PalletSmith

A TypeScript-first theme builder that converts a color palette into native themes for any app — Zed, Ghostty, VS Code, Chrome DevTools, OpenChamber, and more.

## Quick Start

```bash
npm install -g palletsmith

# Scaffold a new theme from a preset
palletsmith init --name "My Theme" --preset evergreen --out ./my-theme

# Build all themes
cd ./my-theme && palletsmith build

# Or use a config file
palletsmith build --config palletsmith.yml
```

## CLI Commands

```bash
# Build themes from config
palletsmith build --config palletsmith.yml

# Build from a palette file (uses all available plugins)
palletsmith build --palette palette.yml

# Build only specific apps
palletsmith build --config palletsmith.yml --apps zed,ghostty

# List available plugins and presets
palletsmith list

# Scaffold a new theme project
palletsmith init --name "My Theme" --preset evergreen --out ./my-theme
```

## Configuration

Create `palletsmith.yml`:

```yaml
name: "My Theme"
author: "Your Name"
version: "1.0.0"
palette: ./palette.yml

apps:
  zed:
    output: ./apps/zed
  ghostty:
    output: ./apps/ghostty
  vscode:
    output: ./apps/vscode
  chrome:
    output: ./apps/chrome
  openchamber:
    output: ./apps/openchamber
```

Create `palette.yml`:

```yaml
palette:
  bg: "#1E1E2E"
  surface: "#313244"
  selection: "#45475A"
  border: "#585B70"
  muted: "#7F849C"
  text: "#CDD6F4"
  accent: "#89B4FA"
  red: "#F38BA8"
  orange: "#FAB387"
  yellow: "#F9E2AF"
  green: "#A6E3A1"
  cyan: "#94E2D5"
  blue: "#89B4FA"
  magenta: "#CBA6F7"
```

## Plugins

| Plugin | Description |
|--------|-------------|
| Zed | Zed Editor theme JSON (v0.2.0 schema) |
| Ghostty | Ghostty terminal key=value config |
| VS Code | VS Code theme JSON with .colors + .tokenColors |
| Chrome | Chrome DevTools JSON theme |
| OpenChamber | OpenChamber detailed nested JSON theme |

## Presets

| Preset | Description |
|--------|-------------|
| Evergreen | Clean green-accent theme (dark + light) |
| Dracula | Classic purple-dark theme |

## Benchmark

[![Benchmark](https://img.shields.io/badge/📊-Benchmark%20Dashboard-blue?style=flat-square)](https://michaelruelas.github.io/palletsmith/)

Accuracy of derived themes against official theme JSON fixtures. Updated on every push.

| Theme | VS Code | Zed | Ghostty | Chrome | OpenChamber |
|-------|---------|-----|---------|-------|-------------|
| Dracula | 51% | 232 keys | 21 keys | 46 keys | 125 keys |
| One Dark Pro | 33% | 232 keys | 21 keys | 46 keys | 125 keys |

## Architecture

```
palette.yml  →  Derivation Layer  →  MasterSchema  →  Plugin System  →  app/theme files
(13 colors)      (Base24 slots)       (100+ tokens)    (typed render())
```

## Plugin API

```typescript
interface AppPlugin {
  id: string;
  name: string;
  version: string;
  consumes: TokenCategory[];
  configSchema?: JSONSchema;
  render(input: PluginInput): PluginOutput[];
}
```

## License

MIT
