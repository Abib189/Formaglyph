import type { CatalogIcon } from "../domain/types";
import { normalizeIconColour } from "./iconColour";
import { sha256Text } from "./candidateAsset";

export interface ReactComponentEntry {
  stableId: string;
  name: string;
  variant: "regular" | "solid";
  iconVersion: string;
  component: string;
  sourceSvgSha256: string;
  sourceSha256: string;
  sourceUrl: string;
}
export interface ReactRelease {
  schemaVersion: 1;
  name: "@formaglyph/react";
  version: string;
  coreVersion: string;
  licence: "MIT";
  conceptCount: number;
  componentCount: number;
  package: { url: string; sha256: string; bytes: number };
  components: ReactComponentEntry[];
}
const hash = /^[a-f0-9]{64}$/;
const semver = /^\d+\.\d+\.\d+$/;
const componentName = /^[A-Z][A-Za-z0-9]+$/;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function validateReactRelease(input: unknown): ReactRelease {
  const invalid = () => { throw new Error("Invalid React release metadata."); };
  if (!object(input) || input.schemaVersion !== 1 || input.name !== "@formaglyph/react" || input.licence !== "MIT" || typeof input.version !== "string" || !semver.test(input.version) || typeof input.coreVersion !== "string" || !semver.test(input.coreVersion) || !object(input.package) || !Array.isArray(input.components) || input.components.length !== input.componentCount || !Number.isInteger(input.conceptCount) || input.componentCount !== Number(input.conceptCount) * 2 || input.components.length === 0 || input.components.length > 1000) return invalid();
  const archive = input.package, prefix = `/downloads/react/${input.version}`;
  if (typeof archive.sha256 !== "string" || !hash.test(archive.sha256) || !Number.isSafeInteger(archive.bytes) || Number(archive.bytes) <= 0 || Number(archive.bytes) > 5_000_000 || archive.url !== `${prefix}/${archive.sha256}/formaglyph-react-${input.version}.tgz`) return invalid();
  const identities = new Set<string>(), names = new Set<string>(), concepts = new Map<string, Set<string>>();
  for (const entry of input.components) {
    if (!object(entry) || typeof entry.stableId !== "string" || !/^ico_fg_\d{3}_[a-z0-9_]+$/.test(entry.stableId) || typeof entry.name !== "string" || !/^[a-z]+(?:-[a-z0-9]+)*$/.test(entry.name) || !["regular", "solid"].includes(String(entry.variant)) || typeof entry.iconVersion !== "string" || !semver.test(entry.iconVersion) || typeof entry.component !== "string" || !componentName.test(entry.component) || typeof entry.sourceSvgSha256 !== "string" || !hash.test(entry.sourceSvgSha256) || typeof entry.sourceSha256 !== "string" || !hash.test(entry.sourceSha256) || entry.sourceUrl !== `${prefix}/${entry.sourceSha256}/${entry.component}.tsx`) return invalid();
    const expectedName = entry.name.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join("") + (entry.variant === "solid" ? "Solid" : "");
    const identity = `${entry.stableId}:${entry.variant}`;
    if (entry.component !== expectedName || identities.has(identity) || names.has(entry.component)) return invalid();
    identities.add(identity); names.add(entry.component);
    const variants = concepts.get(entry.stableId) ?? new Set<string>();
    variants.add(String(entry.variant)); concepts.set(entry.stableId, variants);
  }
  if (concepts.size !== input.conceptCount || [...concepts.values()].some(variants => variants.size !== 2)) return invalid();
  return input as unknown as ReactRelease;
}

let releasePromise: Promise<ReactRelease> | null = null;
export function loadReactRelease() {
  releasePromise ??= fetch("/downloads/react/release.json").then(async response => {
    if (!response.ok) throw new Error("React release unavailable.");
    return validateReactRelease(await response.json());
  }).catch((error: unknown) => { releasePromise = null; throw error; });
  return releasePromise;
}
export function supportsReactDelivery(icon: CatalogIcon) {
  return (!icon.library || icon.library === "core") && icon.provenance.kind === "original" && icon.licence === "MIT" && ["regular", "solid"].includes(icon.variant);
}
export function findReactEntry(release: ReactRelease, icon: CatalogIcon) {
  if (!supportsReactDelivery(icon)) return undefined;
  return release.components.find(entry => entry.stableId === icon.stableId && entry.name === icon.name && entry.variant === icon.variant && entry.iconVersion === icon.version);
}
export async function verifyReactSelection(entry: ReactComponentEntry, icon: CatalogIcon) {
  if (!supportsReactDelivery(icon) || !icon.svg || entry.stableId !== icon.stableId || entry.name !== icon.name || entry.variant !== icon.variant || entry.iconVersion !== icon.version || await sha256Text(icon.svg) !== entry.sourceSvgSha256) throw new Error("This React release does not match the selected Core source.");
}
function presentation(colour: string | null, size: number) {
  if (![24, 32, 40, 48].includes(size) || (colour !== null && !normalizeIconColour(colour))) throw new Error("Invalid React presentation settings.");
  return { colour: colour === null ? null : normalizeIconColour(colour), size };
}
export function reactUsage(entry: ReactComponentEntry, colour: string | null, size: number) {
  const selected = presentation(colour, size);
  if (!componentName.test(entry.component)) throw new Error("Invalid React component name.");
  return `import ${entry.component} from "@formaglyph/react/${entry.component}";\n\n<${entry.component} size={${size}}${selected.colour ? ` color=${JSON.stringify(selected.colour)}` : ""} />`;
}
export function prepareReactSource(source: string, entry: ReactComponentEntry, colour: string | null, size: number) {
  const selected = presentation(colour, size);
  const sizeMarker = "const defaultSize = 24;", colourMarker = 'const defaultColor = "currentColor";';
  if (source.split(sizeMarker).length !== 2 || source.split(colourMarker).length !== 2) throw new Error("Unsupported React component source template.");
  return `// Formaglyph presentation defaults: ${size}px, ${selected.colour ?? "currentColor"}. Original component SHA-256: ${entry.sourceSha256}.\n` + source.replace(sizeMarker, `const defaultSize = ${size};`).replace(colourMarker, `const defaultColor = ${JSON.stringify(selected.colour ?? "currentColor")};`);
}
export async function fetchReactSource(entry: ReactComponentEntry, colour: string | null, size: number) {
  const response = await fetch(entry.sourceUrl);
  if (!response.ok) throw new Error("React component unavailable.");
  const source = await response.text();
  if (await sha256Text(source) !== entry.sourceSha256) throw new Error("React component integrity check failed.");
  return prepareReactSource(source, entry, colour, size);
}
export async function fetchReactArchive(release: ReactRelease) {
  const response = await fetch(release.package.url);
  if (!response.ok) throw new Error("React package unavailable.");
  const bytes = await response.arrayBuffer();
  const actualHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), value => value.toString(16).padStart(2, "0")).join("");
  if (bytes.byteLength !== release.package.bytes || actualHash !== release.package.sha256) throw new Error("React package integrity check failed.");
  return bytes;
}
export function downloadReactFile(filename: string, content: string | ArrayBuffer, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
