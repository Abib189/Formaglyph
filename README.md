# Formaglyph

Formaglyph is an open-source, AI-native system for finding, creating, validating, reviewing, and shipping coherent icon families.

The current repository contains the production core workflow through review and governance:

1. **Explore** — search and compare catalog icons by intent.
2. **Create** — generate or import candidates, validate them, and submit a proposal.
3. **Review** — inspect validation and provenance, add or resolve notes, and record approval, change, or rejection decisions.
4. **Govern** — allow an administrator to publish or deprecate an immutable, content-hashed version with a release and audit record.

AI-generated candidates are always drafts. Publishing, deprecating, syncing, and overwriting remain human-approved operations.

## Current status

This is an early production foundation, not yet the complete hosted platform or the full 100-concept Formaglyph V1 family. It includes:

- A strict TypeScript React application with responsive light and dark modes.
- Search, filtering, SVG copy/export, proposal validation, review comments, rejection, approval, publication, and deprecation flows.
- Deterministic XML parsing, SVG allow-list rebuilding, active-content rejection, normalized output, and structured validation issues.
- An original Formaglyph Core starter release: 12 concepts, 24 validated Regular/Solid SVG assets, and a content-hashed build manifest.
- Ranked core-catalog search with reviewed aliases, intent phrases, typo tolerance, category and weight filters, and true sibling-variant comparison.
- A versioned, read-only public REST API for search, metadata, OpenAPI discovery, manifests, and immutable SVG delivery.
- A self-contained npm-ready `@formaglyph/icons` release artifact with typed catalog and per-asset exports.
- An npm-ready `@formaglyph/cli` with human and JSON output, guarded SVG export, local stdio MCP, and a hosted Streamable HTTP MCP server.
- Four read-only MCP tools, catalog resources, and an icon-selection prompt for AI agents.
- A browser-local, deterministic geometry adapter that creates three sanitized Regular/Solid candidate pairs without sending prompts to a model provider.
- Safe SVG import, generation job cancellation and retry, prompt-hash provenance, optional prompt retention, and audited Supabase job transitions.
- Local-memory and Supabase repository adapters selected with `VITE_DATA_MODE`.
- Invite-only magic-link authentication, route guards, session restoration, and transactional onboarding.
- PostgreSQL tables, explicit Data API grants, RLS, private/public Storage policies, workflow RPCs, immutable audit events, migrations, seed data, and pgTAP tests.
- A permission-aware release changelog and audit trail with deprecation reasons and immutable content hashes.
- Unit tests for search, storage, and workflow policy.
- The approved V1 product requirements and architecture direction.

GPU-backed OmniSVG and StarVector workers, hosted generation, vector semantic search, authenticated/private API scopes, framework wrappers, and the remaining reviewed icon library remain planned milestones in the [V1 PRD](./docs/ai-native-icon-platform-v1-prd.md). The local creation adapter, public CLI, and public MCP access are live; private project agent access and write tools remain deliberately unavailable.

## Repository layout

```text
apps/web/               Production frontend foundation and design QA
docs/                   Product requirements and architecture direction
packages/schema/        Canonical contracts shared across every product surface
packages/validators/    Reusable SVG sanitizer and deterministic validation rules
packages/icons/         Original geometry, generated SVG assets, hashes, and metadata
packages/cli/           Public CLI, catalog client, and stdio/HTTP MCP server
supabase/               Local config, migration, seed data, and database tests
```

## Run the web app

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Verify the application with:

```bash
pnpm check
```

The default `.env.example` uses `VITE_DATA_MODE=local`, preserving the safe demonstration with no backend.

## Run the Supabase vertical slice

Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) directly from Docker (Homebrew is not required), launch it once, then copy `.env.example` to `.env.local` and set:

```dotenv
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key printed by pnpm supabase:start>
```

The CLI is an exact pinned development dependency. Resetting always rebuilds the database from committed migrations and development-only seed data:

```bash
pnpm supabase:start
pnpm db:reset
pnpm test:db
pnpm dev
```

Local Auth email is captured by Inbucket at `http://127.0.0.1:54324`. Public sign-up is disabled; invite beta users through Supabase administration. Hosted staging is provisioned in London (`eu-west-2`) as project `bbzjlqvjaocihczrandc` at `https://bbzjlqvjaocihczrandc.supabase.co`. Configure that URL and its current publishable key in Vercel; secret and service-role keys belong only in trusted server or CI environments. Development seed data is intentionally not applied to staging.

