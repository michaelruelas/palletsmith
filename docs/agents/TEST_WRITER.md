# Test writer

Guidance for agents writing or updating tests in the PalletSmith repo.

## Read first

- [GENERAL.md](./GENERAL.md) — project overview
- [TESTING.md](../TESTING.md) — test conventions and how to run

## Patterns

- **One test file per source module** — mirror `src/` path under `test/`
- **Use fixtures** — put shared test data in `test/__fixtures__/`
- **Known input/output** — for derivation tests, hardcode expected Base24 values for a known palette
- **Dark + light** — test derivation paths for both appearance modes
- **Plugin output** — verify each plugin produces valid files with expected keys

## What to cover

| Scenario | Example |
| --- | --- |
| Palette normalization | Input without `#` → output with `#` |
| Dark detection | Dark bg → appearance: "dark" |
| Light detection | Light bg → appearance: "light" |
| Base24 slot derivation | Known palette → expected base00–base17 |
| Token expansion | Base24 → expected semantic tokens |
| Plugin rendering | MasterSchema → valid plugin output |
| Config loading | YAML file → correct `ThemeSmithConfig` |
| Validation | Invalid hex → throws |

## Anti-patterns

- Skipping edge cases (transparent colors, near-black/white)
- Testing implementation details instead of contract
- Using magic numbers without comments explaining where they come from
- Forgetting to test both dark and light modes

## Verifying your work

```bash
bun run test
```
