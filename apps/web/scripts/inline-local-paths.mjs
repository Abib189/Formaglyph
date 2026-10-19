// Build-time only. Three pinned Tabler SVGs reuse a single local path definition.
// Accept exactly that narrow shape, inline the geometry, then run the unchanged validator.
// This is not a general <use> resolver and never enables references in user SVGs.
export function inlineLocalPathUses(body) {
  if (!body.includes("<defs>")) return body;
  const match = body.match(/<defs><path id="([a-zA-Z][a-zA-Z0-9_-]*)" d="([^"]+)"\/><\/defs>/);
  if (!match) throw new Error("Unsupported upstream SVG definition.");
  const expanded = body.replace(match[0], "").replaceAll(`<use href="#${match[1]}"/>`, `<path d="${match[2]}"/>`);
  if (/<(?:defs|use)\b/.test(expanded)) throw new Error("Unresolved upstream SVG reference.");
  return expanded;
}
