# Code reviewer

Checklist for reviewing PRs and diffs in the PalletSmith repo.

## Read first

- [GENERAL.md](./GENERAL.md) — project overview and conventions
- [ARCHITECTURE.md](../ARCHITECTURE.md) — pipeline understanding

## Review checklist

- [ ] Types are strict — no `any`, no unsafe casts
- [ ] Color values are normalized (always `#` prefix)
- [ ] New plugins follow `definePlugin()` pattern
- [ ] New palette presets include 13 required colors
- [ ] Tests cover new derivation paths
- [ ] No changes to `dist/` or `node_modules/`
- [ ] Path aliases used instead of relative imports where `@palletsmith/*` exists
- [ ] Exports are named, not default

## Anti-patterns

- Modifying `src/core/color.ts` without updating tests for every utility function
- Adding plugins that don't call `definePlugin()`
- Hard-coding color values instead of deriving them
- Breaking changes to `MasterSchema` without updating all plugins

## Verifying your work

```bash
bun run typecheck && bun run test && bun run build
```
