import { describe, expect, it } from "vitest";
import { resampleIcon } from "morphicons";
import { prepareMorphIcon, svgStrokeWidth } from "./morphicons";

const regular = (body: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><g>${body}</g></svg>`;

describe("prepareMorphIcon", () => {
  it("converts validated stroke SVGs into Morphicons input", () => {
    const result = prepareMorphIcon(regular('<path d="M4 12h16"/>'));
    expect(result.icon).not.toBeNull();
    expect(result.reason).toBeNull();
  });

  it("bakes Formaglyph translate and scale group transforms before conversion", () => {
    const result = prepareMorphIcon('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><g transform="translate(1.2 1.2) scale(.9)"><path d="M4 12h16"/></g></svg>');
    expect(result.icon).not.toBeNull();
    expect(result.reason).toBeNull();
    const points = resampleIcon(result.icon!)[0].pts;
    const xCoordinates = Array.from(points).filter((_, index) => index % 2 === 0);
    expect(Math.min(...xCoordinates)).toBeCloseTo(4.8);
    expect(Math.max(...xCoordinates)).toBeCloseTo(19.2);
  });

  it("rejects fill-drawn solid variants honestly", () => {
    const result = prepareMorphIcon('<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4z"/></svg>');
    expect(result.icon).toBeNull();
    expect(result.reason).toContain("fill-drawn");
  });

  it("rejects transforms Morphicons cannot represent safely", () => {
    const result = prepareMorphIcon('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><g transform="rotate(15)"><path d="M4 12h16"/></g></svg>');
    expect(result.icon).toBeNull();
    expect(result.reason).toContain("translate and scale");
  });
});

describe("svgStrokeWidth", () => {
  it("reads the submitted stroke width", () => {
    expect(svgStrokeWidth(regular('<path d="M4 12h16"/>'))).toBe(1.75);
  });
});
