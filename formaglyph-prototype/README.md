# Formaglyph web

Production foundation for Formaglyph’s Explore → Create → Review workflow.

## What is implemented

- Ranked catalog search with linkable query, category, and weight filters.
- Real SVG copy and candidate export with a resilient clipboard fallback.
- Versioned local persistence for draft and proposal state.
- Guarded proposal transitions: draft, in review, changes requested, and approved.
- Candidate validation, review comments, approval, light/dark themes, and responsive layouts.
- Strict TypeScript and automated tests for search, storage, and workflow rules.

The current catalog is clearly identified seed data for product development. Formaglyph’s original reviewed icon family, hosted authentication, PostgreSQL catalog, object storage, generation workers, REST API, and MCP server remain separate delivery milestones defined in the V1 PRD.

The visible development seed glyphs are provided through the MIT-licensed `@phosphor-icons/react` dependency. They are not the original Formaglyph icon family.

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:4173/` when the development server is running on the handoff port.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

The visual comparison record is in [design-qa.md](./design-qa.md).

## Architecture

```text
src/
  components/   Shared shell and icon-preview primitives
  data/         Typed seed catalog and initial workflow state
  domain/       Canonical application types
  pages/        Explore, Create, and Review routes
  services/     Search, persistence, SVG, and workflow rules
  state/        Application state provider and actions
```

The browser persistence service is an adapter boundary, not the final hosted datastore. A production backend can replace it without moving proposal policy into UI components.
