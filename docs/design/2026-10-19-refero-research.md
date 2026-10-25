# Formaglyph — product/design research and Figcraft handoff

Date: 19 October 2026

Status: research complete; A approved for Figcraft design; editable design delivered, application implementation pending

Recommended direction: **A — Glyph Workbench**

Update: the owner accepted A with “yes”. The subsequent [Figcraft delivery](2026-10-19-figcraft-handoff.md) includes all five product areas, foundations/components, dark Explore, responsive layouts and recovery states. The original research-pass evidence and limitations below remain unchanged. Approval to explore the direction is not evidence of production implementation or usability validation.

## 1. Brief and evidence boundary

Designing the responsive Formaglyph web app for product designers, frontend developers and design-system maintainers. The goal is to find and export a suitable icon quickly, or take an original Regular/Solid pair through an accountable review and release.

Keep the existing technical character, white/black palette and rare `#A10232` accent. Support light and dark modes, iPad and mobile. The user likes the existing identity; the problem is product hierarchy and craft, not a request for a new brand. Model generation remains paused. Research first, choose a direction, then design editable screens in Figcraft; no application implementation in this pass.

Evidence collected:

- Live desktop inspection of [Formaglyph Explore](https://formaglyph.com/explore), including its default three-panel state.
- Live inspection of [Phosphor's catalog](https://phosphoricons.com/?size=28&weight=duotone), including its toolbar and icon grid. This is a browsing reference, not permission to copy its artwork or brand.
- Refero: 10 full screen-detail records, 11 screenshot inspections including two review-flow frames, and two full flows covering 21 described steps.
- Source inspection of Formaglyph's layout, five main pages, library registry, proposal contracts and PRD. Authenticated pages were **not** tested live. Source findings are not evidence of current production behavior.
- Refero's style search returned `NO_RESULTS` for four visual angles and the broader `minimalist` and `Linear` queries. No full style reference was retrievable. The system below is a **proposed synthesis of inspected screens, existing brand constraints and Refero craft guidance**, not a retrieved official component/token library. This gap must remain visible at the Figcraft handoff.
- Refero captures are reference snapshots, not proof of how those products work today. Some inferred descriptions/flow step names did not match the screenshot perfectly; visual observations take precedence. Font metadata is not a CSS audit. There were no user interviews or usability measurements.

## 2. The central product decision

**Explore is a visual discovery surface. Workspace and Review are operational surfaces. They should share a system, not a page template.**

The current live Explore viewport shows a narrow results list beside a large preview and a second large metadata panel. Its displayed result count is approximately 8.9k. Much of the first viewport explains one selected asset rather than exposing alternatives. That is a poor allocation for the first task: finding an icon. This is a heuristic finding, not a measured user-performance result.

The source also reuses oversized introductory copy, numbered panel headers and similar borders across very different jobs. That creates consistency, but weak priority. Changing only the font or radius would leave the underlying problem intact.

| Current evidence | Likely consequence | Proposed response |
| --- | --- | --- |
| Explore gives relatively little width to results | Slow visual scanning of alternatives | A uniform icon grid owns most of the viewport; inspector opens on deliberate selection |
| Large introductory copy and repeated system/panel numbers | Decorative hierarchy competes with work | Compact task titles; preserve technical labels only for real IDs, dimensions, versions or status |
| Preview and metadata have similar visual weight | No clear next action | Selection inspector: icon/name, available variants, copy/export, then provenance/details |
| Source already has a queue, paired previews and revision history | These are real strengths, not missing features to reinvent | Improve their priority and context; do not propose adding a queue as though none exists |
| Review source includes motion, history, comparison, activity and metadata panels | Too many simultaneous focal points | Static comparison and feedback first; history/details available on demand; motion optional |
| Account email and role exist in Settings source, but header only exposes utility icons | Identity/project context may be hard to find | A readable account/project menu; keep the existing Settings details |
| Settings mixes appearance, generation, agents, integrations and privacy | Different scopes and availability compete | Group personal settings separately from project administration; distinguish available, permission-blocked and planned |

## 3. Reference register: what each source earns

These are ingredients with bounded jobs, not a collage of brands.

| ID | Inspected reference | Useful observation | Adapt / reject |
| --- | --- | --- | --- |
| R1 | [Linear issue list](https://refero.design/pages/2a0adcf3-49d8-46e7-b14b-b37be32e850d) | Compact toolbar, grouped navigation, quiet rows and aligned identifiers/dates | Primary work-product foundation for A. Borrow density and hierarchy, not its team taxonomy or brand colors |
| R2 | [Miro icon picker](https://refero.design/pages/31a235e7-0a8d-4671-83e2-afd63e25dcdc) | Repeated, similarly sized visual items support scanning | Uniform icon specimens, not illustration/photo cards or the enclosing modal |
| R3 | [Hume library filters](https://refero.design/pages/c5e46ece-5c0d-469a-9551-752a6d2f2b79) | Search, library ownership tabs and visible applied filters sit together | A compact filter strip and clear reset. Do not import voice-specific fields or pill styling indiscriminately |
| R4 | [Hello Ivy asset/version viewer](https://refero.design/pages/a410f5dd-0d62-45c6-a5d8-b3130b114dd5) | Asset, version chooser and comments stay in one context | Foundation for focused review; no gradient imagery or assumed replace-in-place release behavior |
| R5 | [Hello Ivy comments/status view](https://refero.design/pages/f81922ed-0520-4a99-a185-84a8bee91f2c) | Version and state are near the asset; conversation is a separate rail | Persistent proposal context. No copied green approval color in the three-color system |
| R6 | [[untitled] filtered search](https://refero.design/pages/7c614cd9-6bd3-40fb-89a7-0d4789f5ad8e) | Restrained search and visibly selected filters; little decorative chrome | A search-led public library; reject circular artwork, excessive empty space and centered operational content |
| R7 | [Vercel project overview](https://refero.design/pages/6d76a703-a78f-4f38-a2ad-1796337d5ca7) | Workspace context, local navigation and high-contrast primary action are distinct | Dark-theme contrast/command hierarchy only. This capture includes a 2022 footer: not a current Vercel audit; no plan badge or marketing footer |
| R8 | [Visual Electric workspace settings](https://refero.design/pages/9684039b-d758-4c21-aeee-ff68ee61e9ba) | Settings navigation is separated from member identity and role | Group controls by scope, show email and role; do not turn long project administration into a cramped modal |
| R9 | [Mapbox brand guidelines](https://refero.design/pages/99e2fa3f-c4ff-4526-94a9-4d4882047dbc) | Rules are explained using specimens, clear-space examples and misuse examples | Design-system documentation anatomy for B and our foundations page; no Mapbox logo, blue CTA or Cera Pro copying |
| R10 | [Linear help/media overlay](https://refero.design/pages/cb07661a-3372-4bf9-80ce-4b308e947548) | The screenshot is an overlay containing a product image, not a clean task-list screen | Examined, then rejected as a primary foundation; use R1 instead |
| R11 | [Phosphor live catalog](https://phosphoricons.com/?size=28&weight=duotone) | A visible toolbar controls a large uniform icon field | Grid-first discovery and shareable display settings. Reject its cream canvas, promotional header and treating every third-party family as one style system |

### Journey references

- **J1 — [Wrike image review and annotation, 16 steps](https://refero.design/flows/1514):** the inspected frames corroborate a version rail and a separate comment rail around a dominant asset. Adapt persistent asset context and retrievable feedback. Do not copy the long onboarding tour, freehand drawing tools, desktop-editor promotion or timestamp/media-specific controls. Some step labels and frames are mismatched; do not treat the generated sequence as verified interaction testing.
- **J2 — [Fernand team invitation, 5 steps](https://refero.design/flows/11900):** invite preparation, role review and a pending-members state are distinct. Adapt the distinction between invited and joined when in-product invitations are implemented. A sent-email toast is not proof that a teammate joined. This is a future flow specification, not a claim that Formaglyph already implements team invitations.

## 4. Product structure

### Public: Explore

Search and browse published assets without a project-administration shell. Keep a compact brand header, clear route to Workspace and account access. Search, library, category and available weight filters sit above a **uniform** grid. Preserve filters, selected icon, variant and page in the URL; back navigation restores the user's place.

Selecting a tile opens an inspector without discarding the results. A persistent selected state must connect tile, inspector and copied variant. Do not silently select an off-screen, unrelated default asset. Before selection, either show the unselected grid or label an introductory specimen explicitly as an example.

Inspector order:

1. Actual icon name, source library and chosen variant.
2. Regular/Solid siblings or the source library's genuinely available weights.
3. Actual-size specimen strip and one explicit `Copy SVG` action; download and other formats are secondary.
4. Source-specific licence, native grid, version and provenance. Stable ID/hash/code details expand when needed.

The native source geometry is not rewritten for display. The current registry distinguishes Core, Phosphor, Lucide, Tabler and Heroicons; weights and native grids vary. Obtain the native grid from the individual asset/variant, not a family-wide default. Do not show an unavailable Solid, advertise all libraries as 24px, or apply Core's pair requirement to upstream browsing. The source registry also distinguishes MIT and ISC: show asset-specific licence information, not a blanket library-wide MIT claim.

### Signed-in: Workspace

An operational home, not a second public catalog. Show the active organization/project and current account/role before editing. Make `All`, `Drafts`, `In review` and `Published` easy to scan; keep less-common lifecycle filters in a visible filter control rather than nine equally prominent tabs.

Rows should answer: **what icon, which pair/revision, current state, last action, next permissible action?** Put release and audit detail behind a selected icon/activity view instead of a large permanent bottom section. Show a useful start state for an empty project, not zero-filled dashboard decoration.

### Create: a pair, not two unrelated assets

With generation paused, the honest primary entry is **Import SVG pair** or start a text brief. Generation should be a compact, clearly labelled unavailable capability, not the screen's dominant promise.

Use three task zones: brief, paired candidate canvas, contextual validation. Persist a visible draft state: saving, saved, offline/unsaved, failed. A selected candidate is a single object containing Regular and Solid. Put its name and revision next to the submit action: for example `Compact · Revision 2 · Regular + Solid`.

Required completeness and actionable validation failures come first; a passing checklist collapses to a summary with a route to detail. Submission is followed by a durable link to the exact proposal/revision, not just a disappearing toast. Do not implement fake generation progress or claim local geometry is model generation.

### Review: queue first, focused detail second

The existing queue remains a real destination for reviewers/admins. Contributors should also be able to find their own submissions and feedback; reviewer-only **actions** must not make their submission history undiscoverable.

Queue rows include icon/pair thumbnails, candidate name, revision, author, submitted time and status. A proposal opens at a stable address. Its header continuously identifies project, proposal, selected submitted candidate and target version.

Detail gives most width to a static baseline-versus-submission matrix:

- Row 1: Regular before / Regular after.
- Row 2: Solid before / Solid after.
- Explicit selectors identify the baseline and submitted revision. A new icon says **No published baseline**, rather than displaying an unrelated placeholder icon.
- A compact version rail restores earlier submissions; feedback stays reachable beside the comparison. Motion may be an optional inspection aid, never the default evidence of correctness.

Distinguish **leave a note**, **request changes**, **approve the pair**, and **publish a release**. Approval is a review decision, not publication. Preserve non-author review and admin-only publishing; the backend remains authoritative. Each blocked action explains why and gives the next valid step. The final publish summary identifies the immutable version and both variants.

**Contract gap:** current `ReviewComment` has no revision/variant anchor. Keep existing comments honestly labelled as proposal-level discussion. Persistent revision-specific or geometry-pinned feedback needs an explicit contract/backend change before implementation; do not imply that filtering the UI creates that guarantee.

The current source also makes the entire comment row a resolve/reopen button. Separate reading a comment from changing its resolution: expose an explicit Resolve/Reopen action. Clicking or selecting ordinary note text must not silently change the review state.

### Settings and identity

Separate personal appearance/account controls from project membership, visibility and agent credentials. A compact account menu should reveal the signed-in email and active role without requiring a hunt through settings; detailed account information already exists in the source and should be preserved.

Use accurate capability states: available, admin required, unavailable locally, planned, and paused. An agent draft token is not a publishing credential. Clipboard handoff is not connected Figma/Penpot synchronization. Future invitations need both pending and joined states; do not fabricate billing tiers or subscriptions.

## 5. Three reference-locked directions

### A. Glyph Workbench — recommended

**Foundation:** R1 Linear's compact work-product hierarchy, adapted to an icon tool. Preserve a white-first neutral canvas, concise toolbar, local project navigation, restrained separators and readable operational rows. Technical personality comes from the existing wordmark, actual icon names, measured specimens and version labels—not repeated `SYS.*` ornaments.

**Borrow only:** R11's grid-first discovery for Explore and R4's asset/version/feedback grouping for Review. Other references inform individual workflow details, not competing global visual systems.

**Media strategy:** real Formaglyph SVG pairs are the visual material. No stock photography, generated hero art, decorative gradients or invented customer evidence.

**Distinctive feature: the Family Proof strip.** Inspect the chosen pair at 16, 20, 24 and 32 CSS pixels, with an optional application-context example using a real button or menu item. Label the source's native grid separately. This turns the product's consistency promise into something users can judge, rather than a slogan.

**Proposed type roles:** retain JetBrains Mono for brand/asset identifiers, code and measurements; use Inter or a system sans for navigation, forms, rows and feedback. Remove routine serif prose from dense work surfaces. This is a proposed change to the current Newsreader/mono pairing and needs approval, not a silent rewrite.

**Reject:** generic analytics dashboard, hero-sized task headings, decorative panel numbering, default indigo, warm cream, all-card layouts and animated morphing as proof of correctness.

**Trade-off:** less theatrical than the current page intros; substantially clearer for repeated work. Best match to the combined public-library and team-governance product.

**Figcraft prompt:** Design a white-first icon workbench whose grid dominates Explore and whose paired static comparison dominates Review. Use the Formaglyph wordmark, rare burgundy selection details, compact sans UI and mono asset/measurement labels. Keep project administration out of the public catalog. Use actual Core SVGs, not placeholder shapes or generated artwork.

### B. Specimen Atlas — closest to the existing visual personality

**Foundation:** R9's rule-and-specimen documentation structure, interpreted as an icon-family catalog. Preserve generous white specimen fields, clear sectional type hierarchy and meaningful construction measurements. Use the user's existing mono/Newsreader pairing by role: mono identifiers, serif only for genuinely authored descriptive prose, not filter labels or routine status text.

**Borrow only:** R11's browsing controls and R6's low-chrome selection/filter treatment. Keep colors white/black/burgundy; no Mapbox blue or cream atmosphere.

**Media strategy:** actual paired SVG specimen plates; construction overlays only when requested. No photographs or faux diagrams.

**Memorable detail:** a selected family opens a paired specimen spread with small-size proofs and concise construction notes, resembling a useful type specimen rather than a metadata card wall.

**Reject:** giant marketing manifesto above results, centered operational forms, serif/italic word decoration and pretending optional construction lines are validation results.

**Trade-off:** strongest continuity and visual authorship, but lower information density and more scrolling for high-volume reviewers.

**Figcraft prompt:** Make an icon specimen atlas with white fields, actual Regular/Solid plates, mono identifiers and occasional readable serif construction notes. Preserve a compact search/filter band. Keep maintainer tasks compact and do not apply an editorial hero template to every route.

### C. Release Desk — review-led

**Foundation:** R4/R5 Hello Ivy's focused asset viewer: persistent object/version context, a dominant proofing surface and a separate conversation rail. Preserve its quiet header and strict separation between asset and discussion, not its example imagery.

**Borrow only:** R1's queue rows and J1's retrievable versions. The main UI uses a readable sans; mono is reserved for icon identifiers and release data.

**Media strategy:** immutable submitted SVG pairs and their real baselines. No synthetic versions or decorative motion.

**Memorable detail:** a compact before/after proof board stays connected to a revision ribbon and explicit release decision summary. Reviewers cannot mistake a candidate name or decision for the published release.

**Reject:** editor-sized controls, freehand drawing features, forced tours, hidden Solid variants and making public visitors navigate project administration.

**Trade-off:** excellent for an internal design-system team; less distinctive as a broad discovery destination. Choose it if private review is the product's main entry point.

**Figcraft prompt:** Create a review-led release desk with a compact queue, a focused paired SVG proof board, a revision ribbon and a feedback rail. Make approval and publication separate. Let public Explore remain a simple catalog rather than forcing it into the reviewer layout.

## 6. Proposed foundation for A

These are Formaglyph proposals, not exact tokens extracted from other companies. The existing `#FFFFFF`, `#000000`, `#A10232` brand constraint takes precedence over conflicting craft presets. Neutral values below are mixtures of black and white, not additional accent hues.

| Role | Light | Dark | Rule |
| --- | --- | --- | --- |
| Canvas / primary text | White / black | Black / white | Same hierarchy in both themes |
| Secondary text | Black at 60% on white (`#666666`) | White at 60% on black (`#999999`) | Readable metadata, not washed-out microcopy |
| Quiet surface | Black at 3% on white | White at 6% on black | Group or hover background only |
| Decorative separator | Black at 12% | White at 16% | Not the sole way to identify a control |
| Necessary control boundary | `#808080` against white | `#808080` against black | Keep distinguishable from the canvas |
| Primary action | Black with white text | White with black text | One dominant task action per surface |
| Accent | `#A10232` | Same base hue | Small selected-specimen/active-comparison detail; not every status or panel |
| Keyboard focus | Black outline with canvas gap | White outline with canvas gap | Never burgundy alone on black |

Calculated opaque sRGB contrast: burgundy/white approximately **8.17:1**, burgundy/black **2.57:1**. Thus burgundy text or a lone meaningful focus/selection boundary on black is insufficient. Dark mode needs the white focus/selection outline and a textual/shape cue. White text on an occasional burgundy fill remains legible. This calculation is not a full accessibility audit. See [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

- Keep burgundy below the existing approximate 3–5% visible-area ceiling; it is a maximum, not a quota. Success, rejection and permission states remain readable through words and icons, not extra colors or identical burgundy pills.
- Type starting points: 12px metadata, 14px compact UI, 16px inputs/prose, 20px section title, 28px task title. Weights 400/500/600. Mono is for identifiers, not entire instructions. No fake terminal codes.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Start at 24px desktop gutters and 16px mobile gutters. Values are proposals to test in actual frames, not measurements from Refero screenshots.
- Retain the familiar 8px control/panel radius; 4px for small status marks; no default shadows on page sections. Elevation is reserved for transient inspectors/menus/dialogs. Use separators and spacing instead of boxing every paragraph.
- Desktop rows/controls may be compact; touch hit areas should start at 44px. Inputs use readable mobile sizing. Every icon-only control has a label and keyboard access. Focus and selection are separate states.

### Component contracts to carry into Figcraft

| Component | Required variants/states | Interaction contract |
| --- | --- | --- |
| `IconSpecimenTile` | Default, hover, keyboard focus, selected, loading, asset failure | Selecting a tile does not copy or change variant silently. A separate copy control identifies the exact variant |
| `CatalogFilterBar` | No filters, applied filters, open control, no compatible weight, cleared | State is recoverable through URL/back navigation; changing library cannot leave an impossible weight selected |
| `PairSpecimen` | Regular+Solid complete, Regular missing, Solid missing, validation failure | One candidate identity owns the pair; absent geometry is labelled, never filled with a decorative stand-in |
| `ProposalQueueRow` | Unselected, selected, awaiting review, changes requested, approved, published | Row label and destination carry the same proposal, candidate, revision and submitted time |
| `RevisionSelector` | Latest selected, older selected, no baseline, unavailable asset | The displayed comparison names its actual baseline and proposed snapshot. History browsing cannot rewrite the submission |
| `ValidationSummary` | Waiting, errors, complete pair/passed, expanded rules | Failures expose corrective action; passing detail can collapse. Save/draft state is separate from validation state |
| `ProposalThread` | Empty, composed note, sending, sent, failed, resolved, read-only | Honest proposal-level scope. Explicit resolution control; failed sending retains the note |
| `ReviewDecisionBar` | Role-blocked, author-blocked, note-required, ready, pending, success, failure | Approval, request-changes and publication have distinct verbs/states. Publication is not optimistically reported before server success |
| `AccountProjectMenu` | Signed out, signed in, project/role changed, expired session | Email and active project are discoverable; the UI never silently moves an unsaved draft between projects |

Use the same role-based styling for these states in light and dark themes. A reusable component is not complete until its error, keyboard and permission states are represented. These are design contracts to validate against the backend during implementation, not proof of existing server support.

## 7. Decision ledger

| Decision | Source | Source role preserved | Why Formaglyph needs it |
| --- | --- | --- | --- |
| Different discovery and operations layouts | Live Explore + PRD + R1/R11 | Grid for visual choice; rows for lifecycle work | Browsing and reviewing are different jobs |
| Compact work-product shell | R1 | Navigation and action hierarchy | Reduce repeated introductory chrome |
| Grid owns Explore; inspector is contextual | R2/R11 + live audit | Comparable assets, then chosen-asset detail | Make alternatives visible before metadata |
| Filters adjacent to search with explicit reset | R3/R6 | Search narrowing, not ornamental pills | Make active constraints obvious |
| Real paired-size proof strip | PRD + original Core geometry | Asset evidence, not decoration | Let people assess family consistency at use sizes |
| Static paired before/after review | R4/R5 + user history + J1 | Asset/version context | Prevent old/new or Regular/Solid confusion |
| Comments honestly scoped | Current Proposal/ReviewComment contracts | Proposal discussion vs immutable revision | Do not fake revision-specific persistence |
| Approval and publishing remain separate | PRD + workflow contract | Different privileged actions | Avoid accidental-release expectations |
| Visible account/project context | R8 + Settings source | Identity and permission scope | Explain access and prevent wrong-project edits |
| Invite pending differs from joined | J2 | Delivery vs membership outcome | Prevent false success feedback; future capability only |
| Mono and sans have distinct jobs | R1/R4 + existing brand + Refero typography guide | Identifiers vs scanning/reading | Preserve identity without setting all UI in mono |
| Rare burgundy with accessible dark focus | User constraints + calculated contrast + W3C | Brand emphasis is not a universal status color | Maintain the palette without losing legibility |
| Foundations include do/don't specimens | R9 | Document rules through examples | A useful system, not a token mood board |
| Responsive disclosure and recoverable states | User iPad/mobile requirement + Refero craft guide | Focus, touch, navigation and error recovery | Clean desktop screenshots alone are insufficient |

## 8. States and scope that must be designed

### Must survive from the working product

Stable icon/proposal/candidate identities, source-specific licences, Regular/Solid pair gates for Core submissions, immutable publication, distinct role permissions and audit provenance. Visual permission affordances do not replace backend authorization. Preserve current functionality rather than replacing the app with a disconnected mock.

### Layout/client work to specify first

Grid/list mode and selected-asset inspector, clearer page hierarchy, account/project menu, readable token roles, compact validation, explicit copied-variant confirmation, URL/restoration behavior and responsive disclosure. Verify data availability before implementation; this is a design scope, not an implementation estimate.

### Additional backend work, not silently included

Revision/variant-anchored comments; geometric annotations; in-product membership invitations with delivery/joined/revoked states; new collection/saved-view persistence where not already provided. Draw future-only examples with an explicit scope label, not as available controls.

### Required state inventory

- Search: loading, populated, no results, filtered-empty, unavailable library, network failure, retry, selected icon and variant, copy success/failure. Clear filters and the typed query survive recoverable failures.
- Creation: no assets, partial pair, complete pair, validation error, saving, saved, unsaved/offline, submission pending/success/failure. A failed request retains the selected candidate and brief.
- Access: signed out, expired invite, wrong account/project, insufficient role, non-author review blocked. Explain what to do; do not expose raw database messages or silently take another person's draft.
- Review: empty queue, received proposal, new icon without baseline, changes requested, resubmitted revision, approved-but-unpublished, rejected and published. Do not show planned work as successful generation.
- Release: missing pair, validation failure, approval required, admin required, publish confirmation, publishing, success and retryable failure. No fake generic readiness badge.
- Identity/settings: active project, signed-in email, readable role, admin-only actions, paused generation, clipboard-only handoff, token reveal/revocation and unavailable capabilities.

## 9. Responsive design contract

Do not shrink the desktop three-panel layout onto every screen.

- **Desktop, 1440px reference:** compact project navigation where applicable, a broad results/work area, optional 320px inspector. Explore starts without three equal panels. Review prioritizes the paired comparison and feedback.
- **iPad, 1024px landscape and 768px portrait:** collapse navigation first; use an inspector drawer rather than forcing a narrow grid and two sidebars. Keep selection and pair completeness visible when the drawer changes. Test touch and keyboard, not hover alone.
- **Mobile, 390px plus a 320px stress frame:** begin with a three-column icon grid if names fit, reduce columns rather than truncating everything. Inspector becomes a full-height detail sheet with a persistent copy action. Review stacks Regular and Solid rows with labelled before/after columns; comments and history are explicit tabs. Preserve both variants and version identity, not a miniature desktop screenshot.
- Filter sheets retain applied values on close; dismissal returns focus. Avoid clipped decision bars behind mobile browser chrome or keyboards. Reduced motion keeps static comparison fully usable.

These are responsive proposals, not claims that the current live app was audited on these devices.

## 10. Figcraft production brief — approved and used for the design pass

No Figcraft document was modified in this research pass. Before drawing, read the chosen reference lock aloud in the board notes; label any reference/style-data gaps. Confirm Figcraft's current components, layout and style capabilities instead of assuming native theme-variable support.

Build reusable, editable text/vector components and real SVG specimen instances—not one flattened screenshot.

Suggested pages:

1. **Brief & evidence:** product jobs, reference links, chosen direction, rejected traits and scope boundaries.
2. **Foundations:** semantic light/dark colors, type roles, spacing, focus/selection and actual-size icon specimens with do/don't examples.
3. **Components:** search/filter strip, specimen tile, inspector, paired candidate, revision item, queue row, validation summary, comment and decision/release controls. Show relevant states, not only defaults.
4. **Explore:** unselected grid, selected inspector, search/no-results/error; 1440px, 1024/768px and 390px layouts.
5. **Workspace & Create:** lifecycle list, empty project, import/partial pair, selected complete candidate and submission feedback.
6. **Review & Release:** queue, exact proposal detail, baseline/new pair, revision history, proposal discussion and separate publish confirmation.
7. **Settings & access:** account/project context, role-aware settings, generation paused, access errors; invitation examples marked future-only.

Design Explore and one resubmission-review journey first. Those test the biggest structural choices before multiplying the design across five pages. Include at least one complete dark example and mobile decision/error state before approving the system.

### Acceptance tasks for the design review

Targets below require testing; they are not claimed results.

1. Find a suitable upload icon and copy the intended variant without losing search/filter context; target the PRD's under-30-second discovery goal.
2. Identify Core versus an upstream library and find its real licence and native grid.
3. Submit Compact revision 2 as a Regular/Solid pair; open the exact proposal and verify both variants match the submission.
4. Read feedback, compare against the prior submission and explain which comments are proposal-level versus revision-specific.
5. Explain approved versus published, who can perform each action, and what is blocking the next step.
6. Recover from network failure or an incomplete pair without losing the brief or selection.
7. Identify the signed-in account and project; complete selection/copy and review navigation using keyboard, then repeat core tasks on iPad/mobile.

Reject a design that passes the screenshot test but fails these tasks. Do not approve implementation with unresolved identity, wrong-revision, inaccessible-focus or lost-draft problems.

## 11. Original recommendation and gate

Choose **A — Glyph Workbench** unless preserving the current mono/serif specimen personality outweighs repeated-work efficiency; in that case choose B. Choose C only if internal review is the main product entry point.

The Refero skill shaped this pass through reference-first research, screenshot verification, explicit token roles and a decision ledger. Its style-search limitation is recorded rather than concealed. No UI code, production data, Docker services or Figcraft canvas changed. The next step is a user-selected direction, then editable Figcraft design and comparison-based QA—not immediate coding.

That paragraph records the end of the research-only pass. A was subsequently selected and designed in Figcraft; see the linked delivery for the current artifact and its QA boundaries. No application code or production services changed during the design pass either.
