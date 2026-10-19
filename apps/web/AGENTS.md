# Frontend Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Formaglyph implementation direction

- Implement the approved Glyph Workbench across Explore, Workspace, Create, Review, and Settings. The earlier Strategic Roadmap prototype is historical, not the current visual target.
- Use a light-first operational interface with Inter for readable UI and JetBrains Mono for icon names, identifiers and measurements. Do not restore the former Newsreader prose or oversized mono introductions.
- Lock the palette to `#FFFFFF`, `#000000`, and `#A10232`; the burgundy accent must remain rare, about 3–5% of the visible interface.
- Preserve the compact task hierarchy, thin neutral separators, 8px control radii and contextual specimen inspector from the approved native design. No decorative panel numbering or repeated giant introductions.
- Support a true inverse dark mode while keeping the same hierarchy and restrained accent use.
- The primary workflows must be interactive: search/select/copy on Explore, candidate selection/validation/submit on Create, and review comments/approval on Review.
- Explore is the complete published catalog. Workspace is the durable home for user and team icons across draft, review, approval, publication, and archive states.
- Settings owns appearance, generation policy, local and hosted adapter controls, MCP and API access, design-tool integrations, and privacy. Keep the header theme toggle as a quick control.

## Research-first redesign request — 19 October 2026

- The owner likes the current identity but finds the UI/UX too generic. Improve hierarchy, task focus and interaction craft; do not substitute another generic visual template.
- Use the explicitly requested Refero design skill/MCP as the research authority, then design in Figcraft before implementing substantial visual changes.
- Research and reference locks are in [the research/Figcraft handoff](../../docs/design/2026-10-19-refero-research.md). The owner approved **A — Glyph Workbench** and then requested its app implementation. The editable source is documented in [the Figcraft delivery](../../docs/design/2026-10-19-figcraft-handoff.md). The shared shell and five page surfaces now implement this direction; future edits should preserve it rather than start a new visual exploration.
- Glyph Workbench uses grid-first Explore, compact task hierarchy, a contextual inspector with actual-size proof specimens, readable sans UI with mono identifiers, and exact Regular/Solid revision comparisons. Keep approval distinct from publication and label current comments as proposal-level discussion.
- Figcraft uses Inter and an explicitly documented Menlo fallback because JetBrains Mono is unavailable in that app. Preserve the intended JetBrains Mono role during implementation; do not silently treat the fallback as a brand-font replacement.
- Preserve white/black, rare `#A10232`, light/dark themes, responsive iPad/mobile use, truthful capability states and the paired Regular/Solid workflow. Model generation remains paused.
- The owner selected logo **C — Counterpair** on 19 October 2026 and approved its full kit and app implementation. The [delivered identity kit](../../docs/design/counterpair-kit/README.md) contains the V3 standard/reverse/small masters, custom outlined title-case wordmark, lockups and web icons. The app uses exact exported SVGs from `public/brand`, plus the supplied favicon/Apple/social assets. This identity is separate from UI direction A. Keep its two-part silhouette; do not substitute the unselected A/E logos. Deployment verification, physical print proof and trademark clearance remain distinct checks.
- Preserve actual library names, counts, grids, weights and licences instead of copying illustrative design-file metadata. Pair submission applies to Formaglyph releases, not to invented variants for upstream libraries.
- Generation is paused in Create and Settings. Import Regular and Solid into one candidate; never infer the missing sibling. Keep exact proposal routes, immutable submission history, explicit comment resolution, historical read-only decisions and separate publication confirmation.
- Keep local demo snapshots and hosted repositories separate. Local publication creates no hosted Storage asset. Do not expose hosted lifecycle actions that lack a persisted repository operation.
- Keep Explore's desktop filter sidebar viewport-bounded and independently scrollable. Long upstream category lists must not stretch the paginated icon grid or create a large blank tail below it. Preserve keyboard access and the mobile filter dialog.
- Pin the Explore title/search/filter area directly beneath the main navigation while browsing. Sidebar and desktop inspector offsets must follow its rendered height so they never sit beneath the pinned controls; retain responsive mobile dialogs.

## Production foundation rules

- Keep application code strict TypeScript and preserve the current domain/component/page/service separation.
- Treat browser persistence as a replaceable repository adapter; do not couple page components directly to a hosted database.
- Proposal status changes must pass through the explicit workflow state machine. AI-generated candidates remain draft-only and may never auto-publish.
- Preserve stable icon IDs, provenance, licence, directionality, and version fields as first-class catalog data.
- Run typecheck, unit tests, production build, browser workflow verification, and comparison-based design QA before handoff.
