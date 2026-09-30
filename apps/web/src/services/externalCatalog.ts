import { sanitizeAndValidateSvg } from "@formaglyph/validators";
import type { CatalogIcon, CatalogVariant } from "../domain/types";
import { sha256Text } from "./candidateAsset";

export const CATALOG_WEIGHTS: readonly CatalogVariant[] = ["thin", "light", "regular", "bold", "solid", "duotone"];
export const weightLabel = (weight: CatalogVariant) => weight === "solid" ? "Solid / Fill" : weight[0].toUpperCase() + weight.slice(1);

interface ExternalManifest {
  schemaVersion: number;
  source: { id: "phosphor" | "lucide"; label: string; version: string; licence: "MIT" | "ISC"; sourceUrl: string; licenseUrl: string; conceptCount: number; assetCount: number; grid: number };
  concepts: Array<{ stableId: string; name: string; label: string; categories: string[]; tags: string[]; aliases: string[]; assets: Array<{ variant: CatalogVariant; url: string; sha256: string }> }>;
}

export function expandExternalManifest(manifest: ExternalManifest, library: "phosphor" | "lucide"): CatalogIcon[] {
  const { source, concepts } = manifest;
  const sourceUrl = library === "phosphor" ? "https://github.com/phosphor-icons/core" : "https://github.com/lucide-icons/lucide";
  if (manifest.schemaVersion !== 1 || source.id !== library || !Array.isArray(concepts) || concepts.length !== source.conceptCount || source.grid !== (library === "phosphor" ? 256 : 24) || source.licence !== (library === "phosphor" ? "MIT" : "ISC") || source.sourceUrl !== sourceUrl || source.licenseUrl !== `/libraries/${library}/LICENSE.txt` || !/^\d+\.\d+\.\d+$/.test(source.version)) {
    throw new Error("Invalid external library manifest.");
  }
  const assets: CatalogIcon[] = [];
  const identities = new Set<string>();
  for (const concept of concepts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concept.name) || concept.stableId !== `ico_${library}_${concept.name.replaceAll("-", "_")}`) throw new Error("Invalid external icon identity.");
    for (const asset of concept.assets) {
      const id = `${concept.stableId}:${asset.variant}`;
      const pathWeight = asset.variant === "solid" ? "fill" : asset.variant;
      if (identities.has(id) || !CATALOG_WEIGHTS.includes(asset.variant) || !/^[a-f0-9]{64}$/.test(asset.sha256) || asset.url !== `/libraries/${library}/${source.version}-fg.1/${pathWeight}/${concept.name}.svg`) {
        throw new Error("Invalid external icon asset.");
      }
      identities.add(id);
      assets.push({
        id, stableId: concept.stableId, name: concept.name, label: concept.label,
        category: concept.categories[0] ?? source.label, categories: concept.categories,
        description: `${concept.label} from ${source.label}.`, tags: concept.tags,
        // These aliases come from the upstream manifest, not Formaglyph review.
        aliases: concept.aliases.map((value) => ({ value, locale: "en", reviewed: false })),
        version: source.version, variant: asset.variant, previewWeight: asset.variant === "solid" ? "fill" : "regular",
        directionality: "neutral", licence: source.licence, status: "published",
        provenance: { kind: "third-party", source: source.label, sourceRevision: `${source.version}-fg.1`, disclosed: true },
        library, libraryLabel: source.label, sourceUrl: source.sourceUrl, licenseUrl: source.licenseUrl,
        gridSize: source.grid, assetUrl: asset.url, contentHash: asset.sha256,
      });
    }
  }
  if (assets.length !== source.assetCount) throw new Error("Incomplete external library manifest.");
  return assets;
}

const manifests = new Map<string, Promise<CatalogIcon[]>>();
export function loadExternalCatalog(library: "phosphor" | "lucide") {
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
