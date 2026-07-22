import { DOMParser } from "@xmldom/xmldom";
import type { Document as XmlDocument, Element as XmlElement } from "@xmldom/xmldom";

export const SVG_VALIDATOR_VERSION = "formaglyph-svg/0.1.0";

export type ValidationSeverity = "blocker" | "error" | "warning" | "info";
export type ValidationStatus = "passed" | "failed";

export interface SvgValidationIssue {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  location?: string;
  remediation?: string;
}

export interface SvgValidationOptions {
  maxBytes?: number;
  maxElements?: number;
  maxDepth?: number;
  maxPathDataLength?: number;
  targetViewBox?: readonly [number, number, number, number];
  requireAccessibleName?: boolean;
}

export interface SvgMeasurements {
  bytes: number;
  elements: number;
  paths: number;
  maximumDepth: number;
  viewBox: readonly [number, number, number, number] | null;
}

export interface SvgValidationResult {
  validatorVersion: typeof SVG_VALIDATOR_VERSION;
  status: ValidationStatus;
  safe: boolean;
  normalizedSvg: string | null;
  issues: SvgValidationIssue[];
  changes: string[];
  measurements: SvgMeasurements;
}

export class SvgValidationError extends Error {
  readonly result: SvgValidationResult;

  constructor(result: SvgValidationResult) {
    super(result.issues[0]?.message ?? "SVG validation failed.");
    this.name = "SvgValidationError";
    this.result = result;
  }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DEFAULT_OPTIONS: Required<SvgValidationOptions> = {
  maxBytes: 1_048_576,
  maxElements: 512,
  maxDepth: 32,
  maxPathDataLength: 200_000,
  targetViewBox: [0, 0, 24, 24],
  requireAccessibleName: true,
};

const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "title", "desc",
]);

const GLOBAL_ATTRIBUTES = new Set([
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-opacity", "stroke-width", "stroke-linecap",
  "stroke-linejoin", "stroke-miterlimit", "opacity", "clip-rule", "color", "vector-effect", "transform",
]);

const ELEMENT_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  svg: new Set(["viewBox", "width", "height", "role", "aria-hidden", "aria-label", "focusable"]),
  g: new Set(),
  path: new Set(["d", "pathLength"]),
  rect: new Set(["x", "y", "width", "height", "rx", "ry", "pathLength"]),
  circle: new Set(["cx", "cy", "r", "pathLength"]),
  ellipse: new Set(["cx", "cy", "rx", "ry", "pathLength"]),
  line: new Set(["x1", "y1", "x2", "y2", "pathLength"]),
  polyline: new Set(["points", "pathLength"]),
  polygon: new Set(["points", "pathLength"]),
  title: new Set(),
  desc: new Set(),
};

