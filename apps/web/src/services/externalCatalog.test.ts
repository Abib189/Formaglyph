import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi, afterEach } from "vitest";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";
import { iconResults } from "../data/catalog";
import { expandExternalManifest, fetchCatalogSvg, CATALOG_WEIGHTS } from "./externalCatalog";
import { searchIcons } from "./search";
import { prepareDesignSvg } from "./svg";
import { LIBRARY_SOURCES, type ExternalLibraryId } from "../data/librarySources";

const manifest = JSON.parse(readFileSync(new URL("../../public/libraries/phosphor/catalog.json", import.meta.url), "utf8"));
const assets = expandExternalManifest(manifest, "phosphor");
const readAsset = (url: string) => readFileSync(new URL(`../../public${url}`, import.meta.url), "utf8");

afterEach(() => vi.unstubAllGlobals());

describe("complete licensed upstream catalog", () => {
  it("contains all 1,512 concepts and six weights without colliding with Core", () => {
    expect(assets).toHaveLength(9072);
    expect(new Set(assets.map((asset) => asset.stableId)).size).toBe(1512);
    for (const concept of manifest.concepts) expect(concept.assets.map((asset: { variant: string }) => asset.variant)).toEqual(LIBRARY_SOURCES.phosphor.weights);
    expect(assets.every((asset) => asset.gridSize === 256 && asset.library === "phosphor" && asset.provenance.kind === "third-party")).toBe(true);
    const cameras = searchIcons([...iconResults, ...assets], "", { variant: "regular" }).filter((asset) => asset.name === "camera");
    expect(cameras).toHaveLength(2);
    expect(new Set(cameras.map((asset) => asset.stableId)).size).toBe(2);
  });

  it("verifies every generated asset, embedded MIT notice and SHA-256", () => {
    const notice = readFileSync(new URL("../../public/libraries/phosphor/LICENSE.txt", import.meta.url), "utf8");
    for (const asset of assets) {
      const svg = readAsset(asset.assetUrl!);
      expect(createHash("sha256").update(svg).digest("hex"), asset.id).toBe(asset.contentHash);
      expect(svg, asset.id).toContain(notice);
      const checked = sanitizeAndValidateSvg(svg, { targetViewBox: [0, 0, 256, 256] });
      expect(checked.safe, asset.id).toBe(true);
      expect(checked.status, asset.id).toBe("passed");
    }
  }, 30000);

  it("filters source, secondary categories and all weights independently", () => {
    expect(searchIcons([...iconResults, ...assets], "", { library: "core", variant: "regular" })).toHaveLength(48);
    expect(searchIcons(assets, "", { library: "phosphor", variant: "duotone" })).toHaveLength(1512);
    expect(searchIcons(assets, "", { library: "projects" })).toHaveLength(0);
    const multi = assets.find((asset) => asset.categories!.length > 1)!;
    expect(searchIcons(assets, "", { category: multi.categories![1], variant: multi.variant }).some((asset) => asset.id === multi.id)).toBe(true);
    // Upstream symbol tags such as '+' must not normalize to a universal prefix match.
    expect(searchIcons(assets, "acorn", { variant: "duotone" }).map((asset) => asset.name)).toEqual(["acorn"]);
  });

  it("rejects duplicate identities, incomplete collections and off-source paths", () => {
    for (const mutate of [
      (copy: typeof manifest) => copy.concepts[0].assets.push(copy.concepts[0].assets[0]),
      (copy: typeof manifest) => copy.concepts.pop(),
      (copy: typeof manifest) => { copy.concepts[0].assets[0].url = "https://untrusted.example/acorn.svg"; },
      (copy: typeof manifest) => { copy.concepts[0].stableId = "ico_fg_camera"; },
      (copy: typeof manifest) => { copy.concepts[0].assets[0].sha256 = "invalid"; },
    ]) {
      const copy = structuredClone(manifest);
      mutate(copy);
      expect(() => expandExternalManifest(copy, "phosphor")).toThrow();
    }
  });

  it("preserves duotone opacity and licence/source metadata on design handoff", () => {
    const asset = assets.find((asset) => asset.name === "acorn" && asset.variant === "duotone")!;
    const svg = readAsset(asset.assetUrl!);
    expect(svg).toMatch(/opacity="0\.2"/);
    const design = prepareDesignSvg(svg, { ...asset, library: "Phosphor Icons" }, "figma");
    expect(design).toContain('data-formaglyph-library="Phosphor Icons"');
    expect(design).toContain('data-formaglyph-source="https://github.com/phosphor-icons/core"');
    expect(design).toContain('viewBox="0 0 256 256"');
    expect(design).toContain("Permission is hereby granted");
  });

  it("checks selected asset integrity without stripping its attribution", async () => {
    const asset = assets[0];
    const svg = readAsset(asset.assetUrl!);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(svg)));
    await expect(fetchCatalogSvg(asset)).resolves.toBe(svg);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(svg.replace("currentColor", "red"))));
    await expect(fetchCatalogSvg(asset)).rejects.toThrow("integrity");
    const unsafe = '<svg viewBox="0 0 256 256"><script>alert(1)</script></svg>';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(unsafe)));
    await expect(fetchCatalogSvg({ ...asset, contentHash: createHash("sha256").update(unsafe).digest("hex") })).rejects.toThrow("Unsafe");
  });
});

