# Counterpair / concise brand guidelines

Formaglyph · 1.0.0 · 19 October 2026

## Signature

Use the horizontal lockup as the primary signature. Use stacked for narrow, centred compositions; symbol-only for established product context, app icons and favicons. Use wordmark-only when a nearby symbol would be redundant. Spell **Formaglyph** exactly; the asset title-case lettering is not to be retyped or replaced with the unselected all-capitals E concept.

The two-part mark is deliberately asymmetric. Never close its counters, connect its pieces, swap them, mirror/rotate it or redraw it as a numeral. During early adoption, prefer the full name alongside the symbol because it can read as a 5.

## Construction and optical cuts

The standard symbol uses a 256-unit canvas with ink from 32 to 224. Its vertical bands are 40 units; horizontal bands are 38. External radius is 32; the upper inner shoulder is 8. V3 retains the selected V2 silhouette and short upper terminal, but reduces the 40-unit horizontals by two units and opens the lower counter from 32 to 36.

For white-on-dark, use the supplied `*-white.svg`: the symbol bands become 39 vertically and 37 horizontally (about 2.5–2.6% thinner). Its lower counter is 38 units. The outlined wordmark stays the same rather than mechanically eroding all letter outlines.

At **16–24 px**, use `symbol-small`: a deliberate 16-unit pixel-oriented cut with 2.5-unit bands and a 2-unit open counter. It keeps identical tiny geometry in black and white to protect pixel alignment. At **32 px and above**, use the standard/reverse drawing.

The wordmark base is Inter SemiBold at 100 px with -1.5 px tracking. The F has a custom six-unit outer shoulder and three-unit inner shoulder. The remaining lettering retains Inter's optical curves and overshoots. Final files contain paths, not fonts.

## Lockup proportions

- Horizontal canvas: 1152 × 256. Symbol at origin; name at (296, 76), scaled 1.5 from its 549.293 × 94.336 outline. Visible symbol-to-name gap: 72 units. Do not adjust individual letters or this gap.
- Stacked canvas: 864 × 448. Symbol at (304, 0); name centred at (102.424, 294), scaled 1.2. Visible mark-to-name gap: 70 units.
- Standalone wordmark includes 16 units of padding around the outlined lettering.

## Clear space and minimum sizes

Let **x = 40 units**, the standard vertical stem on the 256-unit symbol. Keep **at least 1x beyond the visible ink** on every side. Standard symbol canvas padding is 32 units, so add eight more units outside its canvas—one additional pixel at a 32 px rendered canvas. For lockups, apply that unit at the symbol's displayed scale around the whole signature; extra space is preferable. Do not mistake the exported canvas padding for the entire clear-space requirement.

Screen minimums, checked in rendered proofs:

| Asset | Minimum canvas/display size |
| --- | --- |
| Small symbol / favicon | 16 × 16 px |
| Standard/reverse symbol | 32 × 32 px |
| Horizontal signature | 144 px wide |
| Stacked signature | 160 px wide |
| Standalone wordmark | 120 px wide |

These refer to CSS/document pixels, not the physical size of a scaled screenshot. Provisional print starting points: symbol 6 mm canvas, horizontal 30 mm wide, stacked 24 mm wide. They are **not physically validated**. Have the production vendor proof the smallest positive/negative gaps and enlarge for embroidery, engraving and absorbent stock; no fabrication-ready claim is made.

## Palette and backgrounds

| Colour | HEX | RGB | CMYK starting conversion |
| --- | --- | --- | --- |
| White | #FFFFFF | 255, 255, 255 | 0, 0, 0, 0 |
| Black | #000000 | 0, 0, 0 | 0, 0, 0, 100 |
| Burgundy | #A10232 | 161, 2, 50 | 0, 99, 69, 37 |

CMYK values are mathematical, unprofiled starting values—not a press/ICC match. Pantone is deliberately unspecified pending physical comparison. Ask the printer for the correct black build for large solid areas versus small lettering; do not blindly substitute rich black into all assets.

Use black on white, white on black, burgundy on white, or white on burgundy. Black/white contrast is 21:1; white/burgundy is about 8.17:1. Burgundy/black is only about 2.57:1: do not use it for small marks, controls or text. These are calculated contrast ratios, not comprehensive accessibility certification. The logo does not replace labelled controls or visible keyboard focus.

Black and white dominate. Burgundy is the least-used colour, reserved for an occasional accent or purposeful brand moment. Do not colour the two symbol pieces differently. On busy images/patterns, place the mark on a quiet, opaque black or white container with clear space. Do not add an outline, shadow, glow or gradient to rescue contrast.

## Platform assets

- `web/favicon.svg` and `favicon.ico` use the white small cut on a black tile, keeping it visible in both light and dark browser chrome. ICO includes 16/32/48 px entries.
- Large Apple/PWA tiles use the reverse standard cut on a full-bleed black background. Platform masking supplies rounding; the marketing app-icon SVG has its own 56-unit rounded square.
- The maskable version reduces the mark to a .72 scale so its whole ink bounds fit the central 80%-diameter safe circle. Do not use the larger regular platform tile as a maskable icon.
- `site.webmanifest` and `head-snippet.html` are integration examples. Review paths, CSP, existing manifest values and deployment base before adopting them. This kit does not turn the live app into a PWA.
- `formaglyph-social-card` is 1200 × 630 and uses only the approved palette.

## Typography, misuse and approval

Logo lettering must use the supplied paths. Inter is suitable companion UI type; the Workbench retains its existing Menlo fallback for technical labels. That fallback is not the logo font. See the separate type-study page for rejected alternatives; font-study files are not production alternatives.

Do not stretch, skew, rearrange, rotate, crop away a piece, use unapproved colours, alter name spacing, add effects or combine the logo with a tagline inside its clear space. Do not extract one piece as a replacement favicon.

This kit was requested and built for the selected C direction; final production rollout is separate. Trademark/name searches, reverse-image clearance, fresh-person perception, physical print tests and any formal third-party brand-use policy remain open. The possible numeral-5 reading has not been concealed by the rationale.
