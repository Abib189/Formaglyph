# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Formaglyph prototype direction

- Build the selected Strategic Roadmap-inspired direction as five connected pages: Explore, Workspace, Create, Review, and Settings.
- Use a light-first editorial operational interface with JetBrains Mono for display/metadata and Newsreader for prose.
- Lock the palette to `#FFFFFF`, `#000000`, and `#A10232`; the burgundy accent must remain rare, about 3–5% of the visible interface.
- Preserve the compact modular hierarchy, thin borders, 8px radii, numbered panels, and technical system labels from the selected mockups.
- Support a true inverse dark mode while keeping the same hierarchy and restrained accent use.
- The primary workflows must be interactive: search/select/copy on Explore, candidate selection/validation/submit on Create, and review comments/approval on Review.
- Explore is the complete published catalog. Workspace is the durable home for user and team icons across draft, review, approval, publication, and archive states.
- Settings owns appearance, generation policy, local and hosted adapter controls, MCP and API access, design-tool integrations, and privacy. Keep the header theme toggle as a quick control.

## Research-first redesign request — 19 October 2026

- The owner likes the current identity but finds the UI/UX too generic. Improve hierarchy, task focus and interaction craft; do not substitute another generic visual template.
- Use the explicitly requested Refero design skill/MCP as the research authority, then design in Figcraft before implementing substantial visual changes.
- Research and reference locks are in [the research/Figcraft handoff](../../docs/design/2026-10-19-refero-research.md). The owner subsequently approved **A — Glyph Workbench** for Figcraft design. The editable file and design QA are documented in [the Figcraft delivery](../../docs/design/2026-10-19-figcraft-handoff.md). This is the redesign target; the existing app has not yet been visually migrated.
- Glyph Workbench uses grid-first Explore, compact task hierarchy, a contextual inspector with actual-size proof specimens, readable sans UI with mono identifiers, and exact Regular/Solid revision comparisons. Keep approval distinct from publication and label current comments as proposal-level discussion.
- Figcraft uses Inter and an explicitly documented Menlo fallback because JetBrains Mono is unavailable in that app. Preserve the intended JetBrains Mono role during implementation; do not silently treat the fallback as a brand-font replacement.
- Preserve white/black, rare `#A10232`, light/dark themes, responsive iPad/mobile use, truthful capability states and the paired Regular/Solid workflow. Model generation remains paused.
- The owner selected logo **C — Counterpair** on 19 October 2026 and approved its full kit. The [delivered identity kit](../../docs/design/counterpair-kit/README.md) contains the V3 standard/reverse/small masters, custom outlined title-case wordmark, lockups and web icons. It is integrated into the native Workbench design (pages 07–09, plus header examples), not the live app. This is separate from UI direction A. Keep its two-part silhouette; do not substitute the unselected A/E logos. Production rollout, physical print proof and trademark clearance remain separate approvals/checks.

## Production foundation rules

- Keep application code strict TypeScript and preserve the current domain/component/page/service separation.
- Treat browser persistence as a replaceable repository adapter; do not couple page components directly to a hosted database.
- Proposal status changes must pass through the explicit workflow state machine. AI-generated candidates remain draft-only and may never auto-publish.
- Preserve stable icon IDs, provenance, licence, directionality, and version fields as first-class catalog data.
- Run typecheck, unit tests, production build, browser workflow verification, and comparison-based design QA before handoff.
