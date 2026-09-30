# Formaglyph

Formaglyph is an open-source, AI-native system for finding, creating, validating, reviewing, and shipping coherent icon families.

The current repository contains the production core workflow through agent handoff and governance:

1. **Explore** — search and compare catalog icons by intent.
2. **Create** — generate or import candidates, validate them, and submit a proposal.
3. **Review** — inspect validation and provenance, add or resolve notes, and record approval, change, or rejection decisions.
4. **Govern** — allow an administrator to publish or deprecate an immutable, content-hashed version with a release and audit record.
5. **Handoff** — let a scoped agent search the public catalog or create a text-only project draft for human completion.

AI-generated candidates are always drafts. Publishing, deprecating, syncing, and overwriting remain human-approved operations.

## Current status

This is an early production foundation, not yet the complete hosted platform or the full 100-concept Formaglyph V1 family. It includes:

- A strict TypeScript React application with responsive light and dark modes.
- Search, filtering, SVG copy/export, proposal validation, review comments, rejection, approval, publication, and deprecation flows.
- Deterministic XML parsing, SVG allow-list rebuilding, active-content rejection, normalized output, and structured validation issues.
- An original Formaglyph Core 0.2 release: 48 concepts, 96 validated Regular/Solid SVG assets, and a content-hashed build manifest. Explore supports the full library, intent/category/weight search, paired previews, copy, and version-labelled SVG downloads.
- Ranked core-catalog search with reviewed aliases, intent phrases, typo tolerance, category and weight filters, and true sibling-variant comparison.
- A versioned public REST API for catalog reads plus one scoped, text-only project draft endpoint.
- A self-contained npm-ready `@formaglyph/icons` release artifact with typed catalog and per-asset exports.
- An npm-ready `@formaglyph/cli` with human and JSON output, guarded SVG export, local stdio MCP, and a hosted Streamable HTTP MCP server.
- Four read-only MCP tools, one non-destructive draft handoff tool, catalog resources, and an icon-selection prompt for AI agents.
- Admin-issued, SHA-256-hashed project tokens with a 30-day default lifetime, immediate revocation, `drafts:write` scope, and transactional audit records.
- Figma and Penpot clipboard handoff with stable ID, version, variant, licence, and content-hash metadata embedded in the copied SVG.
- A browser-local, deterministic geometry adapter that creates three sanitized Regular/Solid candidate pairs without sending prompts to a model provider.
- Safe SVG import, generation job cancellation and retry, prompt-hash provenance, optional prompt retention, and audited Supabase job transitions.
- Local-memory and Supabase repository adapters selected with `VITE_DATA_MODE`.
- Invite-only magic-link authentication, route guards, session restoration, and transactional onboarding.
- PostgreSQL tables, explicit Data API grants, RLS, private source and published Storage buckets with scoped download policies, workflow RPCs, immutable audit events, migrations, seed data, and pgTAP tests.
- A permission-aware release changelog and audit trail with deprecation reasons and immutable content hashes.
- Unit tests for search, storage, and workflow policy.
- The approved V1 product requirements and architecture direction.

GPU-backed OmniSVG and StarVector workers, hosted generation, vector semantic search, full private read APIs, OAuth-based MCP authorization, framework wrappers, and the remaining reviewed icon library remain planned milestones in the [V1 PRD](./docs/ai-native-icon-platform-v1-prd.md). The local creation adapter, public CLI, public MCP reads, and scoped project draft handoff are live.

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

