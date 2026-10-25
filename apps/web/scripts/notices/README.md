# Upstream notices

The original notices were downloaded and verified on 2026-09-30; later additions have their own check dates below. Keep the full notices with every copied/downloaded asset and the public library licence page. Builds use these committed notices, never a network fetch.

- Lucide: https://github.com/lucide-icons/lucide/blob/main/LICENSE (ISC plus the full Feather MIT notice and derived-icon list).
- Tabler: https://github.com/tabler/tabler-icons/blob/v3.48.0/LICENSE (MIT).
- Heroicons: https://github.com/tailwindlabs/heroicons/blob/v2.2.0/LICENSE (MIT).
- Hugeicons: https://github.com/hugeicons/hugeicons/blob/4fd1c2d5572f832eb908d401ca95a18013069abf/LICENSE.md (MIT), checked 2026-10-25. The pinned `@iconify-json/hugeicons@1.2.35` snapshot contains 6,065 visible free Stroke Rounded icons; Pro packs are not included. This snapshot is not a claim of parity with every later upstream release.

Geometry and visible/hidden flags come from pinned `@iconify-json/*` npm snapshots. Snapshot versions are distribution versions, not necessarily upstream release versions. Only current, non-hidden icons are included; deprecated names may remain searchable aliases. Do not advertise these as original Formaglyph assets. Brand symbols may have separate trademark/usage requirements.

Build-only compatibility: Hugeicons `pokeball` uses the same narrow local-path expansion as Tabler. `dump-truck` has an exact full-24px-canvas clip removed before the unchanged SVG validator; no arbitrary clips/references are accepted, and user SVGs still cannot use them. Raw-versus-normalized raster comparison covers these two assets.
