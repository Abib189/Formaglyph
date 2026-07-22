import { describe, expect, it } from "vitest";
import { assertValidSvg, sanitizeAndValidateSvg, SvgValidationError } from "./svg";

const safeSvg = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" d="M4 12 L20 12"/></svg>`;

describe("sanitizeAndValidateSvg", () => {
  it("rebuilds safe SVG deterministically", () => {
    const first = sanitizeAndValidateSvg(safeSvg);
    const second = sanitizeAndValidateSvg(first.normalizedSvg ?? "");
    expect(first.status).toBe("passed");
    expect(first.safe).toBe(true);
    expect(first.normalizedSvg).toBe(second.normalizedSvg);
    expect(first.normalizedSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(first.measurements).toMatchObject({ elements: 2, paths: 1, maximumDepth: 2, viewBox: [0, 0, 24, 24] });
  });

  it.each([
    ["script", `<svg viewBox="0 0 24 24"><script>alert(1)</script></svg>`, "svg.security.disallowed-element"],
    ["event handler", `<svg viewBox="0 0 24 24" onload="alert(1)"><path d="M0 0"/></svg>`, "svg.security.disallowed-attribute"],
    ["external image", `<svg viewBox="0 0 24 24"><image href="https://example.com/a.png"/></svg>`, "svg.security.disallowed-element"],
    ["foreign object", `<svg viewBox="0 0 24 24"><foreignObject><div>unsafe</div></foreignObject></svg>`, "svg.security.disallowed-element"],
    ["style resource", `<svg viewBox="0 0 24 24"><path style="fill:url(https://example.com/a)" d="M0 0"/></svg>`, "svg.security.disallowed-attribute"],
    ["doctype", `<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg viewBox="0 0 24 24"/>`, "svg.security.doctype"],
    ["malformed XML", `<svg viewBox="0 0 24 24"><path></svg>`, "svg.structure.malformed-xml"],
  ])("rejects %s", (_name, source, ruleId) => {
    const result = sanitizeAndValidateSvg(source);
    expect(result.status).toBe("failed");
    expect(result.safe).toBe(false);
    expect(result.normalizedSvg).toBeNull();
    expect(result.issues.map((issue) => issue.ruleId)).toContain(ruleId);
  });

  it("rejects invalid viewBox and non-finite geometry", () => {
    const invalidViewBox = sanitizeAndValidateSvg(`<svg viewBox="0 0 0 24"><path d="M0 0"/></svg>`);
    const invalidGeometry = sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24"><circle cx="NaN" cy="12" r="4"/></svg>`);
    expect(invalidViewBox.issues[0]?.ruleId).toBe("svg.structure.invalid-viewbox");
    expect(invalidGeometry.issues.map((issue) => issue.ruleId)).toContain("svg.geometry.invalid-number");
    expect(invalidGeometry.safe).toBe(true);
    expect(invalidGeometry.status).toBe("failed");
  });

  it("removes unknown inert attributes and records the change", () => {
    const result = sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24" aria-hidden="true"><path data-note="draft" d="M0 0"/></svg>`);
    expect(result.status).toBe("passed");
    expect(result.normalizedSvg).not.toContain("data-note");
    expect(result.issues.map((issue) => issue.ruleId)).toContain("svg.attribute.removed");
    expect(result.changes).toContain("Removed unsupported attribute data-note.");
  });

  it("reports accessibility and style-profile warnings without blocking safe output", () => {
    const result = sanitizeAndValidateSvg(`<svg viewBox="0 0 256 256"><path fill="currentColor" d="M0 0"/></svg>`);
    expect(result.status).toBe("passed");
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(expect.arrayContaining([
      "svg.accessibility.name-missing",
      "svg.style.viewbox-mismatch",
    ]));
    expect(result.normalizedSvg).toContain('viewBox="0 0 256 256"');
  });

  it("enforces complexity limits", () => {
    const result = sanitizeAndValidateSvg(`<svg viewBox="0 0 24 24"><g><path d="M0 0"/></g></svg>`, { maxElements: 2 });
    expect(result.status).toBe("failed");
    expect(result.issues.map((issue) => issue.ruleId)).toContain("svg.complexity.element-limit");
  });

  it("throws a structured error for failed SVG", () => {
    expect(() => assertValidSvg(`<svg viewBox="0 0 24 24"><path fill="#ff0000" d="M0 0"/></svg>`)).toThrow(SvgValidationError);
  });
});
