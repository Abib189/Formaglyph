import {
  sanitizeAndValidateSvg,
  SvgValidationError,
  type SvgValidationResult,
} from "@formaglyph/validators";

export interface CandidateSvgInput {
  id: string;
  name: string;
  description: string;
  svg: string;
  issue: string | null;
  variant?: "regular" | "solid";
}

export function validateCandidateAsset(candidate: CandidateSvgInput): SvgValidationResult {
  const result = sanitizeAndValidateSvg(candidate.svg);
  if (!result.safe || !result.normalizedSvg) throw new SvgValidationError(result);
  if (!candidate.issue) return result;
  return {
    ...result,
    status: "failed",
    issues: [{
      ruleId: "formaglyph.style.optical-balance",
      severity: "error",
      message: candidate.issue,
      remediation: "Revise the candidate geometry before submitting it for review.",
    }, ...result.issues],
  };
}
