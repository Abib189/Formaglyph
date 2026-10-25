# React handoff reference lock

## Brief and scope

Extend the approved Glyph Workbench inspector for developers consuming original Formaglyph Core. Keep generation paused. This is the first developer-delivery slice of PRD section 8.7: a real React 18/19 package, per-icon imports, deterministic archives and standalone components. Collections and registry publication are separate follow-ups; third-party artwork and private project releases are not repackaged.

## Research and build target

The existing Workbench/Counterpair system remains the primary build target: Inter UI, JetBrains Mono identifiers/code, white/black inverse themes, thin neutral separators, 8px controls and rare burgundy. No new page, hero, palette, illustration or brand direction.

Refero research used three style searches (monochrome developer documentation, Figma handoff, shadcn documentation), then full style references for [shadcn UI](https://ui.shadcn.com) (`c14c0a94-1037-449e-bf5b-4cb972656ac7`) and [SST](https://sst.dev) (`7b6c53c7-7145-476e-aed8-f2367eef3adb`). The concrete copy/code pattern comes from [TwelveLabs View code](https://refero.design/pages/3807da75-ab66-452d-82e9-48380c4789e5). Figma-specific screen results were unrelated security reviews and were not adopted.

| Decision | Reference | Adaptation and boundary |
| --- | --- | --- |
| Small contextual accordion | Existing Workbench inspector | Preserve preview-first hierarchy; no separate modal or navigation item. |
| Bounded monochrome code | SST code-editor role | Use code as functional content; reject its violet palette, hero and syntax colours. |
| Neutral controls and fine borders | Workbench + shadcn UI | Retain existing 8px control tokens, not shadcn's larger cards/pills. |
| Explicit copy/feedback | TwelveLabs View code + craft guide | Label copy targets, announce success/failure, retain keyboard focus. No blurred modal or language dropdown for one framework. |
| Truthful installation | Repository's unpublished-package boundary | Install a real hash-addressed archive; never imply npm registry publication. |
| Selection-aware usage | Existing colour/variant contract | Code follows selected Regular/Solid, size and colour. Standalone defaults match; the full package stays currentColor. |

Media is real SVG geometry and generated code only. No image generation is needed. This is a small extension of an approved design-system surface, not substantial visual exploration requiring a new Figcraft direction.

## Acceptance

Compare local desktop/mobile light/dark inspector screenshots with the existing shell. Exercise selection, copy, archive/component downloads, loading/retry, keyboard focus and dismissal. Independently install the archive into React 18 and React 19 consumers, typecheck it, compare all 96 rendered geometries, and verify a single import excludes unrelated geometry. No npm publication or model/server provisioning is authorized by this slice.
