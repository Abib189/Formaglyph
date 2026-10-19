import { describe, expect, it } from "vitest";
import { inlineLocalPathUses } from "./inline-local-paths.mjs";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";

describe("pinned upstream local path expansion", () => {
  it("preserves repeated geometry and inherited paint without enabling references", () => {
    const body = '<defs><path id="LocalShape" d="M2 2h20"/></defs><g fill="none" stroke="currentColor"><use href="#LocalShape"/><use href="#LocalShape"/></g>';
    const expanded = inlineLocalPathUses(body);
    expect(expanded).toBe('<g fill="none" stroke="currentColor"><path d="M2 2h20"/><path d="M2 2h20"/></g>');
    expect(sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24" aria-hidden="true">${expanded}</svg>`).status).toBe("passed");
  });
  it("rejects unsupported definitions and unresolved/external references", () => {
    expect(() => inlineLocalPathUses('<defs><script id="x">alert(1)</script></defs>')).toThrow();
    expect(() => inlineLocalPathUses('<defs><path id="x" d="M2 2h20"/></defs><use href="https://example.com/#x"/>')).toThrow();
    expect(() => inlineLocalPathUses('<defs><path id="x" d="M2 2h20"/></defs><use href="#x" transform="scale(2)"/>')).toThrow();
    const raw = '<use href="https://example.com/shape.svg"/>';
    expect(sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24" aria-hidden="true">${inlineLocalPathUses(raw)}</svg>`).safe).toBe(false);
  });
});
