# Configuration

PalletSmith uses a YAML config file and a palette file to define themes. Both can be in `.yml`, `.yaml`, or `.json` format.

## Config file (`palletsmith.yml`)

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

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Theme display name |
| `author` | string | Author name |
| `version` | string | Semver version |
| `palette` | string or object | Path to palette file, or inline palette object |
| `apps` | Record<string, AppConfig> | Per-app output configuration |
| `overrides.tokens` | Record<string, string> | Optional token overrides |

## Palette file (`palette.yml`)

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

All 13 colors are required. See [src/core/types.ts](../src/core/types.ts) for the `Palette` type definition.

## CLI commands

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

## See also

- [PLUGINS.md](./PLUGINS.md) — per-app plugin details
- [ARCHITECTURE.md](./ARCHITECTURE.md) — how palette becomes the final theme
