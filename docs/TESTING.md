# Testing

Tests use Bun's built-in test runner. Run them with:

```bash
bun test           # run all tests
bun test --watch   # watch mode
```

## Test structure

Tests live in [`test/`](../test/) mirroring the source tree:

```
test/
├── core/          # config, color, derive, expand, validate
├── plugins/       # registry, manifest, types, validate, plugin-specific
├── presets/       # preset definitions
├── mapping/       # theme mapping tests
└── __fixtures__/  # fixture data
```

## Conventions

- One test file per source module (e.g. `src/core/derive.ts` → `test/core/derive.test.ts`)
- Use `describe` and `it` blocks for organization
- Fixture data goes in `test/__fixtures__/`
- Import via `@palletsmith/*` path aliases where possible

## What to test

| Area | What to cover |
| --- | --- |
| Color utilities | hex normalization, RGB/HSL conversion, blending, luminance |
| Derivation | 13-color → Base24 correctness for dark and light palettes |
| Expansion | Base24 → all token groups with known input/output pairs |
| Validation | Invalid palettes, missing fields, bad hex values |
| Plugins | Each plugin renders valid output for given MasterSchema |
| Presets | Presets return valid 13-color palettes |

## See also

- [src/core/types.ts](../src/core/types.ts) — type definitions used in tests
- [QUALITY.md](./QUALITY.md) — type checking and CI
