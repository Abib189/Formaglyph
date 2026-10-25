import { normalizeIconColour } from "./iconColour";

export interface HsvColour {
  h: number;
  s: number;
  v: number;
}
export const clampUnit = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function hexToHsv(value: string, previousHue = 0): HsvColour {
  const hex = normalizeIconColour(value);
  if (!hex) throw new Error("Invalid RGB colour");
  const [r, g, b] = [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  let h = previousHue;
  if (delta) {
    h =
      max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? delta / max : 0, v: max };
}

export function hsvToHex({ h, s, v }: HsvColour): string {
  const hue = (((Number.isFinite(h) ? h : 0) % 360) + 360) % 360;
  const c = clampUnit(v) * clampUnit(s),
    x = c * (1 - Math.abs(((hue / 60) % 2) - 1)),
    m = clampUnit(v) - c;
  const rgb =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return `#${rgb
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}
