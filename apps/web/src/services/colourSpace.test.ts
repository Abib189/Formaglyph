import { describe, expect, it } from "vitest";
import { clampUnit, hexToHsv, hsvToHex } from "./colourSpace";

describe("colour picker RGB/HSV controls", () => {
  it("round-trips exact export colours, including the Counterpair palette", () => {
    for (const hex of [
      "#000000",
      "#FFFFFF",
      "#A10232",
      "#2468AC",
      "#123ABC",
      "#00AAFF",
      "#010101",
      "#FFFF00",
    ])
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    for (let r = 0; r < 256; r += 17)
      for (let g = 0; g < 256; g += 17)
        for (let b = 0; b < 256; b += 17) {
          const hex = `#${[r, g, b]
            .map((c) => c.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase()}`;
          expect(hsvToHex(hexToHsv(hex))).toBe(hex);
        }
  });
  it("preserves the chosen hue when dragging through greys and black", () => {
    expect(hexToHsv("#000", 340)).toEqual({ h: 340, s: 0, v: 0 });
    expect(hexToHsv("#FFF", 200)).toEqual({ h: 200, s: 0, v: 1 });
  });
  it("clamps the pointer field and wraps the hue wheel without producing invalid SVG colours", () => {
    expect(clampUnit(-1)).toBe(0);
    expect(clampUnit(2)).toBe(1);
    expect(clampUnit(NaN)).toBe(0);
    expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe("#FF0000");
    expect(hsvToHex({ h: -120, s: 2, v: 2 })).toBe("#0000FF");
    expect(() => hexToHsv("url(unsafe)")).toThrow();
  });
});
