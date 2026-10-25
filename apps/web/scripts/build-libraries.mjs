import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { icons } from "@phosphor-icons/core";
import { sanitizeAndValidateSvg } from "../../../packages/validators/src/svg.ts";
import { sanitizeAndValidateCatalogSvg } from "../../../packages/validators/src/catalogSvg.ts";
import { LIBRARY_SOURCES, ICONIFY_PACKAGES } from "../src/data/librarySources.ts";
import { additionalIdentity } from "../src/data/additionalLibraryIdentity.ts";
import { inlineLocalPathUses } from "./inline-local-paths.mjs";
import { stripCanvasClip } from "./strip-canvas-clip.mjs";

const require = createRequire(import.meta.url);
const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(webRoot, "public/libraries");
const packageRoot = resolve(dirname(require.resolve("@phosphor-icons/core")), "..");
const pkg = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
const license = await readFile(resolve(packageRoot, "LICENSE"), "utf8");
const upstreamWeights = ["thin", "light", "regular", "bold", "fill", "duotone"];
// The fg.1 suffix versions our safety/attribution wrapper independently of upstream.
const assetBase = `/libraries/phosphor/${pkg.version}-fg.1`;
const source = {
  id: "phosphor", label: "Phosphor Icons", version: pkg.version, licence: "MIT",
  sourceUrl: "https://github.com/phosphor-icons/core",
  licenseUrl: "/libraries/phosphor/LICENSE.txt", conceptCount: icons.length,
  assetCount: icons.length * upstreamWeights.length, grid: 256,
};
const concepts = [];
await mkdir(resolve(outputRoot, "phosphor"), { recursive: true });
await writeFile(resolve(outputRoot, "phosphor/LICENSE.txt"), license);

for (const weight of upstreamWeights) await mkdir(resolve(webRoot, `public${assetBase}/${weight}`), { recursive: true });
for (const icon of icons) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon.name)) throw new Error(`Unsafe upstream name: ${icon.name}`);
  const assets = [];
  for (const weight of upstreamWeights) {
    const filename = weight === "regular" ? icon.name : `${icon.name}-${weight}`;
    const original = await readFile(resolve(packageRoot, `assets/${weight}/${filename}.svg`), "utf8");
    const validation = sanitizeAndValidateSvg(original.replace("<svg ", '<svg aria-hidden="true" focusable="false" '), { targetViewBox: [0, 0, 256, 256] });
    if (!validation.safe || validation.status !== "passed" || !validation.normalizedSvg) {
      throw new Error(`${icon.name}/${weight}: ${JSON.stringify(validation.issues)}`);
    }
    // Include the complete upstream notice in every independently copied/downloaded SVG.
    const svg = validation.normalizedSvg.replace(/(<svg\b[^>]*>)/, `$1<!--\nPhosphor Icons: ${source.sourceUrl}\n${license.replaceAll("--", "—")}-->`);
    const url = `${assetBase}/${weight}/${icon.name}.svg`;
    await writeFile(resolve(webRoot, `public${url}`), svg);
    assets.push({ variant: weight === "fill" ? "solid" : weight, upstreamWeight: weight, url, sha256: createHash("sha256").update(svg).digest("hex") });
  }
  const categories = icon.categories.map((category) => category.replaceAll("-", " ").replace(/\b[a-z]/g, (letter) => letter.toUpperCase()));
  concepts.push({
    stableId: `ico_phosphor_${icon.name.replaceAll("-", "_")}`, name: icon.name,
    label: icon.pascal_name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
    categories, tags: icon.tags.filter((tag) => !tag.startsWith("*")),
    aliases: icon.alias ? [icon.alias.name] : [icon.name.replaceAll("-", " ")], assets,
  });
}

await writeFile(resolve(outputRoot, "phosphor/catalog.json"), `${JSON.stringify({ schemaVersion: 1, source, concepts })}\n`);
const morphRoot = resolve(dirname(require.resolve("morphicons/react")), "..");
const morphLicense = await readFile(resolve(morphRoot, "LICENSE"), "utf8");
await mkdir(resolve(outputRoot, "morphicons"), { recursive: true });
await writeFile(resolve(outputRoot, "morphicons/LICENSE.txt"), morphLicense);
console.log(`Built ${source.conceptCount} Phosphor concepts / ${source.assetCount} validated SVGs with upstream notices.`);

