# @formaglyph/icons

Original Formaglyph icon geometry and metadata. The starter release contains 12 concepts in Regular and Solid variants on a 24×24 grid.

`pnpm assets` deterministically rebuilds the committed SVG files and SHA-256 manifest from the geometry source. Every asset is validated by `@formaglyph/validators` before release.

## Package usage

```ts
import { findFormaglyphAsset, formaglyphAssets } from "@formaglyph/icons";

const upload = findFormaglyphAsset("ico_fg_004_cloud_upload", "regular");
console.log(upload?.svg, formaglyphAssets.length);
```

`pnpm release` builds a self-contained npm-ready directory at `release/`. It exposes the typed JavaScript catalog, `manifest.json`, and individual SVG files through `@formaglyph/icons/svg/<name>/<variant>.svg`. `pnpm pack:check` verifies the package contents without publishing anything.
