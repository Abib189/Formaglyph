import type { Icon } from "@phosphor-icons/react";
import type { IconRecord, Proposal, ReviewComment } from "@formaglyph/schema";

export type { Proposal, ProposalStatus, ReviewComment } from "@formaglyph/schema";

export type RouteName = "explore" | "workspace" | "create" | "review" | "settings";
export type PreviewWeight = "regular" | "fill";
export type WorkspaceStatus = "draft" | "in_review" | "changes_requested" | "approved" | "published" | "archived";
export type WorkspaceValidation = "passed" | "issues";
export type GenerationAdapter = "local" | "hosted";
export type ApiScope = "read" | "read_write";
export type IntegrationName = "github" | "figma" | "penpot";

export interface CatalogIcon extends IconRecord {
  Icon: Icon;
  previewWeight: PreviewWeight;
  assetUrl?: string;
  contentHash?: string;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  Icon: Icon;
  issue: string | null;
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
  schemaVersion: 2;
  draft: DraftBrief;
  proposal: Proposal;
  workspace: WorkspaceIcon[];
  settings: AppSettings;
}

export interface LegacyPersistedAppState {
  schemaVersion: 1;
  draft: DraftBrief;
  proposal: Proposal;
}
