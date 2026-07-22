import type { CatalogIcon, DraftBrief, Proposal, WorkspaceIcon } from "../../domain/types";

export type MembershipRole = "contributor" | "reviewer" | "admin";

export interface ProjectAccess {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  role: MembershipRole;
}

export interface CandidateAssetInput {
  id: string;
  name: string;
  description: string;
  svg: string;
  issue: string | null;
}

export interface SavedDraft {
  draftId: string;
  candidateId: string;
}

export interface WorkspaceData {
  project: ProjectAccess;
  icons: WorkspaceIcon[];
  draft?: DraftBrief;
  proposal?: Proposal;
}

export interface FormaglyphRepository {
  readonly mode: "local" | "supabase";
  listPublishedIcons(): Promise<CatalogIcon[]>;
  loadWorkspace(projectSlug: string): Promise<WorkspaceData | null>;
  saveDraft(projectSlug: string, draft: DraftBrief, candidate: CandidateAssetInput): Promise<SavedDraft>;
  submitProposal(draftId: string, candidateId: string, targetVersion: string): Promise<Proposal>;
  reviewProposal(proposalId: string, decision: "approve" | "request_changes" | "reject", body?: string): Promise<Proposal>;
  publishProposal(proposalId: string): Promise<void>;
  bootstrapWorkspace(input: { organizationName: string; organizationSlug: string; projectName: string; projectSlug: string }): Promise<ProjectAccess>;
}
