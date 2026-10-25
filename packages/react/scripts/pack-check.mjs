import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import { verifyCurrentRelease } from "./retained-release.mjs";

const exec = promisify(execFile), require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, "..");
const scratch = await mkdtemp(resolve(tmpdir(), "formaglyph-react-consumer-"));
const retained = await verifyCurrentRelease(root);
const archive = { bytes: retained.bytes, sha256: retained.record.sha256 };
const archivePath = resolve(scratch, `formaglyph-react-${retained.record.version}.tgz`);
await writeFile(archivePath, archive.bytes);
assert.ok(process.env.npm_execpath, "Run this check through pnpm pack:check.");
for (const [reactVersion, typesVersion] of [["18.3.1", "18.3.12"], ["19.2.0", "19.2.2"]]) {
  const consumer = await mkdtemp(resolve(scratch, `react-${reactVersion}-`));
  await writeFile(resolve(consumer, "package.json"), JSON.stringify({ name: "formaglyph-consumer-test", private: true, type: "module", dependencies: { "@formaglyph/react": `file:${archivePath}`, react: reactVersion, "react-dom": reactVersion, "@types/react": typesVersion } }));
  await exec(process.execPath, [process.env.npm_execpath, "install", "--ignore-scripts", "--prefer-offline", "--ignore-workspace"], { cwd: consumer, timeout: 120_000, maxBuffer: 1024 * 1024 });
  await writeFile(resolve(consumer, "smoke.mjs"), `import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CloudUpload from "@formaglyph/react/CloudUpload";
import { CloudUploadSolid } from "@formaglyph/react";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const Icon of [CloudUpload, CloudUploadSolid, require("@formaglyph/react/CloudUpload").CloudUpload]) {
 const svg = renderToStaticMarkup(createElement(Icon, { title: "Upload file", size: 32, color: "#A10232" }));
 assert.match(svg, /role="img"/); assert.match(svg, /color="#A10232"/); assert.match(svg, /width="32"/); assert.match(svg, /Upload file/);
}
console.log("React ${reactVersion}: installed ESM/CJS package and rendered named icons.");
`);
  await exec(process.execPath, [resolve(consumer, "smoke.mjs")], { cwd: consumer });
  await writeFile(resolve(consumer, "types.tsx"), `import { createRef } from "react";\nimport CloudUpload from "@formaglyph/react/CloudUpload";\nconst ref = createRef<SVGSVGElement>();\n<CloudUpload ref={ref} size="1em" title="Upload file" />;\n`);
  await writeFile(resolve(consumer, "types.cts"), 'import { CloudUpload } from "@formaglyph/react/CloudUpload";\nimport type { IconProps } from "@formaglyph/react";\nconst props: IconProps = { title: "Upload file" };\nvoid CloudUpload; void props;\n');
  await exec(process.execPath, [require.resolve("typescript/bin/tsc"), "--noEmit", "--strict", "--skipLibCheck", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--jsx", "react-jsx", "--target", "ES2022", resolve(consumer, "types.tsx"), resolve(consumer, "types.cts")], { cwd: consumer });
  console.log(`React ${reactVersion}: real archive installation, server rendering, ref and ESM/CJS declarations passed.`);
}
const pkg = JSON.parse(await readFile(resolve(root, "release/package.json"), "utf8"));
assert.equal(pkg.dependencies, undefined);
console.log(`Self-contained archive verified: ${archive.bytes.length} bytes, SHA-256 ${archive.sha256}. No publication performed.`);
