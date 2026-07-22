import { chmod, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const shared = {
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  sourcemap: true,
  legalComments: "none",
};

await Promise.all([
  build({ ...shared, entryPoints: [resolve(root, "src/cli.ts")], outfile: resolve(dist, "formaglyph.mjs"), banner: { js: "#!/usr/bin/env node" } }),
  build({ ...shared, entryPoints: [resolve(root, "src/stdio.ts")], outfile: resolve(dist, "formaglyph-mcp.mjs"), banner: { js: "#!/usr/bin/env node" } }),
  build({ ...shared, entryPoints: [resolve(root, "src/index.ts")], outfile: resolve(dist, "index.mjs") }),
  build({ ...shared, entryPoints: [resolve(root, "src/http.ts")], outfile: resolve(dist, "http.mjs") }),
]);

await promisify(execFile)(resolve(root, "node_modules/.bin/tsc"), [
  "--project", resolve(root, "tsconfig.build.json"),
]);

await Promise.all([
  chmod(resolve(dist, "formaglyph.mjs"), 0o755),
  chmod(resolve(dist, "formaglyph-mcp.mjs"), 0o755),
]);
