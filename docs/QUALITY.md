# Quality

## Type checking

```bash
bun run typecheck      # tsc --noEmit — reports type errors without emitting files
bun run build          # full TypeScript compilation to dist/
```

The project uses strict TypeScript with `noUncheckedIndexedAccess` enabled.

## Build

```bash
bun run build          # compiles src/ → dist/
```

Output goes to `dist/` with declarations, declaration maps, and source maps.

## GitHub Actions

CI runs on every push via `.github/workflows/`:
- TypeScript type check
- Test suite
- Build

## Before committing

1. Run `bun run typecheck` — no errors
2. Run `bun run test` — all passing
3. Run `bun run build` — compiles cleanly

## See also

- [TESTING.md](./TESTING.md) — test conventions and fixtures
- [.github/workflows/](../.github/workflows/) — CI workflow definitions
