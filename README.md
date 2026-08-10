# toen-content

Canonical Markdown event catalog for Toen.

## Commands

- `pnpm test` — run focused catalog tests.
- `pnpm biome` — check formatting and lint rules.
- `pnpm typecheck` — type-check TypeScript.
- `pnpm validate` — validate every file in `content/events`.
- `pnpm verify` — run all checks used by CI.

Event filenames must be lowercase kebab-case with a `.md` extension. Each document needs strict YAML frontmatter matching catalog schema and a non-empty Markdown body.