const sources = [source];
const escapeText = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
function canonicalAsset(library, name) {
  const additional = additionalIdentity(library, name);
  if (additional) return additional;
  if (library === "bootstrap" && name.endsWith("-fill")) return { name: name.slice(0, -5), variant: "solid", grid: 16 };
  if (library === "iconoir" && name.endsWith("-solid")) return { name: name.slice(0, -6), variant: "solid", grid: 24 };
  if (library === "ionicons") {
    if (name === "logo-x") return { name, variant: "solid", grid: 16 };
    if (name.endsWith("-outline")) return { name: name.slice(0, -8), variant: "regular", grid: 512 };
    if (name.endsWith("-sharp")) return { name: name.slice(0, -6), variant: "sharp", grid: 512 };
    return { name, variant: "solid", grid: 512 };
  }
  // This upstream icon intentionally has a non-square viewport. Do not crop or scale its geometry.
  if (library === "hugeicons" && name === "image-flip-horizontal") return { name, variant: "regular", grid: 24, gridHeight: 25 };
  if (library === "tabler" && name.endsWith("-filled")) return { name: name.slice(0, -7), variant: "solid", grid: 24 };
  if (library === "heroicons") {
    if (name.endsWith("-16-solid")) return { name: name.slice(0, -9), variant: "micro", grid: 16 };
    if (name.endsWith("-20-solid")) return { name: name.slice(0, -9), variant: "mini", grid: 20 };
    if (name.endsWith("-solid")) return { name: name.slice(0, -6), variant: "solid", grid: 24 };
  }
  return { name, variant: "regular", grid: LIBRARY_SOURCES[library].grid };
}

