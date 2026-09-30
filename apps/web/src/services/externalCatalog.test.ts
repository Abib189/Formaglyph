import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi, afterEach } from "vitest";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";
import { iconResults } from "../data/catalog";
import { expandExternalManifest, fetchCatalogSvg, CATALOG_WEIGHTS } from "./externalCatalog";
import { searchIcons } from "./search";
import { prepareDesignSvg } from "./svg";

const manifest = JSON.parse(readFileSync(new URL("../../public/libraries/phosphor/catalog.json", import.meta.url), "utf8"));
const assets = expandExternalManifest(manifest, "phosphor");
const readAsset = (url: string) => readFileSync(new URL(`../../public${url}`, import.meta.url), "utf8");

afterEach(() => vi.unstubAllGlobals());

describe("complete licensed upstream catalog", () => {
  it("contains all 1,512 concepts and six weights without colliding with Core", () => {
    expect(assets).toHaveLength(9072);
    expect(new Set(assets.map((asset) => asset.stableId)).size).toBe(1512);
    for (const concept of manifest.concepts) expect(concept.assets.map((asset: { variant: string }) => asset.variant)).toEqual(CATALOG_WEIGHTS);
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
