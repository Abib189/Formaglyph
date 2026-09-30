import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { icons } from "@phosphor-icons/core";
import { sanitizeAndValidateSvg } from "../../../packages/validators/src/svg.ts";

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
