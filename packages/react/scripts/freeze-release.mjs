import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createReactArchive, releaseTreeHash } from "./archive.mjs";
import { verifyCurrentRelease } from "./retained-release.mjs";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error("Invalid package version.");
const recordPath = resolve(root, "releases", `${pkg.version}.json`);
let exists = false;
try { await readFile(recordPath); exists = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
if (exists) {
  await verifyCurrentRelease(root);
  console.log(`React ${pkg.version} is already frozen and verified.`);
} else {
  const archive = await createReactArchive(resolve(root, "release"));
  const record = { schemaVersion: 1, version: pkg.version, file: `formaglyph-react-${pkg.version}-${archive.sha256}.tgz`, sha256: archive.sha256, bytes: archive.bytes.length, treeSha256: await releaseTreeHash(resolve(root, "release")) };
  await mkdir(resolve(root, "releases"), { recursive: true });
  await writeFile(resolve(root, "releases", record.file), archive.bytes, { flag: "wx" });
  await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n", { flag: "wx" });
  console.log(`Frozen React ${pkg.version}; commit the archive and release record. No registry publication performed.`);
}
