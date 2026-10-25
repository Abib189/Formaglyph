import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { formaglyphAssets } from "@formaglyph/icons";
import { validateReactRelease, findReactEntry, verifyReactSelection, supportsReactDelivery, reactUsage, prepareReactSource, fetchReactArchive, fetchReactSource } from "./reactDelivery";
import type { CatalogIcon } from "../domain/types";

const publicRoot = resolve(process.cwd(), "public");
const raw = JSON.parse(await readFile(resolve(publicRoot, "downloads/react/release.json"), "utf8"));
const release = validateReactRelease(raw);
const coreIcons = formaglyphAssets.map<CatalogIcon>(asset => ({ ...asset, previewWeight: asset.variant === "solid" ? "fill" : "regular" }));
const icon = coreIcons.find(asset => asset.name === "cloud-upload" && asset.variant === "regular")!;
const entry = findReactEntry(release, icon)!;
afterEach(() => vi.unstubAllGlobals());

describe("React developer handoff", () => {
  it("matches all Core identities, versions and source SVG hashes", async () => {
    expect(release.componentCount).toBe(96);
    for (const asset of coreIcons) {
      const selected = findReactEntry(release, asset);
      expect(selected, asset.id).toBeDefined();
      await verifyReactSelection(selected!, asset);
    }
  });
  it("never labels third-party or project releases as Core React components", async () => {
    for (const library of ["projects", "phosphor", "lucide", "hugeicons"] as const) {
      const other = { ...icon, library };
      expect(supportsReactDelivery(other)).toBe(false);
      expect(findReactEntry(release, other)).toBeUndefined();
      await expect(verifyReactSelection(entry, other)).rejects.toThrow();
    }
    expect(findReactEntry(release, { ...icon, version: "99.0.0" })).toBeUndefined();
    await expect(verifyReactSelection(entry, { ...icon, svg: icon.svg + " " })).rejects.toThrow();
  });
  it("rejects unsafe URLs, invalid hashes, duplicate names and incomplete pairs", () => {
    for (const change of [
      (r: typeof raw) => { r.package.url = "https://example.com/package.tgz"; },
      (r: typeof raw) => { r.package.bytes = 6_000_000; },
      (r: typeof raw) => { r.components[0].sourceUrl = "/../private.tsx"; },
      (r: typeof raw) => { r.components[0].sourceSha256 = "not-a-hash"; },
      (r: typeof raw) => { r.components[0].component = "window.alert(1)"; },
      (r: typeof raw) => { r.components[1] = r.components[0]; },
      (r: typeof raw) => { r.components.pop(); },
    ]) {
      const invalid = structuredClone(raw); change(invalid);
      expect(() => validateReactRelease(invalid)).toThrow("Invalid React release");
    }
  });
  it("keeps usage aligned with the selected size, colour and authored variant", () => {
    expect(reactUsage(entry, "#a10232", 32)).toBe('import CloudUpload from "@formaglyph/react/CloudUpload";\n\n<CloudUpload size={32} color="#A10232" />');
    expect(reactUsage(entry, null, 24)).not.toContain("color=");
    const solid = release.components.find(asset => asset.component === "CloudUploadSolid")!;
    expect(reactUsage(solid, "#FFFFFF", 48)).toContain('<CloudUploadSolid size={48} color="#FFFFFF" />');
    expect(() => reactUsage(entry, '"; alert(1)', 24)).toThrow();
  });
  it("changes only standalone presentation defaults, retaining geometry and the complete licence", async () => {
    const source = await readFile(resolve(publicRoot, entry.sourceUrl.slice(1)), "utf8");
    for (const colour of [null, "#FFFFFF", "#000000", "#A10232"]) {
      const result = prepareReactSource(source, entry, colour, 40);
      expect(result).toContain("const defaultSize = 40;");
      expect(result).toContain(`const defaultColor = ${JSON.stringify(colour ?? "currentColor")};`);
      expect(result).toContain("Permission is hereby granted");
      expect(result).toContain("THE SOFTWARE IS PROVIDED");
      const originalBody = source.slice(source.indexOf("export const CloudUpload"));
      expect(result.slice(result.indexOf("export const CloudUpload"))).toBe(originalBody);
      expect(result).not.toContain("background");
    }
  });
  it("downloads only hash-verified package and component bytes", async () => {
    const archive = await readFile(resolve(publicRoot, release.package.url.slice(1)));
    const source = await readFile(resolve(publicRoot, entry.sourceUrl.slice(1)), "utf8");
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(archive)).mockResolvedValueOnce(new Response(source));
    vi.stubGlobal("fetch", fetcher);
    expect((await fetchReactArchive(release)).byteLength).toBe(archive.byteLength);
    expect(await fetchReactSource(entry, "#A10232", 32)).toContain('const defaultColor = "#A10232";');
    fetcher.mockImplementation(async () => new Response("tampered"));
    await expect(fetchReactArchive(release)).rejects.toThrow("integrity");
    await expect(fetchReactSource(entry, null, 24)).rejects.toThrow("integrity");
  });
});
