# Formaglyph logo exploration — 19 October 2026

Status: owner selected **C — Counterpair** on 19 October 2026. Direction approved for refinement; full kit and production rollout not yet approved.

## Brief and assumptions

Formaglyph is an icon library and accountable creation/review workbench for designers, frontend developers and design-system teams. The accepted UI direction is precise, calm and operational. The logo should feel **crafted, clear, systematic, independent and quietly confident**, with no claim that models are currently generating assets. The exact name stays Formaglyph. The owner is the decision-maker.

Preserve white/black and the rare `#A10232` accent; test silhouette in black first. It must serve a 16–32 px browser/app mark and a readable header lockup. No existing mark is being removed from the app. Treat current F favicon as provisional equity, not evidence of established public recognition. Five directions override the skill's default three; full kits wait for a choice.

## Research

The logo-design library currently contains 1,432 entries. Its developer-tools filter contains 295; design-creative contains 35. This is a curated teaching library, not a representative market survey. The developer-tool entries favor containment, negative space and monoline construction; design-creative spans wordmarks, abstract marks and pictorial marks. Frequency signals familiarity, not effectiveness.

Studied SVG construction in Pagekit, npm, Framer, Figma and Precursor: shared contours and open counters can be memorable, but their specific silhouettes are off-limits. The local subject search also surfaced Flight and Flannel for letter F, Jade for stamp, and Open Source/OSHWA/Passbolt for key-like forms. These are study/similarity checks, not trademark clearance.

Official sources checked:

