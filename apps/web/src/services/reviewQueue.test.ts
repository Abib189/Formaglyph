import { describe, expect, it } from "vitest";
import type { Candidate, ReviewQueueItem } from "../domain/types";
import { publishedBaselineForReview, reviewFeedbackForRevision, selectReviewComparison, sortReviewQueue } from "./reviewQueue";

function candidate(id: string): Candidate {
  return {
    id,
    name: id,
    description: "",
    variants: { regular: `<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>`, solid: null },
    issue: null,
    provenance: { kind: "generated", adapter: "local_geometry", model: "test", promptHash: null, generationJobId: null, disclosed: true },
    createdAt: "2026-07-24T00:00:00.000Z",
  };
}

function queueItem(overrides: Partial<ReviewQueueItem> = {}): ReviewQueueItem {
  return {
    proposal: {
      id: "PRP-1",
      draftId: "draft-1",
      candidateId: "new",
      status: "in_review",
      targetVersion: "1.1.0",
      comments: [],
      submittedAt: "2026-07-24T01:00:00.000Z",
      decidedAt: null,
    },
    databaseProposalId: "proposal-1",
    draft: {
      workspaceIconId: "draft-1",
      name: "cloud-upload",
      description: "",
      keywords: "",
      selectedCandidateId: "new",
      updatedAt: "2026-07-24T01:00:00.000Z",
    },
    authorId: "author-1",
    updatedAt: "2026-07-24T01:00:00.000Z",
    revisions: [
      { id: "revision-1", sequence: 1, candidate: candidate("old"), submittedAt: "2026-07-24T00:00:00.000Z", submittedBy: "author-1" },
      { id: "revision-2", sequence: 2, candidate: candidate("new"), submittedAt: "2026-07-24T01:00:00.000Z", submittedBy: "author-1" },
    ],
    baselineCandidate: candidate("published"),
    decisions: [
      { id: "decision-1", decision: "request_changes", reviewerId: "reviewer-1", body: "Align the arrow to the keyline.", createdAt: "2026-07-24T00:30:00.000Z" },
    ],
    ...overrides,
  };
}

describe("review queue", () => {
  it("compares the two latest immutable revisions", () => {
    expect(selectReviewComparison(queueItem())).toMatchObject({
      previous: { id: "old" },
      proposed: { id: "new" },
    });
  });

  it("uses the published candidate as the first submission baseline", () => {
    const item = queueItem();
    item.revisions = item.revisions.slice(1);
    expect(selectReviewComparison(item)).toMatchObject({
      previous: { id: "published" },
      proposed: { id: "new" },
    });
  });

  it("finds the current release for a separately created same-name draft", () => {
    const baseline = publishedBaselineForReview({
      draftIconId: null,
      draftName: "cloud-upload",
      proposalPublicId: "PRP-NEW",
      proposalStatus: "approved",
      icons: [{ id: "icon-1", canonicalName: "cloud-upload", currentVersionId: "version-1" }],
      currentVersions: [{ id: "version-1", proposalPublicId: "PRP-OLD" }],
      proposals: [{ publicId: "PRP-OLD", candidateId: "published-candidate" }],
      candidates: new Map([["published-candidate", candidate("published-candidate")]]),
    });
    expect(baseline?.id).toBe("published-candidate");
  });

  it("does not compare a published proposal against its own current release", () => {
    const baseline = publishedBaselineForReview({
      draftIconId: "icon-1",
      draftName: "cloud-upload",
      proposalPublicId: "PRP-OLD",
      proposalStatus: "published",
      icons: [{ id: "icon-1", canonicalName: "cloud-upload", currentVersionId: "version-1" }],
      currentVersions: [{ id: "version-1", proposalPublicId: "PRP-OLD" }],
      proposals: [{ publicId: "PRP-OLD", candidateId: "published-candidate" }],
      candidates: new Map([["published-candidate", candidate("published-candidate")]]),
    });
    expect(baseline).toBeNull();
  });

  it("attaches request-changes feedback to the revision it followed", () => {
    expect(reviewFeedbackForRevision(queueItem(), 0)?.body).toBe("Align the arrow to the keyline.");
    expect(reviewFeedbackForRevision(queueItem(), 1)).toBeNull();
  });

  it("places proposals awaiting review before completed proposals", () => {
    const published = queueItem({
      proposal: { ...queueItem().proposal, id: "PRP-2", status: "published" },
      updatedAt: "2026-07-25T00:00:00.000Z",
    });
    expect(sortReviewQueue([published, queueItem()]).map((item) => item.proposal.id)).toEqual(["PRP-1", "PRP-2"]);
  });
});
