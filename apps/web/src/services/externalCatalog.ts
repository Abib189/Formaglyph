import { sanitizeAndValidateSvg, sanitizeAndValidateCatalogSvg } from "@formaglyph/validators";
import type { CatalogIcon, CatalogVariant } from "../domain/types";
import { sha256Text } from "./candidateAsset";
import { LIBRARY_SOURCES, ICONIFY_PACKAGES, type ExternalLibraryId } from "../data/librarySources";
import { additionalViewport } from "../data/additionalLibraryIdentity";

export const CATALOG_WEIGHTS: readonly CatalogVariant[] = ["thin", "light", "regular", "bold", "solid", "sharp", "rounded", "rounded-solid", "sharp-outline", "sharp-solid", "duotone", "mini", "micro"];
export const weightLabel = (weight: CatalogVariant) => weight === "solid" ? "Solid / Fill" : weight === "mini" ? "Mini · 20px" : weight === "micro" ? "Micro · 16px" : weight === "rounded" ? "Rounded · Outline" : weight === "rounded-solid" ? "Rounded · Filled" : weight === "sharp-outline" ? "Sharp · Outline" : weight === "sharp-solid" ? "Sharp · Filled" : weight[0].toUpperCase() + weight.slice(1);

interface ExternalManifest {
  schemaVersion: number;
  source: { id: ExternalLibraryId; label: string; version: string; licence: CatalogIcon["licence"]; licenceLabel?: string; sourceUrl: string; licenseUrl: string; conceptCount: number; assetCount: number; grid: number; distribution?: string; upstreamVersion?: string };
  concepts: Array<{ stableId: string; name: string; label: string; categories: string[]; tags: string[]; aliases: string[]; brand?: { sourceUrl: string; guidelinesUrl?: string; licence: string; metadata: string }; assets: Array<{ variant: CatalogVariant; grid?: number; gridHeight?: number; exactPaint?: boolean; fixedWhite?: boolean; url: string; sha256: string }> }>;
}

