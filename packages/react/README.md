# @formaglyph/react

Original Formaglyph Core as React 18/19 components. Package 0.1.0 contains 48 concepts / 96 Regular and Solid components from Core 0.2.0. Asset versions and SHA-256 provenance are retained in `manifest.json`. This is not the complete 100-concept V1 family, and contains no third-party or private-team artwork.

## Install without registry publication

The package is not published to npm. Download the package archive from a Core icon's **Use in React** section in Explore, then install that actual file:

```sh
npm install ./formaglyph-react-0.1.0.tgz
```

Explore also supplies a versioned, hash-addressed direct archive URL for installation. Registry publication requires separate approval and registry access.

```tsx
import CloudUpload from "@formaglyph/react/CloudUpload";
import CloudUploadSolid from "@formaglyph/react/CloudUploadSolid";

// Decorative by default. Accessible names are supplied by the consuming product.
<CloudUpload size={24} />
<CloudUploadSolid size={32} color="#A10232" title="Upload file" />
```

Per-component imports avoid loading the full catalog. Named root imports are available to tree-shaking bundlers. Both ESM and CommonJS are provided. `loadIcon("CloudUpload")` from `@formaglyph/react/loaders` is an optional, explicitly lazy loader; static imports are preferred when the icon is known.

Components forward their SVG ref, accept normal SVG props, preserve original geometry, and default to 24px/currentColor. No implicit RTL mirroring or invented weights. Use a separate `Solid` component for the independently authored filled variant. `children` and `dangerouslySetInnerHTML` are not supported and are discarded at runtime.

Meaningful icons accept `title`, `aria-label` or `aria-labelledby`. Title IDs use React `useId`, avoiding collisions within a React tree and supporting hydration. Explicit ARIA overrides remain the caller's responsibility. Client directives preserve the component boundary for React Server Component frameworks; server rendering is supported. `forwardRef` is retained for React 18 compatibility.

## Standalone components

Explore can download one self-contained `.tsx` component with the complete MIT notice. Its default size/colour follow the selection; props can override them later. Full package archives always retain currentColor rather than baking one browser colour into every icon.

All generated components and original SVG geometry are MIT-licensed. The Formaglyph name and Counterpair logo remain separately governed trademarks. Run `pnpm build` to regenerate `release/`, and `pnpm pack:check` to test real archives in isolated React 18/19 consumers without publishing anything.

## Retained releases

`pnpm release:freeze` seals the current version into `releases/` with a content hash and file-tree hash. Commit that archive and its JSON record. The command refuses to replace an existing version whose contents differ; change the package version for a new release. The web build serves every retained archive and component source, so old pinned download URLs survive later deployments. CI compares generated files with the retained tree and installs the actual retained archive. Compressed archive bytes are retained verbatim rather than depending on a future Node/zlib version to regenerate identical gzip output.