The production routes are `/explore`, `/sign-in`, `/auth/callback`, `/onboarding`, and project-scoped Workspace, Create, Review, and Settings routes under `/projects/:projectSlug`.

## Deploy the frontend to Railway

Railway builds the root `Dockerfile` and serves the Vite output with the production Node static server in `apps/web/server.mjs`. Add these service variables before the first deploy:

```dotenv
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://bbzjlqvjaocihczrandc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<current Formaglyph Staging publishable key>
```

The Dockerfile declares all three as build arguments because Vite embeds publishable configuration during the build. Do not add a Supabase secret or service-role key. Railway uses `/health` for deployment health checks and the server falls back to `index.html` for client-side routes.

The production app is [formaglyph.com](https://formaglyph.com/explore). The Railway-provided hostname remains available as a rollback path. Hosted Supabase Auth uses `https://formaglyph.com` as its site URL and allows exact callbacks for the canonical domain, `www`, local development, and the Railway fallback.

## Use the public catalog API

The versioned public API is available at [`/api/v1`](https://formaglyph.com/api/v1). It exposes only the source-controlled, MIT-licensed Formaglyph Core release and accepts only `GET`, `HEAD`, and CORS preflight requests. Private project data and privileged Supabase access are not proxied through this API.

```bash
curl "https://formaglyph.com/api/v1/icons?q=payment%20successful&variant=regular"
```

See [Public API v1](./docs/api-v1.md) for endpoints and caching behavior.

## Use the CLI and MCP server

The npm-ready CLI can search, inspect, and export public Core icons. The production MCP endpoint is `https://formaglyph.com/mcp` and exposes read-only tools, resources, and an icon-selection prompt without a key.

```bash
pnpm --filter @formaglyph/cli build
node packages/cli/dist/formaglyph.mjs search "payment successful"
```

See [Formaglyph CLI and MCP](./docs/mcp-cli.md) for remote agent configuration, local stdio setup, tools, and the security boundary. Registry publication remains a separately approved release action.

## Security model

- Every exposed table has RLS and explicit grants.
- Authorization comes from immutable membership rows, never editable user metadata.
- Contributors own drafts; reviewers and administrators may review only proposals authored by somebody else; only administrators publish or deprecate.
- Submit, review, comment resolution, publish, deprecate, generation, and onboarding operations write their audit event in the same database transaction.
- Published Storage objects use immutable ID/version paths and cannot be updated or deleted through the Data API.
- Public anonymous reads are limited to published icons in public projects and the matching public assets.

See [Review and governance](./docs/governance.md) for the lifecycle, permission matrix, release history, and audit boundary.

## Catalog assets

Explore ships the source-controlled Formaglyph Core starter release from `@formaglyph/icons`. The hosted repository overlays approved project icons by stable ID and variant, while the built-in core remains available if the team catalog is offline. Phosphor remains a development-only UI dependency for interface controls and prototype Create/Review candidates; its glyphs are not published as Formaglyph catalog assets.

Catalog, style, permission, and proposal contracts live in `@formaglyph/schema`. New APIs, MCP tools, CLI commands, and framework packages should consume those contracts rather than defining parallel models.

SVG safety and structural checks live in `@formaglyph/validators`. The package parses input as XML and rebuilds a new SVG from an explicit allow-list; scripts, event handlers, external resources, foreign markup, malformed XML, invalid viewBoxes, and unsafe attribute values never reach normalized output. Candidate persistence uploads only that normalized output and PostgreSQL prevents failed validation runs from entering review.

Original geometry and release metadata live in `@formaglyph/icons`. `pnpm --filter @formaglyph/icons assets` deterministically rebuilds the committed SVG tree and SHA-256 manifest; tests require every stable concept to have both Regular and Solid variants and pass the publication validator.

The `pack:check` scripts build and inspect both npm-ready packages without publishing them. Actual registry publication requires a separately approved release action and registry credentials.

## Licensing and trademark

- Platform source code is licensed under [Apache License 2.0](./LICENSE).
- Original Formaglyph SVG assets and generated framework packages are intended to use the [MIT License](./LICENSE-ASSETS).
- The Formaglyph name, logo, and brand identifiers are governed separately by [TRADEMARK.md](./TRADEMARK.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes and [SECURITY.md](./SECURITY.md) for responsible disclosure.
