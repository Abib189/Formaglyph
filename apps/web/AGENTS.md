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

## Production foundation rules

- Keep application code strict TypeScript and preserve the current domain/component/page/service separation.
- Treat browser persistence as a replaceable repository adapter; do not couple page components directly to a hosted database.
- Proposal status changes must pass through the explicit workflow state machine. AI-generated candidates remain draft-only and may never auto-publish.
- Preserve stable icon IDs, provenance, licence, directionality, and version fields as first-class catalog data.
- Run typecheck, unit tests, production build, browser workflow verification, and comparison-based design QA before handoff.
