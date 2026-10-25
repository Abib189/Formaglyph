# Formaglyph — Glyph Workbench in Figcraft

Date: 19 October 2026

Status: editable design delivered and approved; Glyph Workbench and Counterpair are now implemented in the app. Hosted deployment and real-device acceptance remain separate checks.

The owner approved direction A after the [Refero product research](2026-10-19-refero-research.md). That reference lock governs this file: Linear's compact work-product hierarchy, Phosphor's grid-first discovery, and Hello Ivy's asset/version/discussion grouping. These are bounded structural references, not copied branding or an official retrieved design system. Refero style search had returned no results; that limitation remains visible on the foundations board.

## Open the design

- [Native editable Figcraft document](formaglyph-glyph-workbench.figcraft)
- [Default catalog](glyph-workbench-catalog.png)
- [Selected-icon Explore preview](glyph-workbench-explore.png)
- [Paired revision review preview](glyph-workbench-review.png)
- [Mobile grid and inspector preview](glyph-workbench-mobile.png)
- [Exported semantic CSS variables](formaglyph-semantic-tokens.css) — a handoff artifact, not wired into the app.

The native document now has ten pages, 32 top-level boards/screens/overlays, 75 components, eight semantic color variables with Light/Dark modes, and five text styles. Text and vectors remain editable. Following the separate logo selection, the owner approved the [C — Counterpair identity kit](counterpair-kit/README.md); its semantic small mark and outlined wordmark now replace the prototype favicon/name in 20 design-header pairs. The former favicon master is retained. All library icon artwork comes from Formaglyph's own Core assets or the existing local-geometry source, not from upstream reference brands.

## Page inventory

| Page | Contents |
| --- | --- |
| 00 · Brief & foundations | Approved reference lock, real mode variables, typography roles, spacing, focus/selection and explicit do/don't rules |
| 01 · Icon components | 49 Core vector masters representing all 48 concepts plus the cloud-upload Solid sibling; four existing legacy Balanced/Compact review-fixture masters; app mark; 11 UI component masters with action/tile/validation/comment states |
| 02 · Explore | Default unselected 48-icon grid, selected pair inspector, complete inverse-dark selected state |
| 03 · Review journey | Five-row queue with exact candidate/revision/time, static R1/R2 Regular and Solid comparison, actual 16 px proofs, proposal discussion, required-note decision dialog, approved-not-published state and separate admin publish confirmation |
| 04 · Responsive & states | 390 px grid/inspector/review/offline-decision/search-empty/search-error; 1024 px iPad landscape, 768 px portrait and 320 px stress layouts |
| 05 · Workspace & Create | Compact lifecycle list, import-first complete-pair Create, incomplete-pair mobile state and exact-submission confirmation |
| 06 · Settings & access | Account/project/role, appearance choices, paused generation and honest handoff availability; wrong-account recovery; explicit-email account popover |
| 07 · Counterpair logo kit | Identity overview, fixed lockups, black/white/burgundy palette, ten reusable brand masters |
| 08 · Brand proofs & usage | Usage guide, six native product-placement studies, optical/scale/mirror/rotation/blur tests and maskable safe-zone proof |
| 09 · Wordmark type study | 24-family case study, live Inter construction, base outlines and custom-F final wordmark |

The workbench removes decorative panel numbering and oversized repeated introductions. Its technical personality comes from icon geometry, stable object context, measurements and meaningful mono labels. Burgundy is rare; selected dark specimens use a white boundary rather than relying on low-contrast burgundy against black.

## Prototype scope

Four starting points are configured: default catalog, selected Explore, resubmission review and mobile. There are 51 configured interactions, including navigation among the main desktop areas, the cloud-upload grid selection, queue-to-exact-revision review, account/settings access, submission/approval confirmations and the separate publication dialog.

These are **design-preview transitions**, not backend operations. Search, library/weight controls, clipboard, file import, free-form typing, publication and authentication are not implemented by this file. No real draft is submitted, SVG copied, review stored, account switched or asset published by a prototype click. The simulated approval journey changes from an author example to a reviewer example; it does not grant permissions.

Some secondary controls and alternate mobile tabs remain layout/state specifications rather than connected destinations. Do not describe this artifact as a fully working application. Configured destinations were checked structurally and a Figcraft presenter was opened; a complete mouse/keyboard walkthrough was not completed. The separate native-UI automation attempt timed out, so it is not counted as successful interaction testing.

## Typography and geometry evidence

- Inter is available in Figcraft and used for navigation, forms, action labels and discussion.
- JetBrains Mono is not available in the app's font inventory. Menlo is an explicit design-file fallback for the intended mono role, not an approved replacement for the production brand font.
- Real Core SVGs are imported as native editable vectors. Their native grid is 24 px; enlarged previews are display sizes, not rewritten geometry.
- The distinctive Family Proof strip places actual instances at 16/20/24/32 document pixels. Exports shown scaled to fit a screen cannot themselves prove physical CSS size on a device.
- Balanced/Compact comparison fixtures reproduce the existing source geometry and transforms from `apps/web/src/services/generation.ts`. No generation job, model provider or production record was invoked. The Compact silhouette is actually smaller; the comparison is not two identical placeholder icons labelled as changed.
- Example names, proposal IDs, dates, email and release metadata are design samples, not a production database snapshot. `abib@example.com` is intentionally non-production example data.

