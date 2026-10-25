import type { DraftBrief, Proposal } from "../domain/types";

export function emptyCreateSession(now = new Date().toISOString()): { draft: DraftBrief; proposal: Proposal } {
  return {
    draft: {
      workspaceIconId: "",
      name: "",
      description: "",
      keywords: "",
      selectedCandidateId: "",
      updatedAt: now,
    },
    proposal: {
      id: "",
      draftId: "",
      status: "draft",
      candidateId: "",
      targetVersion: "1.0.0",
      comments: [],
      submittedAt: null,
      decidedAt: null,
      publishedAt: null,
    },
  };
}
