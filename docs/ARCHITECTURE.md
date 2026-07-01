# Architecture

PalletSmith transforms a 13-color user palette into native themes through a multi-stage pipeline.

## Pipeline

```
palette.yml  →  Derive Base24  →  Expand MasterSchema  →  Plugin System  →  theme files
(13 colors)      (24 slots)         (100+ tokens)          (typed render())    (JSON, conf)
```

### 1. Derive Base24 ([src/core/derive.ts](../src/core/derive.ts))

The 13-color palette is slotted into the Base24 framework. This produces:
- 8 neutral ramp slots (base00–base07)
- 8 accent slots (base08–base0F)
- 2 extra background depth slots (base10–base11)
- 6 bright accent variants for ANSI (base12–base17)

Detection of dark vs light appearance is automatic based on background luminance.

### 2. Expand MasterSchema ([src/core/expand.ts](../src/core/expand.ts))

Base24 slots are expanded into five domain-specific token groups:

| Group | Tokens | Description |
| --- | --- | --- |
| `tokens` | ~45 | Semantic UI tokens — backgrounds, borders, text, interactive states |
| `syntax` | ~75 | Syntax highlighting — comments, strings, keywords, functions, types |
| `terminal` | 18 | ANSI 16-color palette + cursor/selection |
| `status` | 8 | Info, success, warning, error with backgrounds |
| `players` | 8 | Collaborator cursor colors |

### 3. Render plugins ([src/plugins/](../src/plugins/))

Each plugin consumes relevant token categories and produces native theme files. See [PLUGINS.md](./PLUGINS.md).

## Key source layout

| Path | Role |
| --- | --- |
| `src/core/types.ts` | All TypeScript types — Palette, Base24Slots, MasterSchema, etc. |
| `src/core/color.ts` | Color manipulation utilities (hex/rgb/hsl, blend, lighten, darken) |
| `src/core/derive.ts` | Palette → Base24 derivation |
| `src/core/expand.ts` | Base24 → MasterSchema expansion |
| `src/core/config.ts` | Config and palette file loading |
| `src/core/validate.ts` | Palette validation |
| `src/plugins/apps/` | One file per target app plugin |
| `src/presets/` | Built-in color presets (evergreen, dracula, onedark, github) |

## See also

- [CONFIGURATION.md](./CONFIGURATION.md) — config and palette formats
- [PLUGINS.md](./PLUGINS.md) — plugin system and API
- [src/core/types.ts](../src/core/types.ts) — MasterSchema definition
