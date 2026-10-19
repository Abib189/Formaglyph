import { sanitizeAndValidateSvg } from "@formaglyph/validators";
import type { CatalogIcon, CatalogVariant } from "../domain/types";
import { sha256Text } from "./candidateAsset";
import { LIBRARY_SOURCES, type ExternalLibraryId } from "../data/librarySources";

export const CATALOG_WEIGHTS: readonly CatalogVariant[] = ["thin", "light", "regular", "bold", "solid", "duotone", "mini", "micro"];
export const weightLabel = (weight: CatalogVariant) => weight === "solid" ? "Solid / Fill" : weight === "mini" ? "Mini · 20px" : weight === "micro" ? "Micro · 16px" : weight[0].toUpperCase() + weight.slice(1);

interface ExternalManifest {
  schemaVersion: number;
  source: { id: ExternalLibraryId; label: string; version: string; licence: "MIT" | "ISC"; licenceLabel?: string; sourceUrl: string; licenseUrl: string; conceptCount: number; assetCount: number; grid: number; distribution?: string; upstreamVersion?: string };
  concepts: Array<{ stableId: string; name: string; label: string; categories: string[]; tags: string[]; aliases: string[]; assets: Array<{ variant: CatalogVariant; grid?: number; url: string; sha256: string }> }>;
}

export function expandExternalManifest(manifest: ExternalManifest, library: ExternalLibraryId): CatalogIcon[] {
  const { source, concepts } = manifest;
  const config = LIBRARY_SOURCES[library];
  if (manifest.schemaVersion !== 1 || source.id !== library || source.label !== config.label || !Array.isArray(concepts) || concepts.length !== source.conceptCount || source.grid !== config.grid || source.licence !== config.licence || source.sourceUrl !== config.sourceUrl || source.licenseUrl !== `/libraries/${library}/LICENSE.txt` || !/^\d+\.\d+\.\d+$/.test(source.version) || (library !== "phosphor" && source.distribution !== `@iconify-json/${library}@${source.version}`)) {
    throw new Error("Invalid external library manifest.");
  }
  const assets: CatalogIcon[] = [];
  const identities = new Set<string>();
  for (const concept of concepts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concept.name) || concept.stableId !== `ico_${library}_${concept.name.replaceAll("-", "_")}`) throw new Error("Invalid external icon identity.");
    for (const asset of concept.assets) {
      const id = `${concept.stableId}:${asset.variant}`;
      const pathWeight = asset.variant === "solid" ? "fill" : asset.variant;
      const grid = asset.grid ?? source.grid;
      const expectedGrid = library === "heroicons" && asset.variant === "mini" ? 20 : library === "heroicons" && asset.variant === "micro" ? 16 : config.grid;
      if (identities.has(id) || !(config.weights as readonly CatalogVariant[]).includes(asset.variant) || grid !== expectedGrid || !/^[a-f0-9]{64}$/.test(asset.sha256) || asset.url !== `/libraries/${library}/${source.version}-fg.1/${pathWeight}/${concept.name}.svg`) {
        throw new Error("Invalid external icon asset.");
      }
      identities.add(id);
      assets.push({
        id, stableId: concept.stableId, name: concept.name, label: concept.label,
        category: concept.categories[0] ?? source.label, categories: concept.categories,
        description: `${concept.label} from ${source.label}.`, tags: concept.tags,
        // These aliases come from the upstream manifest, not Formaglyph review.
        aliases: concept.aliases.map((value) => ({ value, locale: "en", reviewed: false })),
        version: source.version, variant: asset.variant, previewWeight: ["solid", "mini", "micro"].includes(asset.variant) ? "fill" : "regular",
        directionality: "neutral", licence: source.licence, status: "published",
        provenance: { kind: "third-party", source: source.label, sourceRevision: `${source.version}-fg.1`, disclosed: true },
        library, libraryLabel: source.label, sourceUrl: source.sourceUrl, licenseUrl: source.licenseUrl,
        licenceLabel: source.licenceLabel, distribution: source.distribution, upstreamVersion: source.upstreamVersion,
        gridSize: grid, assetUrl: asset.url, contentHash: asset.sha256,
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
  const validation = sanitizeAndValidateSvg(svg, { targetViewBox: [0, 0, grid, grid] });
  if (!validation.safe || validation.status !== "passed") throw new Error("Unsafe SVG asset.");
  // Return the verified source, retaining its complete embedded licence notice.
  return svg;
}
