import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Icon } from "@phosphor-icons/react";
import type { PreviewWeight } from "../domain/types";

export function renderIconSvg(IconComponent: Icon, weight: PreviewWeight = "regular") {
  return renderToStaticMarkup(createElement(IconComponent, {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 256 256",
    weight,
    color: "currentColor",
    "aria-hidden": "true",
  }));
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

export interface DesignHandoffMetadata {
  stableId: string;
  name: string;
  label: string;
  version: string;
  variant: "regular" | "solid";
  licence: string;
  contentHash?: string;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function prepareDesignSvg(svg: string, metadata: DesignHandoffMetadata, target: "figma" | "penpot") {
  const opening = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!opening) throw new Error("The selected asset is not valid SVG markup.");
  const cleanOpening = opening
    .replace(/\s(?:aria-hidden|role|id|width|height|data-formaglyph-[\w-]+)=("[^"]*"|'[^']*')/gi, "");
  const safeId = metadata.name.replace(/[^a-z0-9_-]+/gi, "-");
  const attributes = [
    `id="formaglyph-${escapeXml(safeId)}"`,
    'width="24"',
    'height="24"',
    'role="img"',
    `aria-label="${escapeXml(metadata.label)}"`,
    `data-formaglyph-id="${escapeXml(metadata.stableId)}"`,
    `data-formaglyph-version="${escapeXml(metadata.version)}"`,
    `data-formaglyph-variant="${escapeXml(metadata.variant)}"`,
    `data-formaglyph-licence="${escapeXml(metadata.licence)}"`,
    `data-formaglyph-target="${target}"`,
    metadata.contentHash ? `data-formaglyph-sha256="${escapeXml(metadata.contentHash)}"` : "",
  ].filter(Boolean).join(" ");
  const enrichedOpening = `${cleanOpening.slice(0, -1)} ${attributes}>`;
  const withoutTitle = svg.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "");
  return withoutTitle.replace(opening, `${enrichedOpening}<title>${escapeXml(metadata.label)}</title>`);
}

export async function copyDesignSvg(svg: string, metadata: DesignHandoffMetadata, target: "figma" | "penpot") {
  const enriched = prepareDesignSvg(svg, metadata, target);
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "image/svg+xml": new Blob([enriched], { type: "image/svg+xml" }),
        "text/plain": new Blob([enriched], { type: "text/plain" }),
      })]);
      return;
    } catch {
      // Some browsers expose ClipboardItem but reject SVG MIME data.
    }
  }
  await copyText(enriched);
}

export function downloadSvg(filename: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
