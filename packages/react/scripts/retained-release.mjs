import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { archiveTreeHash, readReactArchive, releaseTreeHash } from "./archive.mjs";

export async function readRetainedRelease(root, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid React release version.");
  const record = JSON.parse(await readFile(resolve(root, "releases", `${version}.json`), "utf8"));
  if (record.version !== version || !/^[a-f0-9]{64}$/.test(record.sha256) || record.file !== `formaglyph-react-${version}-${record.sha256}.tgz`) throw new Error("Invalid retained release record.");
  const bytes = await readFile(resolve(root, "releases", record.file));
  if (createHash("sha256").update(bytes).digest("hex") !== record.sha256 || bytes.length !== record.bytes) throw new Error("Retained React archive hash mismatch.");
  const files = await readReactArchive(bytes);
  if (archiveTreeHash(files) !== record.treeSha256) throw new Error("Retained React archive contents changed.");
  const manifest = JSON.parse(files.get("manifest.json")?.toString() ?? "null");
  if (!manifest || manifest.name !== "@formaglyph/react" || manifest.version !== version) throw new Error("Retained React manifest mismatch.");
  return { record, bytes, files, manifest };
}
export async function verifyCurrentRelease(root) {
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const retained = await readRetainedRelease(root, pkg.version);
  if (await releaseTreeHash(resolve(root, "release")) !== retained.record.treeSha256) throw new Error("React release contents changed without a new package version. Bump the version and freeze a new release; never overwrite a retained artifact.");
  return retained;
}
