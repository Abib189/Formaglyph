/** The URL and SVG serializer accept only opaque RGB hex, never arbitrary CSS. */
export function normalizeIconColour(value: string | null): string | null {
  const hex = value?.trim().replace(/^#/, "");
  if (!hex || !/^(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return null;
  return `#${(hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex).toUpperCase()}`;
}

/** This is an export derivative of an already verified SVG, not an asset mutation. */
export function colourIconSvg(svg: string, colour: string | null): string {
  if (colour === null) return svg;
  const safeColour = normalizeIconColour(colour);
  if (!safeColour) throw new Error("Use a three- or six-digit hex colour.");
  // Work on tags only: copyright comments and other source text stay byte-for-byte intact.
  const derivative = svg.replace(/<!--[\s\S]*?-->|<[^>]+>/g, (tag) => {
    if (tag.startsWith("<!--")) return tag;
    let result = tag.replace(
      /(\s(?:fill|stroke|color)\s*=\s*)(["'])currentColor\2/gi,
      `$1"${safeColour}"`,
    );
    if (/^<svg\b/i.test(result)) {
      // SVG's implicit fill is black, not currentColor. Cover that case without changing fill="none".
      if (!/\sfill\s*=/i.test(result))
        result = result.replace(/\s*(\/?>)$/, ` fill="${safeColour}"$1`);
      result = result.replace(/\scolor\s*=\s*(["'])[^"']*\1/gi, "");
      result = result.replace(/\s*(\/?>)$/, ` color="${safeColour}"$1`);
    }
    return result;
  });
  // Apache-2.0 requires modified files to carry a prominent change notice.
  return `<!-- Formaglyph modified this SVG: colour override ${safeColour}; source geometry unchanged. -->\n${derivative}`;
}

/** Pick the higher-contrast neutral proof surface; it is never embedded in exports. */
export function iconProofBackground(colour: string): "#FFFFFF" | "#000000" {
  const safeColour = normalizeIconColour(colour);
  if (!safeColour) return "#FFFFFF";
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(safeColour.slice(offset, offset + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#FFFFFF";
}
