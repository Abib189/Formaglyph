// Build-time only. Pinned upstream SVGs reuse a bounded set of local paths.
// Accept exactly that narrow shape, inline the geometry, then run the unchanged validator.
// This is not a general <use> resolver and never enables references in user SVGs.
export function inlineLocalPathUses(body) {
  if (!body.includes("<defs>")) return body;
  const match = body.match(/<defs>([\s\S]*?)<\/defs>/);
  if (!match) throw new Error("Unsupported upstream SVG definition.");
  const paths = new Map();
  const remaining = match[1].replace(/<path id="([a-zA-Z][a-zA-Z0-9_-]*)"((?: (?:fill|stroke)="(?:currentColor|none)")?) d="([^"]+)"\/>/g, (_tag, id, paint, d) => {
    if (paths.has(id)) throw new Error("Duplicate upstream SVG definition.");
    paths.set(id, { paint, d });
    return "";
  });
  if (remaining || !paths.size || paths.size > 8) throw new Error("Unsupported upstream SVG definition.");
  const expanded = body.replace(match[0], "").replace(/<use href="#([a-zA-Z][a-zA-Z0-9_-]*)"((?: (?:stroke-(?:linecap|linejoin|width)|fill-rule|clip-rule)="[^"]*")*)\/>/g, (tag, id, attributes) => {
    const path = paths.get(id);
    return path ? `<path${path.paint} d="${path.d}"${attributes}/>` : tag;
  });
  if (/<(?:defs|use)\b/.test(expanded)) throw new Error("Unresolved upstream SVG reference.");
  return expanded;
}
