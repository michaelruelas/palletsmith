# PalletSmith

A TypeScript-first theme builder that converts a 13-color palette into native themes for Zed, Ghostty, VS Code, Chrome DevTools, and OpenChamber.

## Quick Start

```bash
npm install -g palletsmith

# Scaffold a new theme from a preset
palletsmith init --name "My Theme" --preset evergreen --out ./my-theme

# Build all themes
cd ./my-theme && palletsmith build
```

## Docs

| Doc | What's in it |
| --- | --- |
| [CONFIGURATION](./docs/CONFIGURATION.md) | Config file, palette schema, CLI commands |
| [PLUGINS](./docs/PLUGINS.md) | Built-in plugins, plugin API |
| [ARCHITECTURE](./docs/ARCHITECTURE.md) | Pipeline, derivation, MasterSchema |
| [TESTING](./docs/TESTING.md) | Running and adding tests |
| [QUALITY](./docs/QUALITY.md) | Type checking, build, CI |

## Presets

| Preset | Description |
|--------|-------------|
| Evergreen | Clean green-accent theme (dark + light) |
| Dracula | Classic purple-dark theme |
| One Dark Pro | Atom-inspired dark theme |
| GitHub | GitHub Dark theme |

## Benchmark

[![Benchmark](https://img.shields.io/badge/📊-Benchmark%20Dashboard-blue?style=flat-square)](https://michaelruelas.github.io/palletsmith/)

Accuracy of derived themes against official theme JSON fixtures. Updated on every push.

All 9 theme×app combinations achieve 100% accuracy:

| Theme | VS Code | Zed | Ghostty |
|-------|---------|-----|---------|
| Dracula | 100% | 100% | 100% |
| One Dark Pro | 100% | 100% | 100% |
| GitHub | 100% | 100% | 100% |

Chrome and OpenChamber plugins use semantic token derivation without fixture comparison.

## License

MIT


