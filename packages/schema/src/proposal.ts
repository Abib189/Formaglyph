export const PROPOSAL_STATUSES = ["draft", "in_review", "changes_requested", "approved", "rejected", "published"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export interface ReviewComment {
  id: string;
  title: string;
  author: string;
  time: string;
  text: string;
  resolved: boolean;
}

export interface Proposal {
  id: string;
  draftId: string;
  status: ProposalStatus;
  candidateId: string;
  targetVersion: string;
  comments: ReviewComment[];
  submittedAt: string | null;
  decidedAt: string | null;
  publishedAt?: string | null;
}

const allowedTransitions: Readonly<Record<ProposalStatus, readonly ProposalStatus[]>> = {
  draft: ["in_review"],
  in_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["in_review", "rejected"],
  approved: ["published"],
  rejected: [],
  published: [],
};

export function canTransitionProposal(from: ProposalStatus, to: ProposalStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionProposal(proposal: Proposal, to: ProposalStatus, now = new Date()): Proposal {
  if (proposal.status === to) return proposal;
  if (!canTransitionProposal(proposal.status, to)) {
    throw new Error(`Proposal cannot transition from ${proposal.status} to ${to}.`);
  }
  return {
    ...proposal,
    status: to,
    submittedAt: to === "in_review" ? now.toISOString() : proposal.submittedAt,
    decidedAt: to === "approved" || to === "changes_requested" || to === "rejected" ? now.toISOString() : proposal.decidedAt,
    publishedAt: to === "published" ? now.toISOString() : proposal.publishedAt,
  };
}
