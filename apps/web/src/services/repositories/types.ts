import type { AuditEvent, Candidate, CandidateProvenance, CatalogIcon, DraftBrief, GenerationJob, GenerationProvider, Proposal, ReleaseEntry, ReviewComment, ReviewQueueItem, WorkspaceIcon } from "../../domain/types";
import type { SvgValidationResult } from "@formaglyph/validators";

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
  variants: {
    regular: string | null;
    solid: string | null;
  };
  issue: string | null;
  primaryVariant?: "regular" | "solid";
  provenance?: CandidateProvenance;
  generationJobId?: string | null;
  promptSha256?: string | null;
}

export interface SavedDraft {
  draftId: string;
  candidateId: string;
  validation: SvgValidationResult;
}

export interface WorkspaceData {
  project: ProjectAccess;
  icons: WorkspaceIcon[];
  draft?: DraftBrief;
  proposal?: Proposal;
  candidates?: Candidate[];
  reviewQueue?: ReviewQueueItem[];
  auditEvents: AuditEvent[];
  releaseEntries: ReleaseEntry[];
}

export interface ProjectTokenSummary {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface IssuedProjectToken extends ProjectTokenSummary {
  token: string;
}

export interface FormaglyphRepository {
  readonly mode: "local" | "supabase";
  listPublishedIcons(): Promise<CatalogIcon[]>;
  loadWorkspace(projectSlug: string, draftId?: string | null, proposalId?: string | null): Promise<WorkspaceData | null>;
  saveDraft(projectSlug: string, draft: DraftBrief, candidate: CandidateAssetInput): Promise<SavedDraft>;
  submitProposal(draftId: string, candidateId: string, targetVersion: string): Promise<Proposal>;
  reviewProposal(proposalId: string, decision: "approve" | "request_changes" | "reject", body?: string): Promise<Proposal>;
  publishProposal(proposalId: string): Promise<void>;
  commentProposal(proposalId: string, title: string, body: string): Promise<ReviewComment>;
  resolveReview(reviewId: string, resolved: boolean): Promise<ReviewComment>;
  deprecateIcon(iconId: string, reason: string): Promise<void>;
  startGenerationJob(projectSlug: string, input: { draftId?: string | null; adapter: GenerationProvider; prompt: string; promptHash: string; retainPrompt: boolean; candidateCount: number }): Promise<GenerationJob>;
  completeGenerationJob(jobId: string, result: { candidateCount: number; passedCount: number }): Promise<GenerationJob>;
  failGenerationJob(jobId: string, errorCode: string, errorMessage: string): Promise<GenerationJob>;
  cancelGenerationJob(jobId: string): Promise<GenerationJob>;
  listProjectTokens(projectSlug: string): Promise<ProjectTokenSummary[]>;
  issueProjectToken(projectSlug: string, name: string, expiresInDays?: number): Promise<IssuedProjectToken>;
  revokeProjectToken(tokenId: string): Promise<ProjectTokenSummary>;
  bootstrapWorkspace(input: { organizationName: string; organizationSlug: string; projectName: string; projectSlug: string }): Promise<ProjectAccess>;
}
