import { DOMParser } from "@xmldom/xmldom";
import { sanitizeAndValidateSvg, type SvgValidationOptions, type SvgValidationResult } from "./svg";

/** Only for hash-verified upstream catalogues, never candidate uploads.
 * Radix's six panel assets use local path-only masks. Keep those exact semantics
 * without enabling defs/use, arbitrary URLs, filters or mask support in user SVGs.
 */
export function sanitizeAndValidateCatalogSvg(source: string, options: SvgValidationOptions = {}): SvgValidationResult {
  // Two Iconoir originals contain fixed white artwork. Preserve it, not a fake
  // transparent cutout or a recoloured silhouette. Other fixed paints stay rejected.
  const whitePaints = new Map<number, Array<[string, string]>>();
  let elementIndex = 0;
  const monochrome = source.replace(/<(?:svg|g|path|rect|circle|ellipse|line|polyline|polygon)\b[^>]*>/g, tag => {
    const index = elementIndex++;
    return tag.replace(/ (fill|stroke)="(#fff|#FFFFFF)"/g, (_all, attribute: string, value: string) => {
      const paints = whitePaints.get(index) ?? [];
      paints.push([attribute, value]);
      whitePaints.set(index, paints);
      return ` ${attribute}="currentColor"`;
    });
  });
  if (whitePaints.size) {
    // No pinned source combines masks and fixed paint. Do not silently generalise.
    const result = sanitizeAndValidateSvg(monochrome, options);
    if (!result.safe || result.status !== "passed" || !result.normalizedSvg) return result;
    elementIndex = 0;
    return { ...result, normalizedSvg: result.normalizedSvg.replace(/<(?:svg|g|path|rect|circle|ellipse|line|polyline|polygon)\b[^>]*>/g, tag => {
      const paints = whitePaints.get(elementIndex++);
      for (const [attribute, value] of paints ?? []) tag = tag.replace(`${attribute}="currentColor"`, `${attribute}="${value}"`);
      return tag;
    }) };
  }
  if (!/<mask\b|\smask\s*=/i.test(source)) return sanitizeAndValidateSvg(source, options);
  const fail = (): SvgValidationResult => ({
    ...sanitizeAndValidateSvg(source, options), safe: false, status: "failed", normalizedSvg: null,
    issues: [{ ruleId: "svg.catalog.invalid-mask", severity: "blocker", message: "Only root-level path masks and resolved local references are allowed in upstream catalogues." }],
  });
  if (new TextEncoder().encode(source).length > (options.maxBytes ?? 1_048_576) || /<!DOCTYPE|<!ENTITY|<\?/i.test(source)) return fail();
  const definitions = new Map<string, string>();
  let invalid = false;
  let body = source.replace(/<mask id="([a-zA-Z][a-zA-Z0-9_-]{0,79})" fill="currentColor">(<path d="[^"]+"\/><\/mask>)/g, (_all, id: string, contents: string) => {
    if (definitions.has(id)) invalid = true;
    definitions.set(id, contents.slice(0, -"</mask>".length));
    return "";
  });
  if (invalid || !definitions.size || definitions.size > 8 || /<\/?mask\b/i.test(body)) return fail();
  try {
    const document = new DOMParser({ onError: () => { invalid = true; } }).parseFromString(source, "image/svg+xml");
    const masks = document.getElementsByTagName("mask");
    if (masks.length !== definitions.size) return fail();
    for (let i = 0; i < masks.length; i++) if (masks.item(i)?.parentNode !== document.documentElement) return fail();
  } catch { return fail(); }
  if (invalid) return fail();
  const references = new Map<number, string>();
  let index = 0;
  body = body.replace(/<path\b[^>]*>/g, tag => {
    const pathIndex = index++;
    const reference = tag.match(/ mask="url\(#([a-zA-Z][a-zA-Z0-9_-]{0,79})\)"/);
    if (!reference) return tag;
    if (!definitions.has(reference[1])) invalid = true;
    references.set(pathIndex, reference[1]);
    return tag.replace(reference[0], "");
  });
  if (invalid || !references.size || /\smask\s*=/i.test(body)) return fail();
  const result = sanitizeAndValidateSvg(body, options);
  if (!result.safe || result.status !== "passed" || !result.normalizedSvg) return result;
  const viewBox = (options.targetViewBox ?? [0, 0, 24, 24]).join(" ");
  let extraPaths = 0;
  const masks: string[] = [];
  for (const [id, geometry] of definitions) {
    if (![...references.values()].includes(id)) return fail();
    const checked = sanitizeAndValidateSvg(`<svg viewBox="${viewBox}" aria-hidden="true">${geometry}</svg>`, options);
    if (!checked.safe || checked.status !== "passed" || !checked.normalizedSvg) return fail();
    extraPaths += checked.measurements.paths;
    const path = checked.normalizedSvg.match(/<path\b[^>]*\/>/)?.[0];
    if (!path) return fail();
    masks.push(`<mask id="${id}" fill="currentColor">${path}</mask>`);
  }
  const elements = result.measurements.elements + definitions.size + extraPaths;
  if (elements > (options.maxElements ?? 512) || Math.max(result.measurements.maximumDepth, 3) > (options.maxDepth ?? 32)) return fail();
  index = 0;
  const normalizedSvg = result.normalizedSvg.replace(/<path\b[^>]*>/g, tag => {
    const id = references.get(index++);
    return id ? tag.replace(/\s*(\/?>)$/, ` mask="url(#${id})"$1`) : tag;
  }).replace(/(<svg\b[^>]*>)/, `$1${masks.join("")}`);
  return { ...result, normalizedSvg, measurements: { ...result.measurements, bytes: new TextEncoder().encode(source).length, elements, paths: result.measurements.paths + extraPaths, maximumDepth: Math.max(result.measurements.maximumDepth, 3) } };
}
