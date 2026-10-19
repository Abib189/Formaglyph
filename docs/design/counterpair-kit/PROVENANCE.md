# Provenance and evidence

## Artwork

- Concept: C — Counterpair, selected by the owner from five logo types. Baseline: [`c-counterpair-v2.svg`](../logo-concepts/c-counterpair-v2.svg).
- Standard/reverse/small V3 drawings: original geometric refinements in `source/`. Two separate filled paths, genuine negative space, no borrowed third-party logo shapes.
- Lettering: native Figcraft `vector.flatten` export of installed Inter SemiBold at 100 px, -1.5 px tracking. The pre-custom outline is retained. `build-kit.py` redraws the F shoulder and composes the fixed lockups without introducing live fonts.
- Inter is by the Inter Project Authors and distributed under SIL OFL 1.1. Official [project](https://rsms.me/inter/) and [licence](https://github.com/rsms/inter/blob/master/LICENSE.txt) were checked during this work. The licence allows font use in logos/documents; the font software's redistribution conditions are distinct from artwork made using it. No font files are included here, and this kit does not claim Inter itself as original Formaglyph artwork.
- Other installed fonts appear only in the native type study. They are not distributed as font binaries or final logo alternatives.
- Repository licences are not changed by this design task. Source inspection and a visual reference library are not legal clearance or a guarantee of exclusive protectability.

## Process and tests

The logo-design skill influenced the geometry, type study, small/reverse cuts, two visual refinement passes, export packaging and guidelines. Prior concept research is retained rather than repeated as new evidence.

1. Compared the selected V2 to standard V3; opened lower counter and lightened horizontals while preserving silhouette.
2. Rendered standard, reverse and small cuts with the skill preview sheet; visually inspected the resulting raster. The sheet's direct white-on-white and black-on-black original-colour cells are intentionally invalid background demonstrations, not missing files.
3. Built and inspected native scale/reverse/mirror/rotation/blur diagnostics, minimum lockups and large curves. Actual-size drawings use native 16/24/32/48 px frames; downscaled board screenshots are not a physical device-size verification.
4. Reviewed 24 installed type families in title/lower/upper case; selected Inter SemiBold and redrew the F. Retained live base lettering and native outlines alongside the final outline.
5. Rendered product-placement boards and Workbench headers in both themes and mobile. Theme inversion is bound through the existing Text semantic variable for reusable header components. No screen interaction/backend certification is implied.
6. Ran the skill SVG structural audit on all final SVG masters. Symbol masters score 100/100; more complex full-name outlines receive informational complexity/width warnings. Scores are heuristics, not production, originality or legal certification.
7. Verified XML, closed filled master paths, no font/raster/filter/mask dependencies, palette, PNG dimensions/transparency, ICO sizes, webmanifest targets, maskable geometry and asset hashes with `test-kit.py`.

Not performed: independent fresh-person recall/meaning tests, formal trademark/name or reverse-image clearance, real print/Pantone/ICC proof, embroidery/laser fabrication tests, native iPad/iPhone validation, or a live production rollout. Do not convert these pending items into claims of completion.
