import type { Icon } from "@phosphor-icons/react";

export type RouteName = "explore" | "create" | "review";
export type IconWeight = "regular" | "fill";
export type ProposalStatus = "draft" | "in_review" | "changes_requested" | "approved";

export interface CatalogIcon {
  id: string;
  stableId: string;
  name: string;
  label: string;
  category: string;
  description: string;
  Icon: Icon;
  tags: string[];
  aliases: string[];
  version: string;
  weight: IconWeight;
  directionality: "neutral" | "ltr-specific" | "rtl-specific" | "mirrored-safe";
  licence: "MIT";
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  Icon: Icon;
  issue: string | null;
}

export interface DraftBrief {
  name: string;
  description: string;
  keywords: string;
  selectedCandidateId: string;
  updatedAt: string;
}

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
}

export interface PersistedAppState {
  schemaVersion: 1;
  draft: DraftBrief;
  proposal: Proposal;
}
