// Build-time only: the pinned Hugeicons dump-truck has a redundant 24px canvas clip.
// Accept only that exact definition, not arbitrary clipping or paint references.
export function stripCanvasClip(body) {
  if (!body.includes("<clipPath")) return body;
  const clip = body.match(/<defs><clipPath id="([a-zA-Z][a-zA-Z0-9_-]*)"><path fill="#fff" d="M0 0h24v24H0z"\/><\/clipPath><\/defs>/);
  if (!clip) throw new Error("Unsupported upstream SVG clip.");
  const attribute = ` clip-path="url(#${clip[1]})"`;
  if (!body.includes(attribute)) throw new Error("Unresolved upstream SVG clip.");
  const expanded = body.replace(clip[0], "").replaceAll(attribute, "");
  if (/<clipPath\b|\bclip-path\s*=/.test(expanded)) throw new Error("Unresolved upstream SVG clip.");
  return expanded;
}
