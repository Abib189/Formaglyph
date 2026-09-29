import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { formaglyphAssets } from "../src/catalog.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = resolve(packageRoot, "assets");
const manifestPath = resolve(assetsRoot, "manifest.json");
const packageSource = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
let previousAssets = [];
try {
  previousAssets = JSON.parse(await readFile(manifestPath, "utf8")).assets;
  if (!Array.isArray(previousAssets)) throw new Error("Existing asset manifest is invalid.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const nextPaths = new Set(formaglyphAssets.map((asset) => resolve(packageRoot, asset.assetPath)));
for (const asset of previousAssets) {
  if (typeof asset.path !== "string") throw new Error("Existing asset manifest contains an invalid path.");
  const oldPath = resolve(packageRoot, asset.path);
  if (!oldPath.startsWith(`${assetsRoot}${sep}`) || !oldPath.endsWith(".svg")) {
    throw new Error("Existing asset manifest contains a path outside the generated SVG directory.");
  }
  if (!nextPaths.has(oldPath)) await rm(oldPath, { force: true });
}

const manifest = [];
for (const asset of formaglyphAssets) {
  const outputPath = resolve(packageRoot, asset.assetPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, asset.svg, "utf8");
  manifest.push({
    stableId: asset.stableId,
    name: asset.name,
    label: asset.label,
    category: asset.category,
    description: asset.description,
    tags: asset.tags,
    aliases: asset.aliases,
    directionality: asset.directionality,
    licence: asset.licence,
    provenance: asset.provenance,
    variant: asset.variant,
    version: asset.version,
    path: asset.assetPath,
    bytes: Buffer.byteLength(asset.svg),
    sha256: createHash("sha256").update(asset.svg).digest("hex"),
  });
}

const concepts = new Set(manifest.map((asset) => asset.stableId)).size;
await writeFile(manifestPath, `${JSON.stringify({
  schemaVersion: 2,
  name: "Formaglyph Core",
  version: packageSource.version,
  grid: 24,
  licence: "MIT",
  conceptCount: concepts,
  assetCount: manifest.length,
  assets: manifest,
}, null, 2)}\n`, "utf8");
console.log(`Built ${manifest.length} Formaglyph SVG assets.`);
