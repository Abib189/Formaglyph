# Formaglyph / Counterpair logo kit

Version 1.0.0 · 19 October 2026 · selected direction **C**

Two independent forms become one recognisable signature. The owner selected C and explicitly approved this full kit. UI direction A remains Glyph Workbench; the letters refer to different selection exercises.

## Open first

- Native editable source: [Glyph Workbench](../formaglyph-glyph-workbench.figcraft), pages **07–09**.
- [Identity overview](overview.png), [usage guide PDF](usage-guide.pdf), [detailed guidelines](GUIDELINES.md).
- [Product placement proofs](product-proofs.png), [optical/scale tests](optical-tests.png), [type study](type-study.png).
- [Self-contained presentation](presentation.html), generated with the logo-design presentation script. These are illustrative identity applications, not claims of shipped features.
- [Complete asset kit ZIP](formaglyph-counterpair-kit.zip).

## Asset map

| Folder | Use |
| --- | --- |
| `svg/` | 17 vector assets: horizontal, stacked, symbol, small symbol and wordmark in black/white/burgundy; app icon; social card |
| `png/` | Matching transparent raster exports; square symbols/app at 512 px, small-cut proofs at 64 px, lockups/wordmark/social at 1200 px wide |
| `web/` | Favicon SVG/ICO and 16/32/48 PNG; 180 px Apple icon; 192/512 platform icons; safe-zone 512 maskable icon; webmanifest and HTML snippet |
| `source/` | Standard V3, reverse V3, small V3, and the native Figcraft-exported Inter outlines before the F redraw |
| `asset-manifest.json` | Exact delivered file sizes and SHA-256 hashes for assets |

White artwork is transparent, not missing. View on black. `symbol-white` includes optical compensation; the tiny pixel cut intentionally uses the same geometry in both colours. The small-cut 64 px PNG is a magnified proof; use the SVG or actual favicon PNG at its intended 16–24 px display size.

The native file contains reusable masters, live type studies, outlined final lettering, usage/diagnostic boards and 20 updated header pairs. Earlier choices and the former favicon master are retained; archived prototype wordmark labels are hidden. No application source, production configuration or live site was changed.

## Rebuild

From the repository root, with Python 3 and the logo-design skill installed:

```sh
python3 docs/design/counterpair-kit/build-kit.py
python3 docs/design/counterpair-kit/render-assets.py --renderer /path/to/logo-design/scripts/render_png.py
python3 /path/to/logo-design/scripts/presentation_board.py docs/design/counterpair-kit/presentation-spec.json -o docs/design/counterpair-kit/presentation.html
python3 docs/design/counterpair-kit/build-kit.py --manifest
python3 docs/design/counterpair-kit/test-kit.py
```

Rendering requires a supported SVG renderer, such as librsvg or Chrome. Web packaging was bootstrapped using `export_variants.py --web-icons --favicon-source source/symbol-small-v3.svg`. The kit builders supply a black-tile/white small-cut favicon for contrast in both browser themes, and render the large platform icons from proper standard/reverse artwork, not an enlarged small cut. Do not rerun that initial helper over the corrected exports without rerunning the kit builders.

Native board PNG/PDF exports are generated from Figcraft. They are documentation, not sources for tracing the mark.

## Rights and remaining approvals

Repository code and icon licences remain unchanged: [Apache-2.0](../../../LICENSE) and [asset MIT licence](../../../LICENSE-ASSETS). Do not infer permission to impersonate Formaglyph or any third-party brand from an open-source code or icon licence. This kit does not establish trademark registration, exclusive ownership or legal clearance. A formal brand-use/licensing policy is still an owner decision.

The wordmark is derived from Inter SemiBold under SIL OFL 1.1; its F is redrawn and its lettering outlined. No font binaries are distributed. See [font/provenance notes](PROVENANCE.md). Physical print, embroidery, calibrated colour matching and fresh-person recognition tests are not completed.
