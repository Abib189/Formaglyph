# Formaglyph

Formaglyph is an open-source, AI-native system for finding, creating, validating, reviewing, and shipping coherent icon families.

The current repository contains the production frontend foundation for the core workflow:

1. **Explore** — search and compare catalog icons by intent.
2. **Create** — generate or import candidates, validate them, and submit a proposal.
3. **Review** — inspect validation and provenance, comment, and approve through a guarded workflow.

AI-generated candidates are always drafts. Publishing, deprecating, syncing, and overwriting remain human-approved operations.

## Current status

This is an early production foundation, not yet the complete hosted platform or the original Formaglyph icon family. It includes:

- A strict TypeScript React application with responsive light and dark modes.
- Search, filtering, SVG copy/export, proposal validation, review comments, and approval flows.
- Versioned browser persistence behind a replaceable adapter boundary.
- Unit tests for search, storage, and workflow policy.
- The approved V1 product requirements and architecture direction.

The hosted API, PostgreSQL catalog, generation workers, CLI, MCP server, framework packages, and original reviewed icon library are planned milestones in the [V1 PRD](./docs/ai-native-icon-platform-v1-prd.md).

## Repository layout

```text
docs/                   Product requirements and architecture direction
formaglyph-prototype/   Production frontend foundation and design QA
```

## Run the web app

Requirements: Node.js 20+ and pnpm.

```bash
cd formaglyph-prototype
pnpm install
pnpm dev
```

Verify the application with:

```bash
pnpm check
```

## Seed catalog notice

The current interface uses `@phosphor-icons/react` as clearly identified development seed data. Those glyphs are not the original Formaglyph icon library and will be replaced by reviewed Formaglyph assets as the library is produced.

## Licensing and trademark

- Platform source code is licensed under [Apache License 2.0](./LICENSE).
- Original Formaglyph SVG assets and generated framework packages are intended to use the [MIT License](./LICENSE-ASSETS).
- The Formaglyph name, logo, and brand identifiers are governed separately by [TRADEMARK.md](./TRADEMARK.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes and [SECURITY.md](./SECURITY.md) for responsible disclosure.
