import type { Candidate, ReviewQueueItem } from "../domain/types";

const statusPriority: Record<ReviewQueueItem["proposal"]["status"], number> = {
  in_review: 0,
  changes_requested: 1,
  approved: 2,
  draft: 3,
  rejected: 4,
  published: 5,
};

export function sortReviewQueue(items: ReviewQueueItem[]) {
  return [...items].sort((left, right) => {
    const statusDifference = statusPriority[left.proposal.status] - statusPriority[right.proposal.status];
    if (statusDifference) return statusDifference;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function publishedBaselineForReview(input: {
  draftIconId: string | null;
  draftName: string;
  proposalPublicId: string;
  proposalStatus: ReviewQueueItem["proposal"]["status"];
  icons: ReadonlyArray<{ id: string; canonicalName: string; currentVersionId: string | null }>;
  currentVersions: ReadonlyArray<{ id: string; proposalPublicId: string | null }>;
  proposals: ReadonlyArray<{ publicId: string; candidateId: string }>;
  candidates: ReadonlyMap<string, Candidate | null>;
}): Candidate | null {
  if (input.proposalStatus === "published") return null;
  const icon = input.icons.find((item) => item.id === input.draftIconId)
    ?? input.icons.find((item) => item.canonicalName === input.draftName);
  if (!icon?.currentVersionId) return null;
  const release = input.currentVersions.find((item) => item.id === icon.currentVersionId);
  if (!release?.proposalPublicId || release.proposalPublicId === input.proposalPublicId) return null;
  const proposal = input.proposals.find((item) => item.publicId === release.proposalPublicId);
  return proposal ? input.candidates.get(proposal.candidateId) ?? null : null;
}

export function selectReviewComparison(item: ReviewQueueItem): {
  previous: Candidate | null;
  proposed: Candidate | null;
} {
  const proposed = item.revisions.at(-1)?.candidate ?? null;
  const previous = item.revisions.length > 1
    ? item.revisions.at(-2)?.candidate ?? null
    : item.baselineCandidate;
  return { previous, proposed };
}

export function reviewFeedbackForRevision(item: ReviewQueueItem, revisionIndex: number) {
  const revision = item.revisions[revisionIndex];
  if (!revision) return null;
  const nextRevision = item.revisions[revisionIndex + 1];
  return item.decisions.find((decision) => (
    decision.decision === "request_changes"
    && new Date(decision.createdAt) >= new Date(revision.submittedAt)
    && (!nextRevision || new Date(decision.createdAt) < new Date(nextRevision.submittedAt))
  )) ?? null;
}
