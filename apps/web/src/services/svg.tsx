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

export function downloadSvg(filename: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
