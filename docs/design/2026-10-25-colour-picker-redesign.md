# Formaglyph colour control — reference lock

25 October 2026. Scope: the Explore colour editor, not a new application identity.

## Source of truth

The approved Glyph Workbench and [Counterpair guidelines](counterpair-kit/GUIDELINES.md) own the canvas, Inter/JetBrains Mono roles, neutral controls, 8px control radii and white/black/rare burgundy palette. The brand symbol and wordmark are not recoloured or redrawn. User-selected icon colours are output data, not new application accents.

Refero research refreshed for this request:

- Three style searches: monochrome technical tools; Linear/black-white typography; creative colour tools. Retrieved full **Figma** (`ad10c7eb-c0fe-4f8c-a9c4-89a783a973ff`, source [figma.com](https://figma.com)) and **Control** (`94565ee3-1022-4150-bec1-2863506e2951`, source [cntrl.site](https://cntrl.site)) references. These are Refero's extracted style guidance, not official component libraries or a live CSS audit.
- Full screen records and images: [Telegram colour customisation](https://refero.design/pages/368e5651-cbde-4ff7-81af-1da35854057e) and [Playbook colour selection](https://refero.design/pages/65c0a33e-35e5-402f-ae19-27bf5724fad4). The screenshots corroborate a saturation/value plane, hue slider, exact colour fields and bounded swatch selection. Search did not surface a suitable in-app Figma picker; do not claim one was inspected.
- Refero form/focus/touch craft guidance supplements the interaction implementation. No generated raster mockup is needed for this bounded, code-native control within an already approved design system.

## Decision ledger

| Decision                                                                      | Source and bounded role                                                                   | Rejected                                                                       |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Compact white/black utility panel, live icon specimen                         | Counterpair + Workbench; Figma's neutral structural frame lets output supply colour       | Marketing typography, Figma violet CTA, global pill shapes, gallery layout     |
| Spectrum and hue with exact hex, saturation and brightness values             | Telegram screenshot: colour editing controls only                                         | Chat UI, patterned background, green palette and Telegram branding             |
| Three labelled brand swatches                                                 | Counterpair's exact `#000000`, `#FFFFFF`, `#A10232`; Playbook's bounded selection pattern | Pantone/CMYK claims, giant palette grids, unrelated presets                    |
| Compact mono values and fine neutral separators                               | Workbench; Control contributes technical utility-label discipline only                    | Control's neon green/orange and zero-radius controls                           |
| Auto/fixed choice adjacent to the live proof                                  | Existing `currentColor` contract and user workflow                                        | Hidden reset, ambiguous preview-only selection, pretending Auto is a fixed hex |
| Mobile panel near the bottom, keyboard fields, native modal focus containment | Existing Dialog implementation plus Refero touch/focus guidance                           | Pointer-only colour editing or an OS picker as the sole interface              |

## Integrity and acceptance

Keep URL colour state, immutable catalog assets and source hashes unchanged. All preview surfaces, copy/design handoffs and downloaded siblings must still use the selected colour. Keep original opacity and licences. Proof backgrounds never become exported rectangles.

Verify spectrum dragging, hue and numeric keyboard edits, native picker, preset selection, invalid/shorthand hex, Auto/fixed switching, Escape/focus return, reload persistence, dark mode, 320px/mobile and desktop layouts, and actual Regular/Solid and upstream SVG file contents. Local Chromium evidence does not certify physical Safari/iPad or a production deployment.
