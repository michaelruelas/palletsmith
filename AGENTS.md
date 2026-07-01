# AGENTS

Read this first when working on PalletSmith.

## Project

A TypeScript-first theme builder that converts a 13-color palette into native themes for Zed, Ghostty, VS Code, Chrome DevTools, and OpenChamber.

Full overview: [README.md](./README.md).

## Specialized agent guidance

Do not duplicate guidance here. Read the relevant file under [docs/agents/](./docs/agents/README.md):

| Task | File |
| --- | --- |
| General (always read first) | [docs/agents/GENERAL.md](./docs/agents/GENERAL.md) |
| Reviewing a PR or diff | [docs/agents/CODE_REVIEWER.md](./docs/agents/CODE_REVIEWER.md) |
| Writing or updating tests | [docs/agents/TEST_WRITER.md](./docs/agents/TEST_WRITER.md) |

## Shared docs

[docs/README.md](./docs/README.md) is the index.

## Before committing

1. `bun run typecheck` — no errors
2. `bun run test` — all passing
3. `bun run build` — compiles cleanly