The versioned API is available at [`/api/v1`](https://formaglyph.com/api/v1). Public catalog routes combine the source-controlled, MIT-licensed Formaglyph Core release with complete, reviewed Regular/Solid releases from public Supabase projects. Private and incomplete project releases are excluded. `/agent/drafts` accepts a scoped project token and creates only a text brief with a human handoff URL.

```bash
curl "https://formaglyph.com/api/v1/icons?q=payment%20successful&variant=regular"
```

See [Public API v1](./docs/api-v1.md) for endpoints and caching behavior.

## Use the CLI and MCP server

The npm-ready CLI can search, inspect, and export public Core icons. The production MCP endpoint is `https://formaglyph.com/mcp`. Public reads need no key; `propose_icon_draft` requires a project token issued in Settings.

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
- Project-token secrets are shown once, stored only as SHA-256 hashes, expire within 90 days, and can create text-only drafts only.
- Published Storage objects use immutable ID/version paths and cannot be updated or deleted through the Data API.
- Public anonymous reads are limited to published icons in public projects and the matching public assets.

See [Review and governance](./docs/governance.md) for the lifecycle, permission matrix, release history, and audit boundary.

## Catalog assets

Explore ships the source-controlled Formaglyph Core starter release from `@formaglyph/icons`. The hosted repository overlays approved project icons by stable ID and variant, while the built-in core remains available if the team catalog is offline.

Explore also includes the complete pinned Phosphor Icons 2.1.1 release: 1,512 concepts / 9,072 SVGs in Thin, Light, Regular, Bold, Fill (shown as Solid / Fill), and Duotone. These are a separately labelled MIT-licensed upstream library, **not Formaglyph-authored Core assets or reviewed team releases**. Their original 256px grid, names, categories, provenance, and six weights are retained. `pnpm --filter @formaglyph/web libraries` deterministically builds the versioned `/libraries/phosphor/2.1.1-fg.1/` assets and catalogue from the pinned npm package; each asset is safety-checked, SHA-256 hashed, and carries the complete upstream copyright/permission notice. Generated files are ignored by Git and rebuilt in Docker. Copy and download retain the embedded notice, and design copies include library/source metadata. Explore loads catalogue metadata separately, fetches selected SVGs with hash verification, and renders at most 48 result rows at once.

Additional complete non-hidden collections are distributed through pinned Iconify JSON snapshots. Snapshot versions are explicitly labelled separately from upstream release versions:

| Library | Pinned distribution | Concepts | SVGs | Available styles / grid |
| --- | --- | ---: | ---: | --- |
| Lucide | `@iconify-json/lucide@1.2.137` | 1,856 | 1,856 | Regular / 24px |
| Tabler Icons | `@iconify-json/tabler@1.2.41` (upstream 3.48.0) | 5,166 | 6,220 | Outline + available Filled / 24px |
| Heroicons | `@iconify-json/heroicons@1.2.3` (upstream 2.2.0) | 324 | 1,288 | Outline + Solid / 24px; Mini Solid / 20px; Micro Solid / 16px |

Collections are fetched independently in parallel, so one failure does not hide other libraries. The library picker exposes only that library's actual styles, and previews never invent missing variants: Lucide has no Solid, not every Tabler icon has Filled, and eight Heroicons concepts have no Micro. Current icons are included exactly once per source/style; hidden deprecated geometry is excluded, while eligible upstream aliases remain searchable. Identical names across libraries use distinct IDs (`ico_lucide_camera`, `ico_tabler_camera`, etc.). Mini/Micro do not widen the Regular/Solid project submission schema.

The three new collections use committed upstream notices in `apps/web/scripts/notices/`, embedded intact in each SVG's `<desc>` and served independently as `/libraries/{library}/LICENSE.txt`. Lucide carries both its ISC notice and the inherited Feather MIT attribution. `/libraries/NOTICE.txt` indexes all sources/notices. Brand symbols may have separate usage requirements and imply no affiliation. Three Tabler assets use a narrow build-only local-path expansion before the unchanged SVG validator; user SVGs still cannot contain `<defs>` or `<use>`. All public third-party assets use immutable snapshot-versioned URLs and verified SHA-256 values.

Morphicons 1.6.0 is an MIT-licensed animation engine, **not another icon collection**. Compatible Core stroke previews have an optional menu-to-icon morph that respects reduced motion. Filled outlines (including Phosphor) remain static rather than being converted or misrepresented. Engine notice: `/libraries/morphicons/LICENSE.txt`. The REST API, CLI, MCP, and `@formaglyph/icons` package continue to expose original Core and eligible reviewed project assets; third-party Explore libraries are not repackaged as Formaglyph Core or inserted into private project workflows.

Catalog, style, permission, and proposal contracts live in `@formaglyph/schema`. New APIs, MCP tools, CLI commands, and framework packages should consume those contracts rather than defining parallel models.

SVG safety and structural checks live in `@formaglyph/validators`. The package parses input as XML and rebuilds a new SVG from an explicit allow-list; scripts, event handlers, external resources, foreign markup, malformed XML, invalid viewBoxes, and unsafe attribute values never reach normalized output. Candidate persistence uploads only that normalized output and PostgreSQL prevents failed validation runs from entering review.

Original geometry and release metadata live in `@formaglyph/icons`. `pnpm --filter @formaglyph/icons assets` deterministically rebuilds the committed SVG tree and SHA-256 manifest; tests require every stable concept to have both Regular and Solid variants and pass the publication validator.

The `pack:check` scripts build and inspect both npm-ready packages without publishing them. Actual registry publication requires a separately approved release action and registry credentials.

## Licensing and trademark

- Platform source code is licensed under [Apache License 2.0](./LICENSE).
- Original Formaglyph SVG assets and generated framework packages are intended to use the [MIT License](./LICENSE-ASSETS).
- The Formaglyph name, logo, and brand identifiers are governed separately by [TRADEMARK.md](./TRADEMARK.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes and [SECURITY.md](./SECURITY.md) for responsible disclosure.
