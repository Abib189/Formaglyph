import type { CatalogVariant } from "../domain/types";

// Small source registry only: SVG geometry and catalogue metadata stay out of JS bundles.
export const LIBRARY_SOURCES = {
  phosphor: { id: "phosphor", label: "Phosphor Icons", sourceUrl: "https://github.com/phosphor-icons/core", licence: "MIT", grid: 256, weights: ["thin", "light", "regular", "bold", "solid", "duotone"] },
  lucide: { id: "lucide", label: "Lucide", sourceUrl: "https://github.com/lucide-icons/lucide", licence: "ISC", grid: 24, weights: ["regular"] },
  tabler: { id: "tabler", label: "Tabler Icons", sourceUrl: "https://github.com/tabler/tabler-icons", licence: "MIT", grid: 24, weights: ["regular", "solid"] },
  heroicons: { id: "heroicons", label: "Heroicons", sourceUrl: "https://github.com/tailwindlabs/heroicons", licence: "MIT", grid: 24, weights: ["regular", "solid", "mini", "micro"] },
  hugeicons: { id: "hugeicons", label: "Hugeicons", sourceUrl: "https://github.com/hugeicons/hugeicons", licence: "MIT", grid: 24, weights: ["regular"] },
  bootstrap: { id: "bootstrap", label: "Bootstrap Icons", sourceUrl: "https://github.com/twbs/icons", licence: "MIT", grid: 16, weights: ["regular", "solid"] },
  iconoir: { id: "iconoir", label: "Iconoir", sourceUrl: "https://github.com/iconoir-icons/iconoir", licence: "MIT", grid: 24, weights: ["regular", "solid"] },
  radix: { id: "radix", label: "Radix Icons", sourceUrl: "https://github.com/radix-ui/icons", licence: "MIT", grid: 15, weights: ["regular"] },
  ionicons: { id: "ionicons", label: "Ionicons", sourceUrl: "https://github.com/ionic-team/ionicons", licence: "MIT", grid: 512, weights: ["regular", "solid", "sharp"] },
  octicons: { id: "octicons", label: "GitHub Octicons", sourceUrl: "https://github.com/primer/octicons", licence: "MIT", grid: 16, weights: ["regular"] },
  fluent: { id: "fluent", label: "Fluent System Icons", sourceUrl: "https://github.com/microsoft/fluentui-system-icons", licence: "MIT", grid: 20, weights: ["regular", "solid", "light"] },
  "material-symbols": { id: "material-symbols", label: "Material Symbols", sourceUrl: "https://github.com/google/material-design-icons", licence: "Apache-2.0", grid: 24, weights: ["regular", "solid", "rounded", "rounded-solid", "sharp-outline", "sharp-solid"] },
  healthicons: { id: "healthicons", label: "Health Icons", sourceUrl: "https://github.com/resolvetosavelives/healthicons", licence: "MIT", grid: 48, weights: ["regular", "solid"] },
  feather: { id: "feather", label: "Feather", sourceUrl: "https://github.com/feathericons/feather", licence: "MIT", grid: 24, weights: ["regular"] },
  "simple-icons": { id: "simple-icons", label: "Simple Icons", sourceUrl: "https://github.com/simple-icons/simple-icons", licence: "CC0-1.0", grid: 24, weights: ["solid"] },
} as const satisfies Record<string, { id: string; label: string; sourceUrl: string; licence: "MIT" | "ISC" | "Apache-2.0" | "CC0-1.0"; grid: number; weights: readonly CatalogVariant[] }>;

export type ExternalLibraryId = keyof typeof LIBRARY_SOURCES;
export const EXTERNAL_LIBRARY_IDS = Object.keys(LIBRARY_SOURCES) as ExternalLibraryId[];

// Large collections are fetched only when selected; All libraries explicitly opts in.
export function requestedLibraries(library: string): ExternalLibraryId[] {
  return library === "all" ? EXTERNAL_LIBRARY_IDS : isExternalLibrary(library) ? [library] : [];
}

// Public library IDs stay readable even when an Iconify distribution uses a different prefix.
export const ICONIFY_PACKAGES = {
  lucide: "@iconify-json/lucide", tabler: "@iconify-json/tabler",
  heroicons: "@iconify-json/heroicons", hugeicons: "@iconify-json/hugeicons",
  bootstrap: "@iconify-json/bi", iconoir: "@iconify-json/iconoir",
  radix: "@iconify-json/radix-icons", ionicons: "@iconify-json/ion",
  octicons: "@iconify-json/octicon", fluent: "@iconify-json/fluent",
  "material-symbols": "@iconify-json/material-symbols", healthicons: "@iconify-json/healthicons",
  feather: "@iconify-json/feather", "simple-icons": "@iconify-json/simple-icons",
} as const satisfies Record<Exclude<ExternalLibraryId, "phosphor">, string>;

export function isExternalLibrary(value: string): value is ExternalLibraryId {
  return Object.hasOwn(LIBRARY_SOURCES, value);
}

export function weightsForLibrary(library: string): readonly CatalogVariant[] {
  return isExternalLibrary(library) ? LIBRARY_SOURCES[library].weights : ["regular", "solid"];
}
