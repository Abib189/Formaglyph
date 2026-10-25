import type { CatalogVariant } from "../domain/types";

// Native, non-square upstream viewports. Keep names and geometry, never crop to a square.
const octiconViewports: Record<string, readonly [number, number]> = {
  "feed-issue-reopen-16": [17, 16], "lockup-github-16": [68, 16], "lockup-github-24": [103, 24],
  "logo-gist-16": [25, 16], "logo-gist-24": [38, 24], "logo-github-16": [49, 16],
  "logo-github-24": [74, 24], "terminal-locked-24": [25, 24],
};
const fluentViewports: Record<string, readonly [number, number]> = {
  "comment-edit-16": [17, 16], "document-bullet-list-cube-16": [16, 17],
  "mail-rewind-24": [25, 24], "person-passkey-20": [20, 21],
};

export function additionalViewport(library: string, name: string, variant: CatalogVariant): readonly [number, number] | undefined {
  if (library === "octicons") {
    if (Object.hasOwn(octiconViewports, name)) return octiconViewports[name];
    const size = Number(name.match(/-(12|16|24|48|96)$/)?.[1]);
    if (!size) throw new Error(`Unsupported Octicons size: ${name}`);
    return [size, size];
  }
  if (library === "fluent") {
    if (Object.hasOwn(fluentViewports, name)) return fluentViewports[name];
    if (name === "document-table-search-24" && variant === "solid") return [24, 25];
    if (name === "hand-wave-20" && variant === "solid") return [20, 21];
    const size = Number(name.match(/-(10|12|16|20|24|28|32|48)$/)?.[1]);
    if (!size) throw new Error(`Unsupported Fluent size: ${name}`);
    return [size, size];
  }
  if (library === "healthicons") { const size = name.endsWith("-24px") ? 24 : 48; return [size, size]; }
  return undefined;
}

export function additionalIdentity(library: string, upstream: string): { name: string; variant: CatalogVariant; grid: number; gridHeight?: number } | undefined {
  let name = upstream;
  let variant: CatalogVariant = "regular";
  if (library === "fluent") {
    const match = upstream.match(/-(regular|filled|light)$/);
    if (!match) throw new Error(`Unknown Fluent style: ${upstream}`);
    name = upstream.slice(0, -match[0].length);
    variant = match[1] === "filled" ? "solid" : match[1] as CatalogVariant;
  } else if (library === "material-symbols") {
    const suffixes: Array<[string, CatalogVariant]> = [["-outline-rounded", "rounded"], ["-outline-sharp", "sharp-outline"], ["-rounded", "rounded-solid"], ["-sharp", "sharp-solid"], ["-outline", "regular"]];
    const found = suffixes.find(([suffix]) => upstream.endsWith(suffix));
    name = found ? upstream.slice(0, -found[0].length) : upstream;
    return { name, variant: found?.[1] ?? "solid", grid: 24 };
  } else if (library === "healthicons") {
    variant = /-outline(?:-24px)?$/.test(upstream) ? "regular" : "solid";
    name = upstream.replace(/-outline(?=-24px$|$)/, "");
  } else if (library === "simple-icons") return { name, variant: "solid", grid: 24 };
  else if (library !== "octicons") return undefined;
  const viewport = additionalViewport(library, name, variant)!;
  return { name, variant, grid: viewport[0], ...(viewport[0] !== viewport[1] ? { gridHeight: viewport[1] } : {}) };
}
