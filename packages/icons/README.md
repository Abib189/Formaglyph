# @formaglyph/icons

Original Formaglyph icon geometry and metadata. Core 0.2 contains 48 concepts in Regular and Solid variants (96 SVG assets) on a 24×24 grid. Regular uses a 1.75px rounded stroke; Solid uses explicit filled geometry and negative-space details. All paint uses `currentColor`.

Coverage includes navigation, actions, files, communication, security, payments, time, media, data, status, and feedback. Every concept has a stable ID, description, search tags, reviewed English aliases, explicit directionality, and original-source provenance. The 36 new concepts use asset version `0.2.0`; the original 12 retain their `0.1.0` version, IDs, metadata, and exact SVG bytes. The package/manifest version is `0.2.0`.

These are authored Formaglyph assets, not renamed third-party icons or AI output. SVGs are MIT-licensed; the Formaglyph name/logo are not licensed trademarks. This is a growing Core release, not the completed 100-concept V1 family.

`pnpm assets` deterministically rebuilds the committed SVG files and SHA-256 manifest from the geometry source. Every asset is validated by `@formaglyph/validators` before release.

## Package usage

```ts
import { findFormaglyphAsset, formaglyphAssets } from "@formaglyph/icons";

const upload = findFormaglyphAsset("ico_fg_004_cloud_upload", "regular");
console.log(upload?.svg, formaglyphAssets.length);
```

`pnpm release` builds a self-contained npm-ready directory at `release/`. It exposes the typed JavaScript catalog, `manifest.json`, and individual SVG files through `@formaglyph/icons/svg/<name>/<variant>.svg`. `pnpm pack:check` verifies the package contents without publishing anything.
