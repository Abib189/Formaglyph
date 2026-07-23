import { iconResults, initialAppState } from "../../data/catalog";
import type { GenerationJob, Proposal } from "../../domain/types";
import { loadAppState } from "../storage";
import { validateCandidateAsset } from "../candidateValidation";
import type { CandidateAssetInput, FormaglyphRepository, ProjectAccess, SavedDraft, WorkspaceData } from "./types";

const localProject: ProjectAccess = { id: "local-core", organizationId: "local-org", slug: "core", name: "Formaglyph Core", role: "admin" };

export class LocalRepository implements FormaglyphRepository {
  readonly mode = "local" as const;
  private readonly generationJobs = new Map<string, GenerationJob>();
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
  async startGenerationJob(_projectSlug: string, input: { draftId?: string | null; adapter: GenerationJob["adapter"]; prompt: string; promptHash: string; retainPrompt: boolean; candidateCount: number }): Promise<GenerationJob> {
    const job: GenerationJob = { id: `local-job-${crypto.randomUUID()}`, adapter: input.adapter, status: "running", progress: 10, promptHash: input.promptHash, promptRetained: input.retainPrompt, candidateCount: input.candidateCount, error: null, startedAt: new Date().toISOString(), completedAt: null };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async completeGenerationJob(_jobId: string, result: { candidateCount: number; passedCount: number }): Promise<GenerationJob> {
    const current = this.generationJobs.get(_jobId);
    if (!current) throw new Error("Generation job was not found.");
    const job = { ...current, status: "completed" as const, progress: 100, candidateCount: result.candidateCount, completedAt: new Date().toISOString() };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async failGenerationJob(jobId: string, _errorCode: string, errorMessage: string): Promise<GenerationJob> {
    const current = this.generationJobs.get(jobId);
    if (!current) throw new Error("Generation job was not found.");
    const job = { ...current, status: "failed" as const, error: errorMessage, completedAt: new Date().toISOString() };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async cancelGenerationJob(jobId: string): Promise<GenerationJob> {
    const current = this.generationJobs.get(jobId);
    if (!current) throw new Error("Generation job was not found.");
    const job = { ...current, status: "cancelled" as const, completedAt: new Date().toISOString() };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async bootstrapWorkspace() { return localProject; }
}
