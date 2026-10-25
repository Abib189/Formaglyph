import { describe, expect, it } from "vitest";
import { inlineLocalPathUses } from "./inline-local-paths.mjs";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";

describe("pinned upstream local path expansion", () => {
  it("resolves a bounded set of independent paths without losing fill rules", () => {
    const body = '<defs><path id="One" d="M1 1h2"/><path id="Two" d="M3 3h2"/></defs><g fill="currentColor"><use href="#One"/><use href="#Two" fill-rule="evenodd" clip-rule="evenodd"/></g>';
    expect(inlineLocalPathUses(body)).toBe('<g fill="currentColor"><path d="M1 1h2"/><path d="M3 3h2" fill-rule="evenodd" clip-rule="evenodd"/></g>');
    expect(() => inlineLocalPathUses(body.replace('id="Two"', 'id="One"'))).toThrow();
    expect(() => inlineLocalPathUses(body.replace('href="#Two"', 'href="#Missing"'))).toThrow();
  });
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
  it("retains source path paint and use-site stroke attributes", () => {
    const raw = '<defs><path id="Local" stroke="currentColor" d="M1 1h20"/></defs><use href="#Local" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>';
    const expanded = inlineLocalPathUses(raw);
    expect(expanded).toBe('<path stroke="currentColor" d="M1 1h20" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>');
    expect(sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24" aria-hidden="true">${expanded}</svg>`).status).toBe("passed");
    expect(() => inlineLocalPathUses(raw.replace('stroke-linecap="round"', 'onclick="alert(1)"'))).toThrow();
  });
});
