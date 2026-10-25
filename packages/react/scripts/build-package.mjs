import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import { DOMParser } from "@xmldom/xmldom";
import { formaglyphAssets } from "@formaglyph/icons";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = resolve(root, "../..");
const output = resolve(root, "release");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const core = JSON.parse(await readFile(resolve(repository, "packages/icons/package.json"), "utf8"));
const licence = await readFile(resolve(repository, "LICENSE-ASSETS"), "utf8");
const digest = value => createHash("sha256").update(value).digest("hex");
const attrName = name => name === "class" ? "className" : name.startsWith("aria-") || name.startsWith("data-") ? name : name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const attributes = node => Array.from(node.attributes).map(attr => `${attrName(attr.name)}={${JSON.stringify(attr.value)}}`).join(" ");
function jsx(node) {
  if (node.nodeType === 3) return node.data.trim() ? `{${JSON.stringify(node.data)}}` : "";
  if (node.nodeType !== 1) return "";
  return `<${node.tagName}${node.attributes.length ? ` ${attributes(node)}` : ""}>${Array.from(node.childNodes).map(jsx).join("")}</${node.tagName}>`;
}
const props = `export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML" | "title"> {
  size?: number | string;
  title?: string;
  titleId?: string;
  children?: never;
  dangerouslySetInnerHTML?: never;
}`;
const manifest = { schemaVersion: 1, name: pkg.name, version: pkg.version, coreVersion: core.version, licence: "MIT", conceptCount: new Set(formaglyphAssets.map(a => a.stableId)).size, componentCount: formaglyphAssets.length, components: [] };

