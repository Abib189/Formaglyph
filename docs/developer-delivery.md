# Developer delivery: React Core

This first slice of PRD section 8.7 delivers original Core components without changing generation, authentication or project publication. It is not the complete developer-delivery milestone: collections, additional frameworks and registry publication remain separate work.

## Use the real artifacts

Select an original Formaglyph Core icon in Explore, open **Use in React**, and copy the archive install command. It points to a versioned, SHA-256-addressed `.tgz` on the current site. Alternatively, download the package and install the local file:

```sh
npm install ./formaglyph-react-0.1.0.tgz
```

```tsx
import CloudUpload from "@formaglyph/react/CloudUpload";
import CloudUploadSolid from "@formaglyph/react/CloudUploadSolid";

<CloudUpload size={24} />
<CloudUploadSolid size={32} color="#A10232" title="Upload file" />
```

The package is **not published to npm**. Do not substitute `npm install @formaglyph/react` until a separately approved registry release. Package 0.1.0 contains Core 0.2.0's 48 concepts / 96 components; original per-asset versions are preserved. No upstream library or private team artwork is repackaged.

The inspector's copied usage follows the selected variant, size and colour. **Download component** produces a self-contained `.tsx` file with those defaults; import it from your own project. Its complete MIT notice, original geometry and original component hash remain present. The full package stays 24px/currentColor; presentation changes belong in props, not a rebuilt package. Preview contrast backing is never exported.

## Component contract

- React 18/19 peer dependency only; ESM/CommonJS and TypeScript declarations, including CommonJS declarations.
- Static per-component imports are preferred. Root named exports are tree-shakable; an optional `loadIcon` API uses separate dynamic imports.
- SVG refs and regular SVG props are forwarded. Components are decorative by default; meaningful icons need `title`, `aria-label` or `aria-labelledby`.
- Title IDs use [React useId](https://react.dev/reference/react/useId). [forwardRef](https://react.dev/reference/react/forwardRef) retains React 18 compatibility. Independent React roots should use distinct `identifierPrefix` values when rendering named icons.
- Client boundaries are explicit for server-component frameworks. SSR is supported; geometry is static JSX, not runtime XML/HTML injection.
- No `children` or `dangerouslySetInnerHTML`, fabricated weights, implicit RTL mirroring, hosted generation or automatic publication.

Original artwork and components use MIT. The Counterpair logo and Formaglyph brand are not included as icon components and remain governed by the trademark policy.

## Reproducible, retained releases

Generated `packages/react/release/` and `apps/web/public/downloads/` are ignored. Sealed archives in `packages/react/releases/` are committed and survive clean Docker builds. Never delete a retained archive or replace an existing version.

For a new reviewed release:

1. Change `packages/react/package.json` to a new version and make the intended source changes.
2. Run `pnpm --filter @formaglyph/react release:freeze`. This creates an archive and JSON record containing compressed-byte and file-tree hashes, refusing to overwrite an existing differing version.
3. Commit the new archive/record with the source, run `pnpm check`, then use the normal reviewed deployment workflow.

Every web build verifies the current generated tree against its sealed record and serves **all** retained versions. The current index `/downloads/react/release.json` is not cached; immutable archive and source paths contain hashes and receive one-year immutable caching. Missing download paths return 404 rather than the SPA shell. Hash verification fails closed before browser downloads. Uncompressed tar entries are bounded and read in memory, never extracted through supplied filesystem paths.

Keeping compressed bytes verbatim avoids future Node/zlib changes silently altering a pinned archive URL. A hash verifies integrity, not authorship independent of the HTTPS origin; no separate signing service is claimed.

## Verification and limits

`pnpm check` runs geometry/paint comparison across all 96 components, accessible-name/unique-ID tests, ESM/CommonJS loading, real React 18/19 tarball installations and type checks, a single-icon tree-shaking check, retained artifact validation, and production static-server download/cache/HEAD/304/404 smoke checks. Web tests cover metadata, selection identity, colour/size defaults and tampered content.

Browser QA covers the existing inspector in desktop/tablet/mobile-sized Chromium viewports, light/dark themes, keyboard actions, retries and actual downloads. This is not a claim of physical iPad/Safari testing or a comprehensive screen-reader audit. Database security contracts are unchanged; the existing database CI job remains required.

The authored Railway watch paths now include `/packages/react/**`. That one-path configuration change must be reviewed/applied with the next approved live release; implementing this slice does not itself authorize an unattended configuration apply or npm publication.
