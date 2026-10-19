import { iconResults, initialAppState } from "../../data/catalog";
import type {
  CatalogIcon,
  GenerationJob,
  Proposal,
  ReviewComment,
  ReviewQueueItem,
} from "../../domain/types";
import { loadAppState } from "../storage";
import { readLocalWorkspace } from "../localWorkspace";
import { sortReviewQueue } from "../reviewQueue";
import { validateCandidateAsset } from "../candidateValidation";
import type {
  CandidateAssetInput,
  FormaglyphRepository,
  ProjectAccess,
  ProjectTokenSummary,
  SavedDraft,
  WorkspaceData,
} from "./types";

const localProject: ProjectAccess = {
  id: "local-core",
  organizationId: "local-org",
  slug: "core",
  name: "Formaglyph Core",
  visibility: "private",
  role: "admin",
};

export class LocalRepository implements FormaglyphRepository {
  readonly mode = "local" as const;
  private readonly generationJobs = new Map<string, GenerationJob>();
  async listPublishedIcons(): Promise<CatalogIcon[]> {
    if (typeof window === "undefined") return iconResults;
    const state = loadAppState();
    const releases = readLocalWorkspace()
      .proposals.filter((item) => item.proposal.status === "published")
      .flatMap((item) => {
        const candidate = item.revisions.at(-1)?.candidate;
        if (!candidate?.variants.regular || !candidate.variants.solid)
          return [];
        const icon = state.workspace.find(
          (record) => record.id === item.draft.workspaceIconId,
        );
        if (icon?.status === "deprecated") return [];
        return (["regular", "solid"] as const).map(
          (variant): CatalogIcon => ({
            id: `local-release-${item.proposal.id}:${variant}`,
            stableId:
              icon?.stableId ??
              `ico_local_${item.proposal.id.replaceAll("-", "_").toLowerCase()}`,
            name: item.draft.name,
            label: item.draft.name,
            category: icon?.category ?? "Interface",
            description: item.draft.description,
            tags: item.draft.keywords
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            aliases: [{ locale: "en", value: item.draft.name, reviewed: true }],
            version: item.proposal.targetVersion,
            variant,
            directionality: "neutral",
            licence: "MIT",
            status: "published",
            provenance: {
              kind: "human-reviewed",
              source: "Local demonstration release",
              disclosed: true,
            },
            library: "projects",
            previewWeight: variant === "solid" ? "fill" : "regular",
            gridSize: 24,
            svg: candidate.variants[variant]!,
          }),
        );
      });
    return [...iconResults, ...releases];
  }
  async loadWorkspace(
    projectSlug: string,
    _draftId?: string | null,
    _proposalId?: string | null,
  ): Promise<WorkspaceData | null> {
    if (projectSlug !== localProject.slug) return null;
    const state =
      typeof window === "undefined"
        ? structuredClone(initialAppState)
        : loadAppState();
    const reviewQueue: ReviewQueueItem[] = [
      {
        proposal: state.proposal,
        databaseProposalId: state.proposal.id,
        draft: state.draft,
        authorId: "local-contributor",
        updatedAt:
          state.proposal.decidedAt ??
          state.proposal.submittedAt ??
          state.draft.updatedAt,
        revisions: [
          {
            id: "local-revision-1",
            sequence: 1,
            candidate:
              state.candidates.find(
                (candidate) => candidate.id === state.proposal.candidateId,
              ) ?? state.candidates[0],
            submittedAt: state.proposal.submittedAt ?? state.draft.updatedAt,
            submittedBy: "local-contributor",
          },
        ],
        baselineCandidate: null,
        decisions: [],
      },
    ];
    const records = typeof window === "undefined" ? null : readLocalWorkspace();
    const proposals = records?.proposals.length
      ? sortReviewQueue(records.proposals)
      : reviewQueue;
    const selectedProposal = _proposalId
      ? proposals.find((item) => item.proposal.id === _proposalId)
      : undefined;
    const selectedDraft = _draftId
      ? records?.drafts[_draftId]
      : selectedProposal
        ? records?.drafts[selectedProposal.draft.workspaceIconId]
        : undefined;
    return {
      project: localProject,
      icons: state.workspace,
      draft: selectedDraft?.draft ?? state.draft,
      proposal: selectedDraft?.proposal ?? state.proposal,
      candidates: selectedDraft?.candidates ?? state.candidates,
      reviewQueue: proposals,
      auditEvents: state.auditEvents,
      releaseEntries: state.releaseEntries,
    };
  }
  async saveDraft(
    _projectSlug: string,
    draft: { workspaceIconId: string },
    candidate: CandidateAssetInput,
  ): Promise<SavedDraft> {
    const variant =
      candidate.primaryVariant ??
      (candidate.variants.regular ? "regular" : "solid");
    const svg = candidate.variants[variant];
    if (!svg) throw new Error("At least one candidate variant is required.");
    return {
      draftId: draft.workspaceIconId || "local-draft",
      candidateId: candidate.id,
      validation: validateCandidateAsset({ ...candidate, svg, variant }),
    };
  }
  async submitProposal(
    _draftId: string,
    _candidateId: string,
    _targetVersion: string,
  ): Promise<Proposal> {
    return (typeof window === "undefined" ? initialAppState : loadAppState())
      .proposal;
  }
  async reviewProposal(
    _proposalId: string,
    _decision: "approve" | "request_changes" | "reject",
  ): Promise<Proposal> {
    return (typeof window === "undefined" ? initialAppState : loadAppState())
      .proposal;
  }
  async publishProposal() {
    return;
  }
  async reopenApprovedProposal(): Promise<Proposal> {
    throw new Error("Paired-release repair requires the Supabase data mode.");
  }
  async commentProposal(
    _proposalId: string,
    title: string,
    body: string,
  ): Promise<ReviewComment> {
    return {
      id: `local-review-${crypto.randomUUID()}`,
      title,
      author: "You",
      time: new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      text: body,
      resolved: false,
    };
  }
  async resolveReview(
    reviewId: string,
    resolved: boolean,
  ): Promise<ReviewComment> {
    return {
      id: reviewId,
      title: "",
      author: "You",
      time: "",
      text: "",
      resolved,
    };
  }
  async deprecateIcon(_iconId: string, _reason: string) {
    return;
  }
  async startGenerationJob(
    _projectSlug: string,
    input: {
      draftId?: string | null;
      adapter: GenerationJob["adapter"];
      prompt: string;
      promptHash: string;
      retainPrompt: boolean;
      candidateCount: number;
    },
  ): Promise<GenerationJob> {
    const job: GenerationJob = {
      id: `local-job-${crypto.randomUUID()}`,
      adapter: input.adapter,
      status: "running",
      progress: 10,
      promptHash: input.promptHash,
      promptRetained: input.retainPrompt,
      candidateCount: input.candidateCount,
      error: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async completeGenerationJob(
    _jobId: string,
    result: { candidateCount: number; passedCount: number },
  ): Promise<GenerationJob> {
    const current = this.generationJobs.get(_jobId);
    if (!current) throw new Error("Generation job was not found.");
    const job = {
      ...current,
      status: "completed" as const,
      progress: 100,
      candidateCount: result.candidateCount,
      completedAt: new Date().toISOString(),
    };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async failGenerationJob(
    jobId: string,
    _errorCode: string,
    errorMessage: string,
  ): Promise<GenerationJob> {
    const current = this.generationJobs.get(jobId);
    if (!current) throw new Error("Generation job was not found.");
    const job = {
      ...current,
      status: "failed" as const,
      error: errorMessage,
      completedAt: new Date().toISOString(),
    };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async cancelGenerationJob(jobId: string): Promise<GenerationJob> {
    const current = this.generationJobs.get(jobId);
    if (!current) throw new Error("Generation job was not found.");
    const job = {
      ...current,
      status: "cancelled" as const,
      completedAt: new Date().toISOString(),
    };
    this.generationJobs.set(job.id, job);
    return job;
  }
  async listProjectTokens(): Promise<ProjectTokenSummary[]> {
    return [];
  }
  async issueProjectToken(): Promise<never> {
    throw new Error("Project tokens require the Supabase data mode.");
  }
  async revokeProjectToken(): Promise<never> {
    throw new Error("Project tokens require the Supabase data mode.");
  }
  async bootstrapWorkspace() {
    return localProject;
  }
  async setProjectVisibility(): Promise<ProjectAccess> {
    throw new Error("Project visibility requires the Supabase workspace.");
  }
}