await rm(output, { recursive: true, force: true });
await Promise.all(["esm", "cjs", "sources"].map(dir => mkdir(resolve(output, dir), { recursive: true })));
await writeFile(resolve(output, "cjs/package.json"), '{"type":"commonjs"}\n');
await cp(resolve(root, "README.md"), resolve(output, "README.md"));
await writeFile(resolve(output, "LICENSE"), licence);
const names = new Set();
for (const asset of formaglyphAssets) {
  if (asset.provenance.kind !== "original" || asset.licence !== "MIT" || !/^[a-z]+(?:-[a-z0-9]+)*$/.test(asset.name) || !["regular", "solid"].includes(asset.variant)) throw new Error("React release accepts original Core pairs only.");
  const validation = sanitizeAndValidateSvg(asset.svg);
  if (!validation.safe || validation.status !== "passed") throw new Error(`Unsafe Core asset: ${asset.id}`);
  const component = asset.name.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join("") + (asset.variant === "solid" ? "Solid" : "");
  if (names.has(component)) throw new Error(`Component name collision: ${component}`);
  names.add(component);
  const svg = new DOMParser().parseFromString(asset.svg, "image/svg+xml").documentElement;
  svg.removeAttribute("aria-hidden");
  svg.removeAttribute("focusable");
  const sourceHash = digest(asset.svg);
  const source = `/*\n${licence.trim().split("\n").map(line => ` * ${line}`).join("\n")}\n */
"use client";
// Formaglyph Core ${asset.version}; ${asset.stableId}; ${asset.variant}.
// Original SVG SHA-256: ${sourceHash}. Geometry and directionality are unchanged.
import { forwardRef, useId, type SVGProps } from "react";
${props}
const defaultSize = 24;
const defaultColor = "currentColor";
export const ${component} = /* @__PURE__ */ forwardRef<SVGSVGElement, IconProps>(function ${component}(
  { size = defaultSize, color = defaultColor, title, titleId, children: _children, dangerouslySetInnerHTML: _html, ...svgProps }, ref,
) {
  const generatedId = useId();
  const resolvedTitleId = titleId ?? generatedId;
  const named = Boolean(title || svgProps["aria-label"] || svgProps["aria-labelledby"]);
  return (
    <svg ${attributes(svg)} {...svgProps} ref={ref} width={svgProps.width ?? size} height={svgProps.height ?? size} color={color}
      role={svgProps.role ?? (named ? "img" : undefined)}
      aria-hidden={svgProps["aria-hidden"] ?? (named ? undefined : true)}
      aria-labelledby={svgProps["aria-labelledby"] ?? (title && !svgProps["aria-label"] ? resolvedTitleId : undefined)}
      focusable={svgProps.focusable ?? false}>
      {title ? <title id={resolvedTitleId}>{title}</title> : null}
      ${Array.from(svg.childNodes).map(jsx).join("\n      ")}
    </svg>
  );
});
export default ${component};
`;
  await writeFile(resolve(output, `sources/${component}.tsx`), source);
  for (const format of ["esm", "cjs"]) {
    const result = await transform(source, { loader: "tsx", format, jsx: "automatic", target: "es2020", legalComments: "none" });
    await writeFile(resolve(output, format, `${component}.js`), `// MIT; Copyright (c) 2026 Formaglyph contributors. See ../LICENSE.\n${result.code}`);
    const typeExt = format === "esm" ? "ts" : "cts";
    const importExt = format === "esm" ? "js" : "cjs";
    await writeFile(resolve(output, `${component}.d.${typeExt}`), `import type { IconComponent } from "./types.${importExt}";\nexport declare const ${component}: IconComponent;\nexport default ${component};\n`);
  }
  manifest.components.push({ stableId: asset.stableId, name: asset.name, variant: asset.variant, iconVersion: asset.version, component, directionality: asset.directionality, sourceSvgSha256: sourceHash, sourceSha256: digest(source), sourcePath: `sources/${component}.tsx` });
}
for (const format of ["esm", "cjs"]) {
  const barrel = `"use client";\n${[...names].map(name => `export { default as ${name} } from "./${name}.js";`).join("\n")}\n`;
  await writeFile(resolve(output, format, "index.js"), (await transform(barrel, { format, target: "es2020" })).code);
  const loaders = `const loaders = {\n${[...names].map(name => `${JSON.stringify(name)}: () => import("./${name}.js"),`).join("\n")}\n};\nexport async function loadIcon(name) {\n if (!Object.hasOwn(loaders, name)) throw new Error("Unknown Formaglyph Core component.");\n const module = await loaders[name]();\n return module[name] ?? module.default?.[name] ?? module.default;\n}\n`;
  await writeFile(resolve(output, format, "loaders.js"), (await transform(loaders, { format, target: "es2020" })).code);
  const typeExt = format === "esm" ? "ts" : "cts";
  const importExt = format === "esm" ? "js" : "cjs";
  await writeFile(resolve(output, `types.d.${typeExt}`), `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from "react";\n${props}\nexport type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;\n`);
  await writeFile(resolve(output, `index.d.${typeExt}`), `export type { IconProps, IconComponent } from "./types.${importExt}";\n${[...names].map(name => `export { default as ${name} } from "./${name}.${importExt}";`).join("\n")}\n`);
  await writeFile(resolve(output, `loaders.d.${typeExt}`), `import type { IconComponent } from "./types.${importExt}";\nexport type CoreComponentName = ${[...names].map(name => JSON.stringify(name)).join(" | ")};\nexport function loadIcon(name: CoreComponentName): Promise<IconComponent>;\n`);
}
const conditions = stem => ({ import: { types: `./${stem}.d.ts`, default: `./esm/${stem}.js` }, require: { types: `./${stem}.d.cts`, default: `./cjs/${stem}.js` } });
await writeFile(resolve(output, "package.json"), JSON.stringify({ name: pkg.name, version: pkg.version, description: pkg.description, license: "MIT", type: "module", sideEffects: false, main: "./cjs/index.js", module: "./esm/index.js", types: "./index.d.ts", peerDependencies: pkg.peerDependencies, exports: { ".": conditions("index"), "./loaders": conditions("loaders"), "./manifest.json": "./manifest.json", "./sources/*": "./sources/*", "./*": conditions("*") }, files: ["esm", "cjs", "sources", "*.d.ts", "*.d.cts", "manifest.json", "LICENSE", "README.md"] }, null, 2) + "\n");
await writeFile(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Built ${names.size} original React components for Core ${core.version}.`);
