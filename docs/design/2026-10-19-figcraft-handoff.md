# Formaglyph — Glyph Workbench in Figcraft

Date: 19 October 2026

Status: editable design exploration delivered; app implementation and end-user validation pending.

The owner approved direction A after the [Refero product research](2026-10-19-refero-research.md). That reference lock governs this file: Linear's compact work-product hierarchy, Phosphor's grid-first discovery, and Hello Ivy's asset/version/discussion grouping. These are bounded structural references, not copied branding or an official retrieved design system. Refero style search had returned no results; that limitation remains visible on the foundations board.

## Open the design

- [Native editable Figcraft document](formaglyph-glyph-workbench.figcraft)
- [Default catalog](glyph-workbench-catalog.png)
- [Selected-icon Explore preview](glyph-workbench-explore.png)
- [Paired revision review preview](glyph-workbench-review.png)
- [Mobile grid and inspector preview](glyph-workbench-mobile.png)
- [Exported semantic CSS variables](formaglyph-semantic-tokens.css) — a handoff artifact, not wired into the app.

The native document has seven pages, 26 top-level boards/screens/overlays, 65 components, eight semantic color variables with Light/Dark modes, and five text styles. Text and vectors remain editable. The existing app favicon supplies the app mark; no new logo was generated. All icon artwork in the document comes from Formaglyph's own Core assets or the existing local-geometry source, not from upstream reference brands.

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
