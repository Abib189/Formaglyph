import type { WorkspaceIcon, WorkspaceStatus } from "../domain/types";

const allowedTransitions: Readonly<Record<WorkspaceStatus, readonly WorkspaceStatus[]>> = {
  draft: ["in_review", "archived"],
  in_review: ["changes_requested", "approved", "rejected", "archived"],
  changes_requested: ["in_review", "rejected", "archived"],
  approved: ["published", "archived"],
  rejected: ["archived"],
  published: ["deprecated"],
  deprecated: [],
  archived: ["draft"],
};

export function canTransitionWorkspaceIcon(from: WorkspaceStatus, to: WorkspaceStatus) {
  return from === to || allowedTransitions[from].includes(to);
}

export function transitionWorkspaceIcon(icon: WorkspaceIcon, to: WorkspaceStatus, now = new Date()): WorkspaceIcon {
  if (!canTransitionWorkspaceIcon(icon.status, to)) {
    throw new Error(`Icon cannot transition from ${icon.status} to ${to}.`);
  }
  return { ...icon, status: to, updatedAt: now.toISOString() };
}