- [Figma brand usage](https://www.figma.com/using-the-figma-brand/): brand assets are identifiers, not ingredients to incorporate in our mark. Avoid its circle/half-round F arrangement and its name/identity.
- [Lucide](https://lucide.dev/): consistency, clarity and source-specific identity are important category promises. Do not turn a generic UI icon into Formaglyph's identifier.
- [Phosphor](https://phosphoricons.com/): direct text rendering exposes only a JavaScript fallback; earlier product research is not a fresh visual logo audit. Do not infer an unavailable image from page text.
- Penpot's `/brand` URL was unavailable through the research tool. No current brand-guideline claim is derived from it.

Category clichés to avoid: default cube/hexagon, sparkle/AI wand, generic pen-nib icon, thin construction-grid decoration, stock F in a rounded tile, generic approval checkmark, and multi-color modular F resembling Figma or Framer. Black/white is an existing constraint, not by itself an originality claim.

## Word map

- Form: shape, counter, shoulder, joint, aperture, cast.
- Glyph: letter, sort, punch, proof, cut, sign.
- Family: shared stroke, pair, relation, repeated logic.
- Workbench: deliberate fit, review, durable cut, authored mark.
- Opposites: solid/open, ink/counter, independent/related, raw/refined.

Intersections worth exploring: an open-shouldered F; F/G sharing a structural stroke; related positive/negative forms; a type-cutting tool as an authorship metaphor; a custom name whose counters seed a compact G.

## Longlist and selection

Scores are designer heuristics, not user-test results. Five dimensions, each 1–5: idea clarity / distinction / simplicity / relevance / small-size strength.

| Idea | Type | Score | Decision |
| --- | --- | --- | --- |
| An F whose shoulder opens as a deliberately unclosed counter | Letterform | 5/4/5/5/5 | Build A |
| F and G share a structural stem rather than being woven initials | Monogram | 4/4/4/5/4 | Build B |
| Two related counter-bearing pieces become one asymmetric family sign | Abstract | 4/4/5/5/4 | Build C |
| A type punch turns the act of making a glyph into an authored object | Pictorial | 4/4/5/4/4 | Build D; test key/popsicle readings |
| A custom-cut Formaglyph name supplies its own G favicon companion | Wordmark-led | 5/4/4/5/4 | Build E |
| A constellation of square icon cells forms a generic F | Abstract | 3/2/3/4/3 | Reject: grid cliché |
| A pen nib contains a tiny checkmark | Pictorial | 4/1/2/3/2 | Reject: literal and crowded |
| A bracket frame surrounds a dot as a selected glyph | Abstract | 3/2/5/4/4 | Reject: familiar editor cue |
| A circular approval badge encloses FG | Emblem | 4/2/3/3/2 | Reject: certification claim/scale |
| An ink-drop mascot suggests playful creation | Mascot | 3/3/2/2/2 | Reject: tone and detail |

## Construction intent

All symbol studies use a 256-unit square, single black fill and meaningful transparent space. A uses a stout F and a curved open shoulder. B combines two positive, readable letter structures; C relates two stepped pieces rather than using a generic cube. D uses a single beveled tool silhouette and one open counter. E uses custom outlined capitals and an extracted G, not a stock-font logotype. Concept-only neutral name labels in the Figcraft presentation are live Inter text; the actual symbol masters and custom E wordmark are paths.

No legal clearance is claimed; independent trademark and reverse-image searches are required before launch. No full identity kit, application replacement, production favicon or usage standard is approved at this checkpoint.

## Two rounds of testing and refinement

Round 1: ran the supplied SVG audit on all five symbols and the custom wordmark, rendered the five-way concept overview, inspected it, and reviewed the outlined wordmark. The audit caught the wordmark's right-edge overflow and near-clean M/Y diagonals. The FG silhouette initially looked like an A joined to G; it failed the letter-reading test despite structurally valid SVG. Audit scores cannot catch this semantic problem.

Round 2:

- **A — Open Shoulder / letterform:** opened the hook terminal from y104 to y96; thinned the horizontal middle stroke from 40 to 36 units. Most direct relationship to the provisional F, and the starting recommendation. A single letter is crowded territory: distinction still depends on its particular shoulder and proportions.
- **B — Common Stroke / monogram:** opened the space above the shared crossbar so F does not form an accidental A. Balanced margins at 16 units each. FG reads more clearly, but is the densest option at 16 px.
- **C — Counterpair / abstract:** shortened the upper terminal by four units and retained a robust 40-unit gap/weight logic. The least literal family identifier, but can read as a 5; it needs name association rather than a long invented explanation.
- **D — Type Punch / pictorial:** broadened the head and inner counter. Shape survives reduction; the tool metaphor is not guaranteed to be recognised and could be mistaken for a key. This is a real selection risk, not a resolved user-test result.
- **E — Cutline / wordmark-led:** widened the viewBox from 898 to 934 units, corrected M/Y diagonals and centred the proposed G extract. The primary logo is the custom-drawn full name. Its proposed G companion is what appears in the small-size ladder; shrinking the whole wordmark to 16 px would not be legible. A generic G carries less ownership until refined further.

All six v2 artwork files (five symbols/companion cuts plus the full E wordmark) scored 100/100 in `svg_audit.py`, with no reported structural warnings. This is a heuristic code/geometry score, **not production readiness, distinctiveness or legal certification**.

Generated and inspected the skill's side-by-side/shelf HTML test using Framer, Figma, Pagekit and npm as reference marks. Those reference images remain in temporary research files, not in the deliverable. The proposed forms differ visibly from this narrow sample; the sample is not a global similarity search. Also inspected the native Figcraft proof board: black, white-on-black, 16/24/32 px, mirror, 180° and header/browser-tab contexts. No obvious offensive reading was identified in that inspection; no independent cultural or audience review was conducted.

Reversed concept proofs currently reuse the black geometry, so irradiation correction remains part of refinement after selection. No dedicated reversed production cut, platform icon kit, print proof, Pantone specification, CMYK test, physical-device test or final minimum-size standard was produced.

## Editable Figcraft delivery

[Open the native design](../formaglyph-logo-concepts.figcraft) · [Five-direction overview](five-directions.png) · [Proof board](proof-tests.png)

The separate Figcraft file preserves the approved UI design unchanged. It contains:

1. **Choose a direction:** five types on a black-and-white comparison board, including E's complete custom wordmark and explicit G-companion label.
2. **Vector studies & revisions:** 12 editable vector components retaining both meaningful iterations, with notes describing the actual corrections.
3. **Small-size & context tests:** side-by-side proofs with honest risks for each choice and application-header examples, not a full identity presentation kit.

Four semantic variables support Light/Dark proofs. Native inspection covered 351 page/layer entries and found no checked text outside its immediate frame. The six v2 artwork masters are paths without live text, rasters, filters or masks. Neutral Inter labels in the presentation are live text, not final proposed A–D wordmarks; no font binary is redistributed. Final supporting typeface choice/licence review belongs to the approved kit stage.

The logo skill shaped this work through a written brief, category/cliché research, ten scored idea statements, five genuinely different selected types, preserved iterations, two render/audit rounds, small-size proofs and this explicit concept checkpoint. No logo was selected on the owner's behalf or applied to production. The owner subsequently chose C; final lockups, colour versions, refined reverse art, favicon/app-icon assets and a usage guide remain the next stage.

## Owner selection

The owner's answer was “c”. The selected logo direction is **C — Counterpair**, currently represented by `c-counterpair-v2.svg`. Preserve its two-part silhouette as the refinement baseline; do not silently revert to the designer's initial A recommendation. The Figcraft overview now marks C as selected while retaining all other studies.

This logo choice is distinct from UI direction **A — Glyph Workbench**. It does not authorize changing the live application's logo or establish trademark clearance. The abstract mark's possible numeral-5 reading and small-size/optical refinement remain explicit considerations for the next stage.
