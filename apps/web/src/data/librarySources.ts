import type { CatalogVariant } from "../domain/types";

// Small source registry only: SVG geometry and catalogue metadata stay out of JS bundles.
export const LIBRARY_SOURCES = {
  phosphor: { id: "phosphor", label: "Phosphor Icons", sourceUrl: "https://github.com/phosphor-icons/core", licence: "MIT", grid: 256, weights: ["thin", "light", "regular", "bold", "solid", "duotone"] },
  lucide: { id: "lucide", label: "Lucide", sourceUrl: "https://github.com/lucide-icons/lucide", licence: "ISC", grid: 24, weights: ["regular"] },
  tabler: { id: "tabler", label: "Tabler Icons", sourceUrl: "https://github.com/tabler/tabler-icons", licence: "MIT", grid: 24, weights: ["regular", "solid"] },
  heroicons: { id: "heroicons", label: "Heroicons", sourceUrl: "https://github.com/tailwindlabs/heroicons", licence: "MIT", grid: 24, weights: ["regular", "solid", "mini", "micro"] },
} as const satisfies Record<string, { id: string; label: string; sourceUrl: string; licence: "MIT" | "ISC"; grid: number; weights: readonly CatalogVariant[] }>;

export type ExternalLibraryId = keyof typeof LIBRARY_SOURCES;
export const EXTERNAL_LIBRARY_IDS = Object.keys(LIBRARY_SOURCES) as ExternalLibraryId[];

export function isExternalLibrary(value: string): value is ExternalLibraryId {
  return Object.hasOwn(LIBRARY_SOURCES, value);
}

export function weightsForLibrary(library: string): readonly CatalogVariant[] {
  return isExternalLibrary(library) ? LIBRARY_SOURCES[library].weights : ["regular", "solid"];
}