export function expandExternalManifest(manifest: ExternalManifest, library: ExternalLibraryId): CatalogIcon[] {
  const { source, concepts } = manifest;
  const config = LIBRARY_SOURCES[library];
  if (manifest.schemaVersion !== 1 || source.id !== library || source.label !== config.label || !Array.isArray(concepts) || concepts.length !== source.conceptCount || source.grid !== config.grid || source.licence !== config.licence || source.sourceUrl !== config.sourceUrl || source.licenseUrl !== `/libraries/${library}/LICENSE.txt` || !/^\d+\.\d+\.\d+$/.test(source.version) || (library !== "phosphor" && source.distribution !== `${ICONIFY_PACKAGES[library]}@${source.version}`)) {
    throw new Error("Invalid external library manifest.");
  }
  const assets: CatalogIcon[] = [];
  const identities = new Set<string>();
  for (const concept of concepts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concept.name) || concept.stableId !== `ico_${library}_${concept.name.replaceAll("-", "_")}`) throw new Error("Invalid external icon identity.");
    if (library === "simple-icons") {
      const brand = concept.brand;
      const safeLink = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } };
      if (!brand || brand.licence !== "CC0-1.0" || brand.metadata !== `simple-icons@${source.upstreamVersion}` || !safeLink(brand.sourceUrl) || (brand.guidelinesUrl && !safeLink(brand.guidelinesUrl))) throw new Error("Missing or unsupported per-brand licence/source metadata.");
    }
    for (const asset of concept.assets) {
      const id = `${concept.stableId}:${asset.variant}`;
      const pathWeight = asset.variant === "solid" ? "fill" : asset.variant;
      const grid = asset.grid ?? source.grid;
      const native = additionalViewport(library, concept.name, asset.variant);
      const expectedGrid = native?.[0] ?? (library === "heroicons" && asset.variant === "mini" ? 20 : (library === "heroicons" && asset.variant === "micro") || (library === "ionicons" && concept.name === "logo-x") ? 16 : config.grid);
      const expectedHeight = native?.[1] ?? (library === "hugeicons" && concept.name === "image-flip-horizontal" ? 25 : expectedGrid);
      if (identities.has(id) || !(config.weights as readonly CatalogVariant[]).includes(asset.variant) || grid !== expectedGrid || (asset.gridHeight ?? grid) !== expectedHeight || !/^[a-f0-9]{64}$/.test(asset.sha256) || asset.url !== `/libraries/${library}/${source.version}-fg.1/${pathWeight}/${concept.name}.svg`) {
        throw new Error("Invalid external icon asset.");
      }
      identities.add(id);
      assets.push({
        id, stableId: concept.stableId, name: concept.name, label: concept.label,
        category: concept.categories[0] ?? source.label, categories: concept.categories,
        description: `${concept.label} from ${source.label}.`, tags: concept.tags,
        // These aliases come from the upstream manifest, not Formaglyph review.
        aliases: concept.aliases.map((value) => ({ value, locale: "en", reviewed: false })),
        version: source.version, variant: asset.variant, previewWeight: ["solid", "sharp", "rounded-solid", "sharp-solid", "mini", "micro"].includes(asset.variant) ? "fill" : "regular",
        directionality: library === "fluent" && /(?:^|-)rtl(?:-|$)/.test(concept.name) ? "rtl-specific" : library === "fluent" && /(?:^|-)ltr(?:-|$)/.test(concept.name) ? "ltr-specific" : "neutral", licence: source.licence, status: "published",
        provenance: { kind: "third-party", source: source.label, sourceRevision: `${source.version}-fg.1`, disclosed: true },
        library, libraryLabel: source.label, sourceUrl: source.sourceUrl, licenseUrl: source.licenseUrl,
        licenceLabel: source.licenceLabel, distribution: source.distribution, upstreamVersion: source.upstreamVersion,
        ...(concept.brand ? { brandSourceUrl: concept.brand.sourceUrl, brandGuidelinesUrl: concept.brand.guidelinesUrl } : {}),
        gridSize: grid, ...(asset.gridHeight ? { gridHeight: asset.gridHeight } : {}), ...(asset.exactPaint ? { exactPaint: true } : {}), ...(asset.fixedWhite ? { fixedWhite: true } : {}), assetUrl: asset.url, contentHash: asset.sha256,
      });
    }
  }
  if (assets.length !== source.assetCount) throw new Error("Incomplete external library manifest.");
  return assets;
}

const manifests = new Map<string, Promise<CatalogIcon[]>>();
export function loadExternalCatalog(library: ExternalLibraryId) {
  const cached = manifests.get(library);
  if (cached) return cached;
  const promise = fetch(`/libraries/${library}/catalog.json`).then(async (response) => {
    if (!response.ok) throw new Error(`Could not load ${library}.`);
    return expandExternalManifest(await response.json() as ExternalManifest, library);
  }).catch((error: unknown) => { manifests.delete(library); throw error; });
  manifests.set(library, promise);
  return promise;
}

export async function fetchCatalogSvg(icon: CatalogIcon, signal?: AbortSignal) {
  if (icon.svg) return icon.svg;
  if (!icon.assetUrl) throw new Error("Asset unavailable.");
  const response = await fetch(icon.assetUrl, { signal });
  if (!response.ok) throw new Error("Asset unavailable.");
  const svg = await response.text();
  if (icon.contentHash && await sha256Text(svg) !== icon.contentHash) throw new Error("Asset integrity check failed.");
  const grid = icon.gridSize ?? 24;
  const validate = ["radix", "iconoir", "healthicons"].includes(icon.library ?? "") && icon.contentHash ? sanitizeAndValidateCatalogSvg : sanitizeAndValidateSvg;
  const validation = validate(svg, { targetViewBox: [0, 0, grid, icon.gridHeight ?? grid] });
  if (!validation.safe || validation.status !== "passed") throw new Error("Unsafe SVG asset.");
  // Return the verified source, retaining its complete embedded licence notice.
  return svg;
}