for (const [library, packageName] of Object.entries(ICONIFY_PACKAGES)) {
  const config = LIBRARY_SOURCES[library];
  const data = require(`${packageName}/icons.json`);
  const info = require(`${packageName}/info.json`);
  const dist = require(`${packageName}/package.json`);
  const notice = await readFile(resolve(webRoot, `scripts/notices/${library}.txt`), "utf8") + (library === "simple-icons" ? "\n" + await readFile(resolve(webRoot, "scripts/notices/simple-icons-disclaimer.txt"), "utf8") : "");
  if (info.license.spdx !== config.licence || data.prefix !== packageName.slice("@iconify-json/".length)) throw new Error(`Unexpected licence/source for ${library}`);
  const allVisible = Object.entries(data.icons).filter(([, icon]) => !icon.hidden);
  if (allVisible.length !== info.total) throw new Error(`Incomplete snapshot: ${library}`);
  // Project-level CC0 is not a licence grant for every brand. Fail closed.
  const brandRoot = library === "simple-icons" ? dirname(require.resolve("simple-icons")) : null;
  const brandData = brandRoot ? new Map(JSON.parse(await readFile(resolve(brandRoot, "data/simple-icons.json"), "utf8")).map(brand => [brand.slug, brand])) : null;
  if (brandData && JSON.parse(await readFile(resolve(brandRoot, "package.json"), "utf8")).version !== info.version) throw new Error("Simple Icons metadata/geometry version mismatch.");
  const visible = brandData ? allVisible.filter(([name]) => brandData.get(name)?.license?.type === "CC0-1.0") : allVisible;
  const librarySource = {
    ...config, version: dist.version, licenseUrl: `/libraries/${library}/LICENSE.txt`,
    licenceLabel: library === "lucide" ? "ISC + MIT (Feather)" : library === "simple-icons" ? "CC0-1.0 · explicit per-brand subset" : config.licence,
    upstreamVersion: info.version,
    distribution: `${packageName}@${dist.version}`,
    distributionUrl: "https://github.com/iconify/icon-sets",
    snapshotModifiedAt: new Date(data.lastModified * 1000).toISOString(),
    conceptCount: 0, assetCount: visible.length,
  };
  const base = `/libraries/${library}/${dist.version}-fg.1`;
  const grouped = new Map();
  await mkdir(resolve(outputRoot, library), { recursive: true });
  await writeFile(resolve(outputRoot, `${library}/LICENSE.txt`), notice);
  if (brandData) await writeFile(resolve(outputRoot, `${library}/IMPORT-REPORT.json`), JSON.stringify({ metadata: `simple-icons@${info.version}`, policy: "Only explicitly CC0-1.0 brands; no inferred licences. Trademark/guideline restrictions still apply.", included: visible.length, excluded: allVisible.filter(([name]) => brandData.get(name)?.license?.type !== "CC0-1.0").map(([name]) => ({ name, licence: brandData.get(name)?.license?.type ?? "unspecified" })) }) + "\n");
  for (const variant of config.weights) await mkdir(resolve(webRoot, `public${base}/${variant === "solid" ? "fill" : variant}`), { recursive: true });
  for (const [upstreamName, icon] of visible) {
    const identity = canonicalAsset(library, upstreamName);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identity.name) || !config.weights.includes(identity.variant)) throw new Error(`Unsafe identity: ${library}/${upstreamName}`);
    const width = icon.width ?? data.width ?? data.height ?? 16;
    const height = icon.height ?? data.height ?? 16;
    if (width !== identity.grid || height !== (identity.gridHeight ?? identity.grid) || icon.rotate || icon.hFlip || icon.vFlip || icon.left || icon.top) throw new Error(`Unsupported source transform/grid: ${library}/${upstreamName}`);
    const body = library === "hugeicons" && upstreamName === "dump-truck" ? stripCanvasClip(icon.body) : icon.body;
    const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true" focusable="false">${inlineLocalPathUses(body)}</svg>`;
    const validate = ["radix", "iconoir", "healthicons"].includes(library) ? sanitizeAndValidateCatalogSvg : sanitizeAndValidateSvg;
    const validated = validate(raw, { targetViewBox: [0, 0, width, height] });
    if (!validated.safe || validated.status !== "passed" || !validated.normalizedSvg) throw new Error(`${library}/${upstreamName}: ${JSON.stringify(validated.issues)}`);
    // <desc> preserves the exact notice, including '--' separators invalid in XML comments.
    const brand = brandData?.get(upstreamName);
    const brandNotice = brand ? `\nBrand: ${brand.title}\nBrand source: ${brand.source}\nBrand licence: ${brand.license.type}\nBrand guidelines: ${brand.guidelines ?? "Not supplied; consult the source owner."}\nMetadata: simple-icons@${info.version}\nNo trademark rights or endorsement are granted.\n` : "";
    const modification = library === "material-symbols" ? "\nFormaglyph modified this SVG: normalized the SVG wrapper and safe attributes; geometry retained from the pinned Iconify snapshot.\n" : "";
    const svg = validated.normalizedSvg.replace(/(<svg\b[^>]*>)/, `$1<desc>${escapeText(`${config.label}: ${config.sourceUrl}\nIconify snapshot: ${packageName}@${dist.version}\n${notice}${brandNotice}${modification}`)}</desc>`);
    const pathWeight = identity.variant === "solid" ? "fill" : identity.variant;
    const url = `${base}/${pathWeight}/${identity.name}.svg`;
    await writeFile(resolve(webRoot, `public${url}`), svg);
    let concept = grouped.get(identity.name);
    if (!concept) {
      concept = { stableId: `ico_${library}_${identity.name.replaceAll("-", "_")}`, name: identity.name, label: brand?.title ?? identity.name.replaceAll("-", " ").replace(/\b[a-z]/g, (letter) => letter.toUpperCase()), categories: [brand || /^(?:brand|logo|mark-github|lockup-github)-/.test(identity.name) ? "Brand marks" : library === "healthicons" ? "Healthcare" : "General"], tags: identity.name.split("-"), aliases: [identity.name.replaceAll("-", " ")], ...(brand ? { brand: { sourceUrl: brand.source, guidelinesUrl: brand.guidelines, licence: brand.license.type, metadata: `simple-icons@${info.version}` } } : {}), assets: [] };
      grouped.set(identity.name, concept);
    }
    if (concept.assets.some((asset) => asset.variant === identity.variant)) throw new Error(`Duplicate variant: ${library}/${upstreamName}`);
    const fixedWhite = /(?:fill|stroke)="#(?:fff|FFFFFF)"/.test(svg);
    const exactPaint = fixedWhite || /<mask\b/.test(svg);
    concept.assets.push({ variant: identity.variant, grid: identity.grid, ...(identity.gridHeight ? { gridHeight: identity.gridHeight } : {}), ...(exactPaint ? { exactPaint: true } : {}), ...(fixedWhite ? { fixedWhite: true } : {}), upstreamName, url, sha256: createHash("sha256").update(svg).digest("hex") });
  }
  for (const [alias, entry] of Object.entries(data.aliases ?? {})) {
    if (entry.rotate || entry.hFlip || entry.vFlip) continue;
    let parent = entry.parent;
    const seen = new Set([alias]);
    while (data.aliases?.[parent] && !seen.has(parent)) { seen.add(parent); parent = data.aliases[parent].parent; }
    if (!data.icons[parent] || data.icons[parent].hidden) continue;
    const concept = grouped.get(canonicalAsset(library, parent).name);
    if (concept && !concept.aliases.includes(alias)) concept.aliases.push(alias);
  }
  const libraryConcepts = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const concept of libraryConcepts) concept.assets.sort((a, b) => config.weights.indexOf(a.variant) - config.weights.indexOf(b.variant));
  librarySource.conceptCount = libraryConcepts.length;
  await writeFile(resolve(outputRoot, `${library}/catalog.json`), `${JSON.stringify({ schemaVersion: 1, source: librarySource, concepts: libraryConcepts })}\n`);
  sources.push(librarySource);
  console.log(`Built ${librarySource.conceptCount} ${config.label} concepts / ${librarySource.assetCount} validated SVGs from pinned ${packageName}@${dist.version}.`);
}

// A human-readable notice index, served as plain text by the production server.
await writeFile(resolve(outputRoot, "NOTICE.txt"), sources.map((item) => `${item.label}\nSource: ${item.sourceUrl}\nLicence: ${item.licenceLabel ?? item.licence}\nSnapshot/release: ${item.distribution ?? item.version}\nFull notice: ${item.licenseUrl}\n`).join("\n") + "\nMorphicons engine: /libraries/morphicons/LICENSE.txt\nBrand symbols may have separate trademark/usage requirements; no affiliation is implied.\n");
