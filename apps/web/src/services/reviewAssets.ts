import type { Candidate } from "../domain/types";

export function selectReviewAssets(candidates: Candidate[], selectedCandidateId: string) {
  const proposed = candidates.find((candidate) => candidate.id === selectedCandidateId);
  const current = proposed
    ? candidates.find((candidate) => candidate.id !== proposed.id && candidate.provenance.kind === "reference")
    : undefined;
  return { current, proposed };
}
