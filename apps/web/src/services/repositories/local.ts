import { iconResults, initialAppState } from "../../data/catalog";
import type { Proposal } from "../../domain/types";
import { loadAppState } from "../storage";
import { validateCandidateAsset } from "../candidateValidation";
import type { CandidateAssetInput, FormaglyphRepository, ProjectAccess, SavedDraft, WorkspaceData } from "./types";

const localProject: ProjectAccess = { id: "local-core", organizationId: "local-org", slug: "core", name: "Formaglyph Core", role: "admin" };

export class LocalRepository implements FormaglyphRepository {
  readonly mode = "local" as const;
  async listPublishedIcons() { return iconResults; }
  async loadWorkspace(projectSlug: string): Promise<WorkspaceData | null> {
    if (projectSlug !== localProject.slug) return null;
    const state = typeof window === "undefined" ? structuredClone(initialAppState) : loadAppState();
    return { project: localProject, icons: state.workspace, draft: state.draft, proposal: state.proposal };
  }
  async saveDraft(_projectSlug: string, draft: { workspaceIconId: string }, candidate: CandidateAssetInput): Promise<SavedDraft> {
    return { draftId: draft.workspaceIconId || "local-draft", candidateId: candidate.id, validation: validateCandidateAsset(candidate) };
  }
  async submitProposal(_draftId: string, _candidateId: string, _targetVersion: string): Promise<Proposal> {
    return (typeof window === "undefined" ? initialAppState : loadAppState()).proposal;
  }
  async reviewProposal(_proposalId: string, _decision: "approve" | "request_changes" | "reject"): Promise<Proposal> {
    return (typeof window === "undefined" ? initialAppState : loadAppState()).proposal;
  }
  async publishProposal() { return; }
  async bootstrapWorkspace() { return localProject; }
}
