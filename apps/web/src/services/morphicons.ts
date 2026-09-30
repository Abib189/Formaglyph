import { svgToIcon } from "morphicons/adapters";
import type { IconInput } from "morphicons/react";

export interface PreparedMorphIcon {
  icon: IconInput | null;
  reason: string | null;
}

const numberPattern = "[-+]?(?:\\d*\\.)?\\d+(?:e[-+]?\\d+)?";
const transformPattern = new RegExp(`(translate|scale)\\s*\\(([^)]*)\\)`, "gi");

function parseNumbers(value: string) {
  const matches = value.match(new RegExp(numberPattern, "gi"));
  if (!matches) return null;
  const values = matches.map(Number);
  return values.every(Number.isFinite) ? values : null;
}

function bakeSupportedGroupTransform(svg: string) {
  const transformedTags = [...svg.matchAll(/<([a-z][\w:-]*)\b[^>]*\btransform\s*=\s*["']([^"']+)["'][^>]*>/gi)];
  if (!transformedTags.length) return svg;
  if (transformedTags.length !== 1 || transformedTags[0]?.[1]?.toLowerCase() !== "g") {
    throw new Error("Motion preview supports one shared group transform at a time.");
  }

  const groupCount = [...svg.matchAll(/<g\b/gi)].length;
  if (groupCount !== 1) throw new Error("Nested transformed groups are not supported in motion preview.");

  const transform = transformedTags[0]?.[2] ?? "";
  let scaleX = 1;
  let scaleY = 1;
  let translateX = 0;
  let translateY = 0;
  let consumed = "";

  transformPattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = transformPattern.exec(transform)) !== null) {
    consumed += match[0];
    const values = parseNumbers(match[2] ?? "");
    if (!values?.length || values.length > 2) throw new Error("The SVG transform cannot be represented safely.");
    if (match[1]?.toLowerCase() === "translate") {
      const x = values[0] ?? 0;
      const y = values[1] ?? 0;
      translateX += scaleX * x;
      translateY += scaleY * y;
    } else {
      const x = values[0] ?? 1;
      const y = values[1] ?? x;
      scaleX *= x;
      scaleY *= y;
    }
  }

  const unsupported = transform.replace(/\s|,/g, "") !== consumed.replace(/\s|,/g, "");
  if (unsupported || scaleX <= 0 || scaleY <= 0) throw new Error("Only positive translate and scale transforms can be previewed.");

  const viewBoxMatch = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  if (!viewBoxMatch) throw new Error("A four-value SVG viewBox is required for motion preview.");
  const viewBox = parseNumbers(viewBoxMatch[1]);
  if (!viewBox || viewBox.length !== 4) throw new Error("A four-value SVG viewBox is required for motion preview.");

  const [minX, minY, width, height] = viewBox;
  if (width <= 0 || height <= 0) throw new Error("The SVG viewBox must have positive dimensions.");
  const bakedViewBox = [
    (minX - translateX) / scaleX,
    (minY - translateY) / scaleY,
    width / scaleX,
    height / scaleY,
  ].map((value) => Number(value.toFixed(6))).join(" ");

  return svg
    .replace(viewBoxMatch[0], `viewBox="${bakedViewBox}"`)
    .replace(/(<g\b[^>]*?)\s+transform\s*=\s*["'][^"']+["']([^>]*>)/i, "$1$2");
}

export function prepareMorphIcon(svg: string | null): PreparedMorphIcon {
  if (!svg) return { icon: null, reason: "Regular variant unavailable." };
  try {
    return { icon: svgToIcon(bakeSupportedGroupTransform(svg)), reason: null };
  } catch (error) {
    return {
      icon: null,
      reason: error instanceof Error ? error.message.replace(/^morphicons:\s*/i, "") : "The SVG cannot be morphed.",
    };
  }
}

export function svgStrokeWidth(svg: string | null, fallback = 2) {
  if (!svg) return fallback;
  const match = svg.match(/\bstroke-width\s*=\s*["']([^"']+)["']/i);
  const value = Number(match?.[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