const additions = [
  { id: "lucide", concepts: 1856, count: 1856 },
  { id: "tabler", concepts: 5166, count: 6220 },
  { id: "heroicons", concepts: 324, count: 1288 },
] as const;
const newManifests = Object.fromEntries(additions.map(({ id }) => [id, JSON.parse(readFileSync(new URL(`../../public/libraries/${id}/catalog.json`, import.meta.url), "utf8"))]));
const newAssets = additions.flatMap(({ id }) => expandExternalManifest(newManifests[id], id));

describe("additional open-source library snapshots", () => {
  for (const library of additions) {
    it(`includes every non-hidden ${library.id} asset with exact attribution, geometry and integrity`, () => {
      const expanded = expandExternalManifest(newManifests[library.id], library.id);
      expect(expanded).toHaveLength(library.count);
      expect(new Set(expanded.map((asset) => asset.stableId)).size).toBe(library.concepts);
      const notice = readFileSync(new URL(`../../scripts/notices/${library.id}.txt`, import.meta.url), "utf8");
      const upstream = JSON.parse(readFileSync(new URL(`../../node_modules/@iconify-json/${library.id}/icons.json`, import.meta.url), "utf8"));
      expect(Object.values(upstream.icons).filter((icon) => !(icon as { hidden?: boolean }).hidden)).toHaveLength(library.count);
      for (const asset of expanded) {
        const svg = readAsset(asset.assetUrl!);
        expect(createHash("sha256").update(svg).digest("hex"), asset.id).toBe(asset.contentHash);
        expect(svg, asset.id).toContain(notice);
        expect(svg, asset.id).toContain(`Iconify snapshot: @iconify-json/${library.id}@${asset.version}`);
        const grid = asset.gridSize!;
        expect(sanitizeAndValidateSvg(svg, { targetViewBox: [0, 0, grid, grid] }).status, asset.id).toBe("passed");
      }
    }, 30000);
  }

  it("does not collide across five camera concepts or invent unavailable weights", () => {
    const catalog = [...iconResults, ...assets, ...newAssets];
    const cameras = searchIcons(catalog, "", { variant: "regular" }).filter((asset) => asset.name === "camera");
    expect(cameras).toHaveLength(5);
    expect(new Set(cameras.map((asset) => asset.stableId)).size).toBe(5);
    expect(searchIcons(catalog, "", { library: "lucide", variant: "solid" })).toHaveLength(0);
    expect(searchIcons(catalog, "", { library: "tabler", variant: "solid" })).toHaveLength(1054);
    expect(searchIcons(catalog, "", { library: "heroicons", variant: "micro" })).toHaveLength(316);
    expect(searchIcons(catalog, "help-circle", { library: "lucide", variant: "regular" })[0]?.name).toBe("circle-question-mark");
    const names = new Set(newAssets.filter((asset) => asset.library === "lucide").map((asset) => asset.name));
    const upstream = JSON.parse(readFileSync(new URL("../../node_modules/@iconify-json/lucide/icons.json", import.meta.url), "utf8"));
    for (const [name, icon] of Object.entries(upstream.icons)) if ((icon as { hidden?: boolean }).hidden) expect(names.has(name), name).toBe(false);
  });

  it("preserves small-size Heroicons rather than scaling their 24px paths", () => {
    const camera = newAssets.filter((asset) => asset.name === "camera" && asset.library === "heroicons");
    expect(camera.map((asset) => [asset.variant, asset.gridSize])).toEqual([["regular", 24], ["solid", 24], ["mini", 20], ["micro", 16]]);
    expect(new Set(camera.map((asset) => asset.contentHash)).size).toBe(4);
    const copy = structuredClone(newManifests.heroicons);
    copy.concepts[0].assets.find((asset: { variant: string }) => asset.variant === "mini").grid = 24;
    expect(() => expandExternalManifest(copy, "heroicons")).toThrow();
    expect(CATALOG_WEIGHTS).toContain("micro");
  });

  it("records snapshot versions separately from upstream release and combined licences", () => {
    const lucide = newAssets.find((asset) => asset.library === "lucide" && asset.name === "camera")!;
    expect(lucide).toMatchObject({ licence: "ISC", licenceLabel: "ISC + MIT (Feather)", version: "1.2.137", distribution: "@iconify-json/lucide@1.2.137" });
    expect(readAsset(lucide.assetUrl!)).toContain("Copyright (c) 2013-present Cole Bemis");
    expect(newAssets.find((asset) => asset.library === "tabler")?.upstreamVersion).toBe("3.48.0");
    expect(newAssets.find((asset) => asset.library === "heroicons")?.upstreamVersion).toBe("2.2.0");
    const design = prepareDesignSvg(readAsset(lucide.assetUrl!), { ...lucide, library: "Lucide", licence: lucide.licenceLabel! }, "penpot");
    expect(design).toContain('data-formaglyph-licence="ISC + MIT (Feather)"');
    expect(design).toContain("Copyright (c) 2013-present Cole Bemis");
  });

  it("rejects a collection/source mismatch or invented Lucide solid variant", () => {
    for (const id of ["phosphor", "lucide", "tabler"] as ExternalLibraryId[]) expect(() => expandExternalManifest(newManifests.heroicons, id)).toThrow();
    const copy = structuredClone(newManifests.lucide);
    copy.concepts[0].assets[0].variant = "solid";
    copy.concepts[0].assets[0].url = copy.concepts[0].assets[0].url.replace("/regular/", "/fill/");
    expect(() => expandExternalManifest(copy, "lucide")).toThrow();
  });
});
