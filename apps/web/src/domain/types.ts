import type { Icon } from "@phosphor-icons/react";
import type { IconRecord, Proposal, ReviewComment } from "@formaglyph/schema";

export type { Proposal, ProposalStatus, ReviewComment } from "@formaglyph/schema";

export type RouteName = "explore" | "workspace" | "create" | "review" | "settings";
export type PreviewWeight = "regular" | "fill";
export type WorkspaceStatus = "draft" | "in_review" | "changes_requested" | "approved" | "rejected" | "published" | "deprecated" | "archived";
export type WorkspaceValidation = "passed" | "issues";
export type GenerationAdapter = "local" | "hosted";
export type GenerationProvider = "local_geometry" | "omnisvg" | "starvector" | "hosted";
export type GenerationJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type ApiScope = "read" | "read_write";
export type IntegrationName = "github" | "figma" | "penpot";

export interface CatalogIcon extends IconRecord {
  Icon?: Icon;
  previewWeight: PreviewWeight;
  assetUrl?: string;
  svg?: string;
  contentHash?: string;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  variants: {
    regular: string | null;
    solid: string | null;
  };
  issue: string | null;
  provenance: CandidateProvenance;
  createdAt: string;
}

export interface CandidateProvenance {
  kind: "generated" | "imported" | "reference";
  adapter: GenerationProvider | "manual_import";
  model: string;
  promptHash: string | null;
  generationJobId: string | null;
  disclosed: true;
}

export interface GenerationJob {
  id: string;
  adapter: GenerationProvider;
  status: GenerationJobStatus;
  progress: number;
  promptHash: string;
  promptRetained: boolean;
  candidateCount: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface DraftBrief {
  workspaceIconId: string;
  name: string;
  description: string;
  keywords: string;
  selectedCandidateId: string;
  updatedAt: string;
}

export interface WorkspaceIcon {
  id: string;
  stableId: string;
  name: string;
  label: string;
  description: string;
  category: string;
  tags: string[];
  project: string;
  status: WorkspaceStatus;
  variant: "regular" | "solid";
  visualKey: string;
  creator: string;
  updatedAt: string;
  validation: WorkspaceValidation;
  version: string;
  databaseIconId?: string | null;
}

export interface AuditEvent {
  id: string;
  action: string;
  actorId: string | null;
  targetType: string;
  targetId: string | null;
  source: string;
  occurredAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ReleaseEntry {
  id: string;
  iconId: string;
  iconName: string;
  version: string;
  variant: "regular" | "solid";
  status: "published" | "deprecated";
  contentHash: string;
  occurredAt: string;
  reason: string | null;
}

export interface ReviewDecision {
  id: string;
  decision: "approve" | "request_changes" | "reject";
  reviewerId: string;
  body: string;
  createdAt: string;
}

export interface ProposalRevision {
  id: string;
  sequence: number;
  candidate: Candidate;
  submittedAt: string;
  submittedBy: string | null;
}

export interface ReviewQueueItem {
  proposal: Proposal;
  databaseProposalId: string;
  draft: DraftBrief;
  authorId: string;
  updatedAt: string;
  revisions: ProposalRevision[];
  baselineCandidate: Candidate | null;
  decisions: ReviewDecision[];
}

export interface AppSettings {
  generationAdapter: GenerationAdapter;
  hostedGeneration: boolean;
  automaticValidation: boolean;
  retainPrompts: boolean;
  mcpEnabled: boolean;
  apiScope: ApiScope;
  projectProfile: string;
  defaultVariant: "regular" | "solid";
  integrations: Record<IntegrationName, boolean>;
  localBackups: boolean;
  anonymousDiagnostics: boolean;
  apiKeyCreatedAt: string | null;
}

export interface PersistedAppState {
  schemaVersion: 4;
  draft: DraftBrief;
  proposal: Proposal;
  workspace: WorkspaceIcon[];
  settings: AppSettings;
  candidates: Candidate[];
  generationJob: GenerationJob | null;
  auditEvents: AuditEvent[];
  releaseEntries: ReleaseEntry[];
}

export interface LegacyPersistedAppState {
  schemaVersion: 1 | 2 | 3;
  draft: DraftBrief;
  proposal: Proposal;
  workspace?: WorkspaceIcon[];
  settings?: AppSettings;
  candidates?: Candidate[];
  generationJob?: GenerationJob | null;
}
