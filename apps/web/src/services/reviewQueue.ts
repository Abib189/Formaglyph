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
