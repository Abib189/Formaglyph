import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { c, t } from "tar";
import { resolve } from "node:path";

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export async function releaseFiles(root) {
  return (await readdir(root, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => `${entry.parentPath.slice(root.length + 1)}/${entry.name}`.replace(/^\//, "").replaceAll("\\", "/"))
    .sort();
}
export async function releaseTreeHash(root) {
  const entries = [];
  for (const file of await releaseFiles(root)) entries.push([file, digest(await readFile(resolve(root, file)))]);
  return digest(JSON.stringify(entries));
}

// Only the generated release tree is packaged. Stable metadata and ordering make
// repeat builds byte-for-byte reproducible; no browser state or wall-clock time.
export async function createReactArchive(root) {
  const files = await releaseFiles(root);
  const stream = c({ cwd: root, prefix: "package", portable: true, mtime: new Date("1985-10-26T08:15:00Z"), gzip: true, noPax: true }, files);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  return { bytes, sha256: digest(bytes) };
}

// Parse committed archives in memory; never extract their paths to disk.
export async function readReactArchive(bytes) {
  const files = new Map();
  let total = 0;
  const parser = t({ strict: true, onReadEntry(entry) {
    if (entry.type !== "File" || !entry.path.startsWith("package/") || entry.path.split("/").some(part => part === ".." || !part) || entry.size > 256_000 || total + entry.size > 5_000_000) {
      parser.destroy(new Error("Invalid retained React archive entry.")); return;
    }
    const path = entry.path.slice("package/".length);
    if (files.has(path)) { parser.destroy(new Error("Duplicate archive entry.")); return; }
    total += entry.size;
    const chunks = [];
    files.set(path, null);
    entry.on("data", chunk => chunks.push(chunk));
    entry.on("end", () => files.set(path, Buffer.concat(chunks)));
  } });
  await new Promise((done, reject) => { parser.on("end", done); parser.on("error", reject); parser.end(bytes); });
  if ([...files.values()].some(value => value === null)) throw new Error("Incomplete retained React archive.");
  return files;
}
export function archiveTreeHash(files) {
  return digest(JSON.stringify([...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([path, bytes]) => [path, digest(bytes)])));
}
