# Upstream notices

The original notices were downloaded and verified on 2026-09-30; later additions have their own check dates below. Keep the full notices with every copied/downloaded asset and the public library licence page. Builds use these committed notices, never a network fetch.

- Lucide: https://github.com/lucide-icons/lucide/blob/main/LICENSE (ISC plus the full Feather MIT notice and derived-icon list).
- Tabler: https://github.com/tabler/tabler-icons/blob/v3.48.0/LICENSE (MIT).
- Heroicons: https://github.com/tailwindlabs/heroicons/blob/v2.2.0/LICENSE (MIT).
- Hugeicons: https://github.com/hugeicons/hugeicons/blob/4fd1c2d5572f832eb908d401ca95a18013069abf/LICENSE.md (MIT), checked 2026-10-25. The pinned `@iconify-json/hugeicons@1.2.35` snapshot contains 6,065 visible free Stroke Rounded icons; Pro packs are not included. This snapshot is not a claim of parity with every later upstream release.
- Bootstrap Icons: https://github.com/twbs/icons/blob/e568465481c0c541f63a78f6452d09387711d489/LICENSE (MIT), checked 2026-10-25. `@iconify-json/bi@1.2.7` contains 2,078 visible SVGs (upstream 1.13.1).
- Iconoir: https://github.com/iconoir-icons/iconoir/blob/4eae577f5e9081e11303539902c8cd765e25436f/LICENSE (MIT), checked 2026-10-25. `@iconify-json/iconoir@1.2.12` contains 1,671 visible SVGs (upstream 7.12.1).
- Radix Icons: https://github.com/radix-ui/icons/blob/112af91ad275a63c3a29b0da2588342af74ef9bf/LICENSE (MIT), checked 2026-10-25. `@iconify-json/radix-icons@1.2.6` contains 332 visible SVGs (upstream 1.3.2).
- Ionicons: https://github.com/ionic-team/ionicons/blob/d1e2c48641fd5f4910ee42a144dc1c84b1a9a4ee/LICENSE (MIT), checked 2026-10-25. `@iconify-json/ion@1.2.7` contains 1,357 visible SVGs (upstream 8.0.13).

Geometry and visible/hidden flags come from pinned `@iconify-json/*` npm snapshots. Snapshot versions are distribution versions, not necessarily upstream release versions. Only current, non-hidden icons are included; deprecated names may remain searchable aliases. Do not advertise these as original Formaglyph assets. Brand symbols may have separate trademark/usage requirements.

Build-only compatibility: Hugeicons `pokeball` uses the same narrow local-path expansion as Tabler. `dump-truck` has an exact full-24px-canvas clip removed before the unchanged SVG validator; no arbitrary clips/references are accepted, and user SVGs still cannot use them. Raw-versus-normalized raster comparison covers these two assets.

Bootstrap, Iconoir, Radix and Ionicons use that same closed, single-path expansion where needed, preserving inherited paint and validated stroke attributes. A separate catalogue-only validator preserves Radix's six local path masks and Iconoir's two fixed-white originals (`dots-grid-3x3-solid`, `snapchat`). Runtime use requires a verified asset hash; normal uploads still reject masks, references and fixed-white paint. Colour overrides retain source white paint, and these eight exceptional assets use exact SVG previews rather than CSS masking. Preserve native 16px/24px/15px/512px viewports respectively, including Ionicons `logo-x`'s 16px exception; do not fabricate missing styles or recolour fixed source details.
