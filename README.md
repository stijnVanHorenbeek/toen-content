# toen-content

Canonical Markdown event catalog for Toen.

## Commands

- `pnpm test` — run focused catalog tests.
- `pnpm biome` — check formatting and lint rules.
- `pnpm typecheck` — type-check TypeScript.
- `pnpm validate` — validate every file in `content/events`.
- `pnpm verify` — run all checks used by CI.

Event filenames must be lowercase kebab-case with a `.md` extension. Each document needs strict YAML frontmatter matching catalog schema. Optional `topicLabels` entries must refer to selected topic IDs.

Markdown bodies can contain paragraphs, level-two and level-three headings, emphasis, strong emphasis, title-free HTTP(S) links, block quotes, ordered or unordered lists, and hard line breaks written with two trailing spaces. Other Markdown is not canonical and fails validation.

Catalog validation also enforces release bounds: at most 10,000 events; 65,536 bytes per document; 160-character titles; 500-character summaries; 20,000-character bodies; and at most 16 topics, profiles, or sources. Topic/profile/source identities must be unique, and visible labels for one topic must agree across catalog. Reads use bounded concurrency. `tests/fixtures/release-parity-event.md` is hashed in both repositories to protect Beat V2 schema parity.
