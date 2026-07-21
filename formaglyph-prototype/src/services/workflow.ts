import type { Proposal, ProposalStatus } from "../domain/types";

const allowedTransitions: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ["in_review"],
  in_review: ["changes_requested", "approved"],
  changes_requested: ["in_review"],
  approved: [],
};

export function canTransitionProposal(from: ProposalStatus, to: ProposalStatus) {
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
    decidedAt: to === "approved" || to === "changes_requested" ? now.toISOString() : proposal.decidedAt,
  };
}
