import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formaglyphAssets } from "../src/catalog.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = resolve(packageRoot, "assets");
await rm(assetsRoot, { recursive: true, force: true });

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
await writeFile(resolve(assetsRoot, "manifest.json"), `${JSON.stringify({
  schemaVersion: 2,
  name: "Formaglyph Core",
  version: "0.1.0",
  grid: 24,
  licence: "MIT",
  conceptCount: concepts,
  assetCount: manifest.length,
  assets: manifest,
}, null, 2)}\n`, "utf8");
console.log(`Built ${manifest.length} Formaglyph SVG assets.`);
