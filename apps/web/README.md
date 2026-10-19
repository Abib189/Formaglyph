# Formaglyph web

Production foundation for Formaglyph’s Explore → Create → Review workflow.

## What is implemented

- Ranked catalog search with linkable query, category, and weight filters.
- Real SVG copy, Figma/Penpot metadata handoff, and candidate export with a resilient clipboard fallback.
- Versioned local persistence for draft and proposal state.
- Guarded proposal transitions from draft through review, changes, approval or rejection, publication, and deprecation.
- Candidate validation, review comments, recorded decisions, release history, audit inspection, light/dark themes, and responsive layouts.
- The original Formaglyph Core starter release with 12 concepts and 24 Regular/Solid SVG assets.
- Public REST API v1 with search, metadata, manifests, OpenAPI, and immutable SVG endpoints.
- Public stateless Streamable HTTP MCP with catalog tools, a scoped draft handoff, resources, and a selection prompt.
- Admin-issued project tokens stored as hashes with expiry, revocation, and audited text-only draft creation.
- Local Geometry candidate generation with no provider network request, sanitized SVG import, job provenance, cancellation, retry, and optional prompt retention.
- Strict TypeScript and automated tests for search, storage, and workflow rules.

Explore always includes the source-controlled `@formaglyph/icons` core release and overlays approved Supabase project icons by stable ID and variant. `@phosphor-icons/react` remains an MIT-licensed interface dependency; its glyphs are not published as Formaglyph catalog assets. The remaining V1 family, GPU-backed generation workers, hosted adapters, private project reads, and OAuth-based MCP authorization remain separate delivery milestones defined in the V1 PRD.

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
  data/         Original catalog adapter and initial workflow state
  domain/       Canonical application types
  pages/        Explore, Create, and Review routes
  services/     Search, persistence, SVG, and workflow rules
  state/        Application state provider and actions
```

The browser persistence service is an adapter boundary, not the final hosted datastore. A production backend can replace it without moving proposal policy into UI components. Canonical icon metadata, permissions, style rules, and proposal transitions come from the shared `@formaglyph/schema` workspace package.

The production Node server exposes REST at `/api/v1` and the MCP transport at `/mcp`. Catalog reads serve only the source-controlled Core release. The protected draft route exchanges a hashed, project-scoped token for a text-only draft through a least-privilege database function. See [`../../docs/mcp-cli.md`](../../docs/mcp-cli.md).
