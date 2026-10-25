// Build-time only. Pinned upstream SVGs reuse a single local path definition.
// Accept exactly that narrow shape, inline the geometry, then run the unchanged validator.
// This is not a general <use> resolver and never enables references in user SVGs.
export function inlineLocalPathUses(body) {
  if (!body.includes("<defs>")) return body;
  const match = body.match(/<defs><path id="([a-zA-Z][a-zA-Z0-9_-]*)"((?: (?:fill|stroke)="(?:currentColor|none)")?) d="([^"]+)"\/><\/defs>/);
  if (!match) throw new Error("Unsupported upstream SVG definition.");
  const uses = new RegExp(`<use href="#${match[1]}"((?: stroke-(?:linecap|linejoin|width)="[^"]*")*)/>`, "g");
  const expanded = body.replace(match[0], "").replace(uses, (_tag, attributes) => `<path${match[2]} d="${match[3]}"${attributes}/>`);
  if (/<(?:defs|use)\b/.test(expanded)) throw new Error("Unresolved upstream SVG reference.");
  return expanded;
}
