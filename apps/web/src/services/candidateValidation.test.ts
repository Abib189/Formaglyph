import { describe, expect, it } from "vitest";
import { SvgValidationError } from "@formaglyph/validators";
import { validateCandidateAsset } from "./candidateValidation";

const candidate = {
  id: "candidate-1",
  name: "Candidate",
  description: "A candidate",
  svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M0 0"/></svg>`,
  issue: null,
};

describe("validateCandidateAsset", () => {
  it("returns normalized safe candidate output", () => {
    const result = validateCandidateAsset(candidate);
    expect(result.status).toBe("passed");
    expect(result.normalizedSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("preserves deterministic optical issues as validation errors", () => {
    const result = validateCandidateAsset({ ...candidate, issue: "Shoulders are unbalanced at 16px." });
    expect(result.status).toBe("failed");
    expect(result.safe).toBe(true);
    expect(result.issues[0]).toMatchObject({ ruleId: "formaglyph.style.optical-balance", severity: "error" });
  });

  it("never returns normalized active content", () => {
    expect(() => validateCandidateAsset({ ...candidate, svg: `<svg viewBox="0 0 24 24" onload="alert(1)"/>` })).toThrow(SvgValidationError);
  });
});
