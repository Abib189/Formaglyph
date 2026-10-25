import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readRetainedRelease, verifyCurrentRelease } from "../../../packages/react/scripts/retained-release.mjs";

const root = resolve(import.meta.dirname, ".."), packageRoot = resolve(root, "../../packages/react");
const currentPackage = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
await verifyCurrentRelease(packageRoot);
async function output(url, bytes) { const path = resolve(root, "public", url.slice(1)); await mkdir(resolve(path, ".."), { recursive: true }); await writeFile(path, bytes); }
for (const file of (await readdir(resolve(packageRoot, "releases"))).filter(name => /^\d+\.\d+\.\d+\.json$/.test(name)).sort()) {
  const { record, manifest, bytes, files } = await readRetainedRelease(packageRoot, file.slice(0, -5));
  const prefix = `/downloads/react/${manifest.version}`;
  const descriptor = { schemaVersion: 1, name: manifest.name, version: manifest.version, coreVersion: manifest.coreVersion, conceptCount: manifest.conceptCount, componentCount: manifest.componentCount, licence: "MIT", package: { url: `${prefix}/${record.sha256}/formaglyph-react-${manifest.version}.tgz`, sha256: record.sha256, bytes: bytes.length }, components: [] };
  await output(descriptor.package.url, bytes);
  for (const entry of manifest.components) {
    if (!/^[A-Z][A-Za-z0-9]+$/.test(entry.component) || entry.sourcePath !== `sources/${entry.component}.tsx`) throw new Error("Invalid component path.");
    const source = files.get(entry.sourcePath);
    if (!source || createHash("sha256").update(source).digest("hex") !== entry.sourceSha256) throw new Error("Retained React source hash mismatch.");
    const sourceUrl = `${prefix}/${entry.sourceSha256}/${entry.component}.tsx`;
    await output(sourceUrl, source);
    descriptor.components.push({ ...entry, sourceUrl });
  }
  if (manifest.version === currentPackage.version) await output("/downloads/react/release.json", JSON.stringify(descriptor, null, 2) + "\n");
  console.log(`Retained React ${manifest.version}: ${manifest.componentCount} immutable sources and package archive prepared.`);
}