## Design QA completed

Source truth: approved A reference lock and product/security constraints in the research handoff.

Evidence: Figcraft native layer inspections plus rendered screenshots of desktop Explore in both themes, default grid, Review, Workspace, Create, Settings, component/foundation boards, mobile grid/inspector/review/offline decision, iPad layouts, 320 px stress frame, publication confirmation, incomplete pair and no-results recovery.

- Inspected the deep document tree (2,096 layer/page entries). No checked text exceeded its immediate frame bounds in the recorded check. This is a geometric check, not full text legibility or accessibility certification.
- Corrected two over-wide text boxes, a queue filter/result inconsistency, a crowded Create heading/label, duplicated default-grid proof instances and the unselected grid's inherited selected marker.
- Counterpair kit follow-up: checked the expanded 2,645-entry native tree before the final maskable proof addition; no visible text boxes exceeded their immediate frames. Checked 20 symbol and 20 wordmark instances, plus rendered dark/mobile headers. The separate kit test suite and SVG audit cover export integrity; no app runtime claims are added.
- Checked both variants and revision identities in static comparison; the baseline is explicitly a previous submission, not a fabricated published release.
- Verified Light/Dark semantic inversion and the non-burgundy dark selection boundary.
- Set the drawn touch action buttons to at least 44 px and provided 44 px header-menu hit frames. Native device browser, keyboard, VoiceOver, touch and reduced-motion behavior still require implementation testing.
- Checked all 51 configured actions for missing destination IDs: none found. This does not prove every preview gesture works.

No unresolved P0/P1/P2 findings were identified in the rendered states inspected. That statement is limited to this design pass. It does not certify the entire future app or states not represented here.

## Implementation handoff

1. Validate the reference lock and primary task flows with the owner before replacing live UI.
2. Start with Explore's unselected grid → selected inspector, keeping URL/filter state and source-specific licence/native-grid data intact. Do not normalize upstream families to Core's weights or grid.
3. Build the compact shared shell and discoverable account/project menu; bind its email and role to the authenticated session, not example data.
4. Implement exact candidate/revision routing and paired comparison using current repository contracts. Comments stay proposal-level until revision anchors exist in the backend.
5. Apply the lifecycle/import-first patterns without bypassing server validation, ownership checks, non-author review or admin-only publication. Keep recoverable local content on request failure.
6. Preserve generation pause, honest integration availability and immutable publication/provenance. Do not implement future invitations or native design-tool synchronization from visual hints.
7. Then run typecheck, unit/repository/database tests, build and browser QA against the implementation, including keyboard, real iPad/mobile, session restoration, screen-reader names, dark focus, offline recovery and safe deployment.

No app code, production Supabase/Railway settings, user records, Docker services or live deployments were changed by this design pass. Application tests/builds were not rerun because application source was not modified. The repository changes are design assets, this handoff and durable design-direction documentation only.

## Approved application implementation

The owner subsequently requested implementation of this Workbench and the selected Counterpair kit. The app now uses the exact exported small symbol/outlined wordmark, inverse theme assets, favicon, Apple icon and social card. `apps/web/src/workbench.css` is the explicit migration layer over the older functional control styles; UI text uses Inter and identifiers use JetBrains Mono.

Explore keeps an unselected grid until an explicit selection, source/weight/search/page/selection URL state, a contextual inspector, actual CSS-size proof specimens, verified SVG copy and paired download. Workspace uses a compact lifecycle list. Create imports two independently sanitized SVGs into one candidate. Review separates its queue from exact proposal detail, freezes submitted Regular/Solid snapshots, compares revision history and makes discussion resolution explicit. Review approval and admin publication use separate confirmation dialogs. Settings exposes actual account/project access and Light/Dark/System preferences. Generation remains paused; existing API/MCP capabilities remain intact rather than being replaced by mock controls.

Intentional differences from illustrative boards: live repository names/counts/versions/categories and source-specific native grids/weights/licences replace design samples; large upstream catalogs use 48-item pagination; provenance and existing design-handoff/motion controls remain available in collapsed detail sections. Native semantic dialogs provide focus containment, Escape and inert background content. Hosted archive/restore is not offered without a persisted repository operation. The local demo stores drafts and immutable submission snapshots separately and explicitly does not claim to create hosted assets.

Implementation evidence: TypeScript checks, all 84 web tests (serial rerun after a resource-related timeout), schema/validator/icon/CLI tests, production build and package dry runs passed. Chromium exercised local import → submission → requested changes → resubmission → R1/R2 comparison → approval → separate publication → Explore after reload, plus upstream copy, two-variant download, retry, themes, invalid proposal recovery and keyboard focus return. Desktop, 320/390 px mobile and 768/1024 px iPad-sized layouts were inspected. The built local preview also passed a cold-load smoke test without console errors. These are local browser and repository checks, not hosted multi-user authorization, database-security, physical iPad/Safari, screen-reader, trademark or live-deployment certification. No schema or hosted records were changed for this implementation.

A separate dependency audit reported 54 existing advisories (3 critical, 25 high, 24 moderate, 2 low) across the existing toolchain/MCP dependency tree. The UI dependency addition is pinned Inter; this change does not upgrade those existing packages. Functional/visual QA passing is not security clearance. Review applicability and perform a dedicated dependency upgrade/security pass before treating this as a production-approved rollout.
