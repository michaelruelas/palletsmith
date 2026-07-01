# General agent guidance

Read this first. Task-specific notes live in [CODE_REVIEWER.md](./CODE_REVIEWER.md) and [TEST_WRITER.md](./TEST_WRITER.md).

## What this project is

PalletSmith is a TypeScript-first theme builder that converts a 13-color palette into native themes for Zed, Ghostty, VS Code, Chrome DevTools, and OpenChamber.

## Tech stack

- TypeScript (strict mode, ES2022 target)
- Bun (test runner, package manager)
- Commander (CLI framework)
- js-yaml (YAML parsing)

## Where things live

| Concern | File |
| --- | --- |
| CLI entry | `src/cli/main.ts` |
| Core types | `src/core/types.ts` |
| Color math | `src/core/color.ts` |
| Derivation | `src/core/derive.ts` |
| Expansion | `src/core/expand.ts` |
| Config loading | `src/core/config.ts` |
| Plugins | `src/plugins/apps/*.ts` |
| Plugin registry | `src/plugins/registry.ts` |
| Presets | `src/presets/*.ts` |
| Tests | `test/` (mirrors `src/` layout) |

## Conventions

- Use path aliases (`@palletsmith/core`, `@palletsmith/plugins`, `@palletsmith/presets`)
- Exports use named exports, not default exports
- All hex colors are normalized with `#` prefix internally
- Plugin IDs are kebab-case

## Workflow

1. Edit source in `src/`
2. Run `bun run typecheck` for type errors
3. Run `bun run test` to verify
4. Run `bun run build` before commit

## Don't

- Don't inline hex values — always reference through the palette/MasterSchema
- Don't add new dependencies without checking existing ones first
- Don't use `any` — prefer `unknown` with type guards
- Don't edit `dist/` — it's a build artifact
