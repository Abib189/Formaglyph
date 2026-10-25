import { describe, expect, it } from "vitest";
import { stripCanvasClip } from "./strip-canvas-clip.mjs";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";

const definition = '<defs><clipPath id="Canvas"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs>';
describe("pinned upstream full-canvas clip removal", () => {
  it("only removes the exact canvas wrapper and preserves geometry and paint", () => {
    const geometry = '<path d="M2 12h20" stroke="currentColor"/>';
    const body = `<g fill="none"><g clip-path="url(#Canvas)">${geometry}</g>${definition}</g>`;
    const expanded = stripCanvasClip(body);
    expect(expanded).toBe(`<g fill="none"><g>${geometry}</g></g>`);
    expect(sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24">${expanded}</svg>`).status).toBe("passed");
    expect(sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24">${body}</svg>`).safe).toBe(false);
  });
  it("fails closed on other clip geometry, external or unresolved references", () => {
    expect(() => stripCanvasClip(`${definition}<g clip-path="url(https://example.com/#Canvas)"/>`)).toThrow();
    expect(() => stripCanvasClip(`<g clip-path="url(#Canvas)"/>${definition.replace("h24v24", "h12v12")}`)).toThrow();
    expect(() => stripCanvasClip(`<g clip-path="url(#Canvas)" clip-path="url(#Other)"/>${definition}`)).toThrow();
    expect(() => stripCanvasClip(definition.replace("<path", "<script"))).toThrow();
  });
});
