import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../..");
const releaseRoot = resolve(packageRoot, "release");
const packageSource = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));

await rm(releaseRoot, { recursive: true, force: true });
await mkdir(releaseRoot, { recursive: true });
// Ship only declared SVGs, never workspace backups or unrelated files in assets/.
const manifest = JSON.parse(await readFile(resolve(packageRoot, "assets/manifest.json"), "utf8"));
const assetsRoot = resolve(packageRoot, "assets");
for (const asset of manifest.assets) {
  if (typeof asset.path !== "string" || !/^assets\/[a-z0-9-]+\/(regular|solid)\.svg$/.test(asset.path)) {
    throw new Error("Invalid release asset path.");
  }
  const source = resolve(packageRoot, asset.path);
  if (!source.startsWith(`${assetsRoot}${sep}`)) throw new Error("Release asset is outside assets/.");
  const destination = resolve(releaseRoot, "svg", asset.path.slice("assets/".length));
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}
await cp(resolve(packageRoot, "src/catalog.mjs"), resolve(releaseRoot, "catalog.mjs"));
await cp(resolve(packageRoot, "README.md"), resolve(releaseRoot, "README.md"));
await cp(resolve(repositoryRoot, "LICENSE-ASSETS"), resolve(releaseRoot, "LICENSE"));
await cp(resolve(packageRoot, "assets/manifest.json"), resolve(releaseRoot, "manifest.json"));

const releasePackage = {
  name: packageSource.name,
  version: packageSource.version,
  description: packageSource.description,
  type: "module",
  sideEffects: false,
  license: "MIT",
  exports: {
    ".": { types: "./index.d.ts", import: "./index.js" },
    "./manifest.json": "./manifest.json",
    "./svg/*": "./svg/*",
  },
  files: ["catalog.mjs", "index.d.ts", "index.js", "manifest.json", "svg"],
};

await writeFile(resolve(releaseRoot, "package.json"), `${JSON.stringify(releasePackage, null, 2)}\n`, "utf8");
await writeFile(resolve(releaseRoot, "index.js"), `import { formaglyphAssets } from "./catalog.mjs";\nexport { formaglyphAssets };\nexport const findFormaglyphAsset = (stableId, variant) => formaglyphAssets.find((asset) => asset.stableId === stableId && asset.variant === variant);\n`, "utf8");
await writeFile(resolve(releaseRoot, "index.d.ts"), `export type IconVariant = "regular" | "solid";\nexport interface FormaglyphIconAsset {\n  id: string;\n  stableId: string;\n  name: string;\n  label: string;\n  category: string;\n  description: string;\n  tags: string[];\n  aliases: Array<{ locale: string; value: string; reviewed: boolean }>;\n  version: string;\n  variant: IconVariant;\n  directionality: "neutral" | "ltr-specific" | "rtl-specific" | "mirrored-safe";\n  licence: "MIT";\n  status: "published";\n  provenance: { kind: "original"; source: string; sourceRevision?: string; disclosed: true };\n  assetPath: string;\n  svg: string;\n}\nexport const formaglyphAssets: readonly FormaglyphIconAsset[];\nexport function findFormaglyphAsset(stableId: string, variant: IconVariant): FormaglyphIconAsset | undefined;\n`, "utf8");

console.log(`Built npm-ready package at ${releaseRoot}.`);
