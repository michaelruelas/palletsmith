# Plugins

PalletSmith's plugin system converts the derived MasterSchema into native theme files for each target application.

## Built-in plugins

| Plugin | Output | Schema |
| --- | --- | --- |
| Zed | `*.json` | Zed Editor v0.2.0 theme format |
| Ghostty | `*.conf` | Ghostty terminal key=value config |
| VS Code | `*.json` | VS Code theme with `.colors` + `.tokenColors` |
| Chrome | `*.json` | Chrome DevTools JSON theme |
| OpenChamber | `*.json` | OpenChamber detailed nested JSON theme |

Each plugin is defined in [src/plugins/apps/](../src/plugins/apps/) and registered in [src/plugins/index.ts](../src/plugins/index.ts).

## Plugin API

```typescript
interface AppPlugin<TConfig, TExtraTokens> {
  id: string;
  name: string;
  version: string;
  description: string;
  consumes: TokenCategory[];
  configSchema?: Record<string, unknown>;
  extraTokens?: Record<string, ExtraTokenDefinition>;
  render(input: PluginInput): PluginOutput[] | Promise<PluginOutput[]>;
}
```

### Key types

| Type | Description |
| --- | --- |
| `PluginInput` | `{ master: MasterSchema, config: Record<string, unknown> }` |
| `PluginOutput` | `{ filename, content, outputPath?, format? }` |
| `TokenCategory` | `"tokens" | "syntax" | "terminal" | "status" | "players" | "base24"` |

See [src/plugins/types.ts](../src/plugins/types.ts) for complete type definitions.

### Creating a plugin

Use `definePlugin()` from `palletsmith/plugins`:

```typescript
import { definePlugin } from "palletsmith/plugins";

export const myApp = definePlugin({
  id: "my-app",
  name: "My App",
  version: "1.0.0",
  description: "Theme support for My App",
  consumes: ["tokens", "syntax"],
  render(input) {
    const { master } = input;
    return [{
      filename: "my-app-theme.json",
      content: JSON.stringify(master.tokens, null, 2),
    }];
  },
});
```

### Plugin registry

Plugins are registered in [src/plugins/registry.ts](../src/plugins/registry.ts) and can be discovered at runtime via the registry.

## See also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — pipeline context for plugins
- [src/plugins/types.ts](../src/plugins/types.ts) — full type definitions