const DANGEROUS_ATTRIBUTES = new Set(["style", "href", "xlink:href", "src", "class", "id"]);
const NUMERIC_ATTRIBUTES = new Set([
  "x", "y", "width", "height", "rx", "ry", "cx", "cy", "r", "x1", "y1", "x2", "y2", "stroke-width",
  "stroke-miterlimit", "fill-opacity", "stroke-opacity", "opacity", "pathLength",
]);
const PATH_DATA = /^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\s-]+$/;
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const POINTS = /^[+\-0-9eE.,\s]+$/;
const TRANSFORM = /^(?:(?:matrix|translate|scale|rotate|skewX|skewY)\(\s*[+\-0-9eE.,\s]+\)\s*)+$/;
const ACTIVE_VALUE = /(?:\b(?:javascript|vbscript|data):|url\s*\(|(?:^|["'\s])\/\/)/i;

const severityOrder: Record<ValidationSeverity, number> = { blocker: 0, error: 1, warning: 2, info: 3 };

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function parseNumbers(value: string): number[] | null {
  const parts = value.trim().split(/[\s,]+/).filter(Boolean);
  if (!parts.length || parts.some((part) => !NUMBER.test(part))) return null;
  const values = parts.map(Number);
  return values.every(Number.isFinite) ? values : null;
}

function numbersMatch(left: readonly number[], right: readonly number[]) {
  return left.length === right.length && left.every((value, index) => Math.abs(value - right[index]) < 1e-9);
}

function canonicalNumber(value: number) {
  return Object.is(value, -0) ? "0" : String(value);
}

function canonicalNumberList(value: string) {
  const values = parseNumbers(value);
  return values ? values.map(canonicalNumber).join(" ") : null;
}

function isAllowedPaint(value: string) {
  return value === "none" || value === "currentColor";
}

function isValidEnum(name: string, value: string) {
  if (name === "stroke-linecap") return ["butt", "round", "square"].includes(value);
  if (name === "stroke-linejoin") return ["miter", "round", "bevel", "arcs"].includes(value);
  if (name === "fill-rule" || name === "clip-rule") return ["nonzero", "evenodd"].includes(value);
  if (name === "vector-effect") return ["none", "non-scaling-stroke"].includes(value);
  if (name === "role") return ["img", "presentation"].includes(value);
  if (name === "aria-hidden" || name === "focusable") return ["true", "false"].includes(value);
  return true;
}

function locationFor(parent: string, name: string, index: number) {
  return `${parent}/${name}[${index}]`;
}

interface BuildContext {
  options: Required<SvgValidationOptions>;
  issues: SvgValidationIssue[];
  changes: Set<string>;
  elements: number;
  paths: number;
  maximumDepth: number;
  viewBox: readonly [number, number, number, number] | null;
  hasAccessibleName: boolean;
  hiddenFromAccessibility: boolean;
}

function addIssue(context: BuildContext, issue: SvgValidationIssue) {
  context.issues.push(issue);
}

function validateAttribute(name: string, value: string, location: string, context: BuildContext): string | null {
  if (ACTIVE_VALUE.test(value)) {
    addIssue(context, {
      ruleId: "svg.security.active-value",
      severity: "blocker",
      location,
      message: `Attribute ${name} contains an active or external resource value.`,
      remediation: "Replace external or executable references with local path geometry.",
    });
    return null;
  }

  if (name === "fill" || name === "stroke" || name === "color") {
    if (!isAllowedPaint(value)) {
      addIssue(context, {
        ruleId: "svg.style.unsupported-paint",
        severity: "error",
        location,
        message: `${name} must use currentColor or none.`,
        remediation: "Replace fixed colours with currentColor.",
      });
      return null;
    }
    return value;
  }

  if (NUMERIC_ATTRIBUTES.has(name)) {
    if (!NUMBER.test(value) || !Number.isFinite(Number(value))) {
      addIssue(context, { ruleId: "svg.geometry.invalid-number", severity: "error", location, message: `${name} must be a finite number.` });
      return null;
    }
    const number = Number(value);
    if (["width", "height", "r", "rx", "ry", "stroke-width", "pathLength"].includes(name) && number < 0) {
      addIssue(context, { ruleId: "svg.geometry.negative-size", severity: "error", location, message: `${name} cannot be negative.` });
      return null;
    }
    if (["fill-opacity", "stroke-opacity", "opacity"].includes(name) && (number < 0 || number > 1)) {
      addIssue(context, { ruleId: "svg.style.invalid-opacity", severity: "error", location, message: `${name} must be between 0 and 1.` });
      return null;
    }
    return canonicalNumber(number);
  }

  if (name === "points") {
    const values = POINTS.test(value) ? parseNumbers(value) : null;
    if (!values || values.length < 4 || values.length % 2 !== 0) {
      addIssue(context, { ruleId: "svg.geometry.invalid-points", severity: "error", location, message: "Point data must contain finite coordinate pairs." });
      return null;
    }
    return values.map(canonicalNumber).join(" ");
  }

  if (name === "d") {
    if (!value.trim() || value.length > context.options.maxPathDataLength || !PATH_DATA.test(value) || !/[Mm]/.test(value)) {
      addIssue(context, { ruleId: "svg.geometry.invalid-path", severity: "error", location, message: "Path data is empty, oversized, or contains unsupported syntax." });
      return null;
    }
    return value.trim().replace(/\s+/g, " ");
  }

  if (name === "transform") {
    if (!TRANSFORM.test(value)) {
      addIssue(context, { ruleId: "svg.geometry.invalid-transform", severity: "error", location, message: "Transform syntax is not supported." });
      return null;
    }
    return value.trim().replace(/\s+/g, " ");
  }

  if (!isValidEnum(name, value)) {
    addIssue(context, { ruleId: "svg.attribute.invalid-value", severity: "error", location, message: `${name} has an unsupported value.` });
    return null;
  }

  return value.trim();
}

function buildElement(element: XmlElement, location: string, depth: number, context: BuildContext): string | null {
  const name = (element.localName || element.tagName).toLowerCase();
  context.elements += 1;
  context.maximumDepth = Math.max(context.maximumDepth, depth);
  if (name === "path") context.paths += 1;

  if (context.elements > context.options.maxElements) {
    addIssue(context, { ruleId: "svg.complexity.element-limit", severity: "blocker", location, message: `SVG exceeds the ${context.options.maxElements}-element limit.` });
    return null;
  }
  if (depth > context.options.maxDepth) {
    addIssue(context, { ruleId: "svg.complexity.depth-limit", severity: "blocker", location, message: `SVG exceeds the ${context.options.maxDepth}-level depth limit.` });
    return null;
  }
  if (!ALLOWED_ELEMENTS.has(name)) {
    addIssue(context, {
      ruleId: "svg.security.disallowed-element",
      severity: "blocker",
      location,
      message: `<${name}> is not allowed in Formaglyph SVG.`,
      remediation: "Convert the artwork to basic SVG geometry.",
    });
    return null;
  }
  if (element.namespaceURI && element.namespaceURI !== SVG_NAMESPACE) {
    addIssue(context, { ruleId: "svg.security.foreign-namespace", severity: "blocker", location, message: `Foreign namespace ${element.namespaceURI} is not allowed.` });
    return null;
  }

  const attributes = new Map<string, string>();
  for (let index = 0; index < element.attributes.length; index += 1) {
    const attribute = element.attributes.item(index);
    if (!attribute) continue;
    const attributeName = attribute.name;
    const lowerName = attributeName.toLowerCase();
    const attributeLocation = `${location}/@${attributeName}`;
    if (lowerName === "xmlns" && name === "svg") continue;
    if (lowerName.startsWith("on") || DANGEROUS_ATTRIBUTES.has(lowerName) || lowerName.startsWith("xmlns:")) {
      addIssue(context, {
        ruleId: "svg.security.disallowed-attribute",
        severity: "blocker",
        location: attributeLocation,
        message: `Attribute ${attributeName} is not allowed.`,
        remediation: "Remove event handlers, styles, IDs, classes, and resource references.",
      });
      continue;
    }
    const canonicalName = attributeName === "viewbox" ? "viewBox" : attributeName === "pathlength" ? "pathLength" : attributeName;
    if (!GLOBAL_ATTRIBUTES.has(canonicalName) && !ELEMENT_ATTRIBUTES[name]?.has(canonicalName)) {
      addIssue(context, { ruleId: "svg.attribute.removed", severity: "warning", location: attributeLocation, message: `Unsupported attribute ${attributeName} was removed.` });
      context.changes.add(`Removed unsupported attribute ${attributeName}.`);
      continue;
    }
    if (canonicalName === "viewBox") continue;
    const normalizedValue = validateAttribute(canonicalName, attribute.value, attributeLocation, context);
    if (normalizedValue !== null) attributes.set(canonicalName, normalizedValue);
  }

  if (name === "svg") {
    const rawViewBox = element.getAttribute("viewBox") ?? element.getAttribute("viewbox");
    const values = rawViewBox ? parseNumbers(rawViewBox) : null;
    if (!values || values.length !== 4 || values[2] <= 0 || values[3] <= 0) {
      addIssue(context, {
        ruleId: "svg.structure.invalid-viewbox",
        severity: "blocker",
        location: `${location}/@viewBox`,
        message: "SVG requires a four-number viewBox with positive width and height.",
      });
    } else {
      context.viewBox = values as [number, number, number, number];
      attributes.set("viewBox", values.map(canonicalNumber).join(" "));
      if (!numbersMatch(values, context.options.targetViewBox)) {
        addIssue(context, {
          ruleId: "svg.style.viewbox-mismatch",
          severity: "warning",
          location: `${location}/@viewBox`,
          message: `ViewBox ${values.join(" ")} differs from the ${context.options.targetViewBox.join(" ")} style target.`,
          remediation: "Normalize geometry to the project style profile before publication.",
        });
      }
    }
    if (attributes.get("aria-hidden") === "true" || attributes.get("role") === "presentation") context.hiddenFromAccessibility = true;
    if (attributes.get("aria-label")) context.hasAccessibleName = true;
  }

  const children: string[] = [];
  const elementCounts = new Map<string, number>();
  for (let index = 0; index < element.childNodes.length; index += 1) {
    const child = element.childNodes.item(index);
    if (!child) continue;
    if (child.nodeType === 1) {
      const childElement = child as XmlElement;
      const childName = (childElement.localName || childElement.tagName).toLowerCase();
      const count = (elementCounts.get(childName) ?? 0) + 1;
      elementCounts.set(childName, count);
      const built = buildElement(childElement, locationFor(location, childName, count), depth + 1, context);
      if (built) children.push(built);
      if (childName === "title" && childElement.textContent?.trim()) context.hasAccessibleName = true;
      continue;
    }
    if (child.nodeType === 3 || child.nodeType === 4) {
      const value = child.nodeValue?.trim() ?? "";
      if (!value) continue;
      if (name === "title" || name === "desc") children.push(escapeText(value));
      else {
        addIssue(context, { ruleId: "svg.content.text-removed", severity: "warning", location, message: "Text outside title or desc was removed." });
        context.changes.add("Removed unsupported text content.");
      }
      continue;
    }
    if (child.nodeType !== 8) {
      addIssue(context, { ruleId: "svg.security.disallowed-node", severity: "blocker", location, message: "Processing instructions and non-SVG nodes are not allowed." });
    } else context.changes.add("Removed SVG comments.");
  }

  if (name === "svg") attributes.set("xmlns", SVG_NAMESPACE);
  const serializedAttributes = [...attributes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([attributeName, value]) => ` ${attributeName}="${escapeAttribute(value)}"`)
    .join("");
  return children.length ? `<${name}${serializedAttributes}>${children.join("")}</${name}>` : `<${name}${serializedAttributes}/>`;
}

function emptyResult(source: string, issue: SvgValidationIssue): SvgValidationResult {
  return {
    validatorVersion: SVG_VALIDATOR_VERSION,
    status: "failed",
    safe: false,
    normalizedSvg: null,
    issues: [issue],
    changes: [],
    measurements: { bytes: new TextEncoder().encode(source).byteLength, elements: 0, paths: 0, maximumDepth: 0, viewBox: null },
  };
}

export function sanitizeAndValidateSvg(source: string, options: SvgValidationOptions = {}): SvgValidationResult {
  const resolvedOptions: Required<SvgValidationOptions> = { ...DEFAULT_OPTIONS, ...options };
  const bytes = new TextEncoder().encode(source).byteLength;
  if (!source.trim()) return emptyResult(source, { ruleId: "svg.structure.empty", severity: "blocker", message: "SVG source is empty." });
  if (bytes > resolvedOptions.maxBytes) return emptyResult(source, { ruleId: "svg.complexity.byte-limit", severity: "blocker", message: `SVG exceeds the ${resolvedOptions.maxBytes}-byte limit.` });
  if (source.includes("\0")) return emptyResult(source, { ruleId: "svg.security.null-byte", severity: "blocker", message: "SVG contains a null byte." });
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) return emptyResult(source, { ruleId: "svg.security.doctype", severity: "blocker", message: "DOCTYPE and entity declarations are not allowed." });

  let document: XmlDocument;
  try {
    document = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, "image/svg+xml");
  } catch {
    return emptyResult(source, { ruleId: "svg.structure.malformed-xml", severity: "blocker", message: "SVG is not well-formed XML." });
  }

  const root = document.documentElement;
  if (!root || (root.localName || root.tagName).toLowerCase() !== "svg") {
    return emptyResult(source, { ruleId: "svg.structure.root", severity: "blocker", message: "The document root must be an SVG element." });
  }

  const context: BuildContext = {
    options: resolvedOptions,
    issues: [],
    changes: new Set(),
    elements: 0,
    paths: 0,
    maximumDepth: 0,
    viewBox: null,
    hasAccessibleName: false,
    hiddenFromAccessibility: false,
  };
  const normalizedSvg = buildElement(root, "/svg", 1, context);
  if (resolvedOptions.requireAccessibleName && !context.hiddenFromAccessibility && !context.hasAccessibleName) {
    addIssue(context, {
      ruleId: "svg.accessibility.name-missing",
      severity: "warning",
      location: "/svg",
      message: "Meaningful SVG requires a title or aria-label, unless it is explicitly decorative.",
    });
  }

  const issues = context.issues.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity] || left.ruleId.localeCompare(right.ruleId));
  const hasBlocker = issues.some((issue) => issue.severity === "blocker");
  const hasFailure = issues.some((issue) => issue.severity === "blocker" || issue.severity === "error");
  return {
    validatorVersion: SVG_VALIDATOR_VERSION,
    status: hasFailure ? "failed" : "passed",
    safe: !hasBlocker,
    normalizedSvg: hasBlocker ? null : normalizedSvg,
    issues,
    changes: [...context.changes].sort(),
    measurements: { bytes, elements: context.elements, paths: context.paths, maximumDepth: context.maximumDepth, viewBox: context.viewBox },
  };
}

export function assertValidSvg(source: string, options: SvgValidationOptions = {}) {
  const result = sanitizeAndValidateSvg(source, options);
  if (result.status === "failed" || !result.normalizedSvg) throw new SvgValidationError(result);
  return result;
}
