import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOMParser } from "@xmldom/xmldom";
import { build } from "esbuild";
import { describe, it, expect } from "vitest";
import { formaglyphAssets } from "@formaglyph/icons";
import * as icons from "../release/esm/index.js";
import { loadIcon } from "../release/esm/loaders.js";
import { createReactArchive } from "../scripts/archive.mjs";
import { verifyCurrentRelease } from "../scripts/retained-release.mjs";

const release = resolve(import.meta.dirname, "../release");
const parse = value => new DOMParser().parseFromString(value, "image/svg+xml").documentElement;
function geometry(svg) {
  const node = typeof svg === "string" ? parse(svg) : svg;
  const rootIgnores = new Set(["width", "height", "color", "focusable", "aria-hidden", "aria-labelledby", "aria-label", "role"]);
  return {
    tag: node.tagName,
    attributes: Object.fromEntries(Array.from(node.attributes).filter(a => !rootIgnores.has(a.name)).map(a => [a.name, a.value]).sort()),
    children: Array.from(node.childNodes).filter(n => n.nodeType === 1 && n.tagName !== "title").map(geometry),
  };
}
const nameOf = asset => asset.name.split("-").map(p => p[0].toUpperCase() + p.slice(1)).join("") + (asset.variant === "solid" ? "Solid" : "");

describe("original React delivery", () => {
  it("renders all 96 components with exactly the original geometry and paint defaults", () => {
    expect(Object.keys(icons)).toHaveLength(96);
    for (const asset of formaglyphAssets) {
      const rendered = renderToStaticMarkup(createElement(icons[nameOf(asset)]));
      expect(geometry(rendered), asset.id).toEqual(geometry(asset.svg));
      expect(parse(rendered).getAttribute("width")).toBe("24");
      expect(parse(rendered).getAttribute("aria-hidden")).toBe("true");
    }
  });
  it("supports names, unique title IDs, size, colour and explicit ARIA", () => {
    const html = renderToStaticMarkup(createElement(Fragment, null,
      createElement(icons.CloudUpload, { title: "Upload", size: "2em", color: "#A10232" }),
      createElement(icons.CloudUpload, { title: "Backup" }),
    ));
    const document = new DOMParser().parseFromString(`<div>${html}</div>`, "text/xml");
    const [first, second] = Array.from(document.getElementsByTagName("svg"));
    expect(first.getAttribute("width")).toBe("2em");
    expect(first.getAttribute("color")).toBe("#A10232");
    expect(first.getAttribute("role")).toBe("img");
    expect(first.hasAttribute("aria-hidden")).toBe(false);
    expect(first.getAttribute("aria-labelledby")).not.toBe(second.getAttribute("aria-labelledby"));
    const named = parse(renderToStaticMarkup(createElement(icons.CloudUpload, { "aria-label": "Upload", title: "Details", "aria-labelledby": "external-label" })));
    expect(named.getAttribute("aria-label")).toBe("Upload");
    expect(named.getAttribute("aria-labelledby")).toBe("external-label");
  });
  it("discards injected markup/children and supports CommonJS and lazy loading", async () => {
    const html = renderToStaticMarkup(createElement(icons.CloudUpload, { children: "unexpected", dangerouslySetInnerHTML: { __html: "<script/>" } }));
    expect(html).not.toMatch(/script|unexpected/);
    const require = createRequire(import.meta.url);
    const cjs = require("../release/cjs/CloudUpload.js");
    expect(geometry(renderToStaticMarkup(createElement(cjs.default)))).toEqual(geometry(formaglyphAssets.find(a => a.name === "cloud-upload" && a.variant === "regular").svg));
    expect(await loadIcon("CloudUpload")).toBe(icons.CloudUpload);
    expect(await require("../release/cjs/loaders.js").loadIcon("CloudUpload")).toBe(cjs.default);
    await expect(loadIcon("__proto__")).rejects.toThrow("Unknown");
  });
  it("retains original hashes, complete source licensing, versions and client boundaries", async () => {
    const manifest = JSON.parse(await readFile(resolve(release, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({ name: "@formaglyph/react", version: "0.1.0", coreVersion: "0.2.0", conceptCount: 48, componentCount: 96 });
    const licence = await readFile(resolve(release, "LICENSE"), "utf8");
    for (const asset of formaglyphAssets) {
      const entry = manifest.components.find(e => e.component === nameOf(asset));
      const source = await readFile(resolve(release, entry.sourcePath), "utf8");
      expect(entry.sourceSvgSha256).toBe(createHash("sha256").update(asset.svg).digest("hex"));
      expect(entry.sourceSha256).toBe(createHash("sha256").update(source).digest("hex"));
      expect(entry.iconVersion).toBe(asset.version);
      for (const line of licence.trim().split("\n")) expect(source).toContain(line);
      expect(await readFile(resolve(release, `esm/${entry.component}.js`), "utf8")).toContain('"use client";');
    }
  });
  it("tree-shakes root imports and provides a per-icon module without the catalog", async () => {
    for (const path of ["index.js", "CloudUpload.js"]) {
      const result = await build({ stdin: { contents: path === "index.js" ? 'import { CloudUpload } from "./index.js"; export { CloudUpload };' : 'export { default } from "./CloudUpload.js";', resolveDir: resolve(release, "esm") }, bundle: true, write: false, minify: true, format: "esm", external: ["react", "react/jsx-runtime"], logLevel: "silent" });
      const output = result.outputFiles[0].text;
      expect(output).toContain("7.5 18.5H6");
      expect(output).not.toContain("M11 2.1V8"); // unrelated Globe Solid geometry
      expect(output.length).toBeLessThan(3500);
    }
  });
  it("produces identical archive bytes on repeated builds", async () => {
    const a = await createReactArchive(release), b = await createReactArchive(release);
    expect(a.bytes.equals(b.bytes)).toBe(true);
    expect(a.sha256).toBe(b.sha256);
  });
  it("ships the retained archive with the exact current release tree", async () => {
    const frozen = await verifyCurrentRelease(resolve(release, ".."));
    expect(frozen.manifest.componentCount).toBe(96);
    expect(frozen.files.has("sources/CloudUpload.tsx")).toBe(true);
    expect(frozen.files.has("LICENSE")).toBe(true);
  });
  it("rejects changed source trees and tampered retained archive bytes", async () => {
    const scratch = await mkdtemp(resolve(tmpdir(), "formaglyph-react-retention-test-"));
    try {
      const root = resolve(release, "..");
      await cp(resolve(root, "releases"), resolve(scratch, "releases"), { recursive: true });
      await cp(release, resolve(scratch, "release"), { recursive: true });
      await cp(resolve(root, "package.json"), resolve(scratch, "package.json"));
      const frozen = await verifyCurrentRelease(scratch);
      await writeFile(resolve(scratch, "release/LICENSE"), "changed source");
      await expect(verifyCurrentRelease(scratch)).rejects.toThrow("without a new package version");
      await writeFile(resolve(scratch, "releases", frozen.record.file), "changed archive");
      await expect(verifyCurrentRelease(scratch)).rejects.toThrow("hash mismatch");
    } finally { await rm(scratch, { recursive: true, force: true }); }
  });
});
