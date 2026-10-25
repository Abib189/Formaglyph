import type {
  Candidate,
  DraftBrief,
  PersistedAppState,
  Proposal,
  ReviewDecision,
  ReviewQueueItem,
} from "../domain/types";

export const LOCAL_WORKSPACE_KEY = "formaglyph-local-workspace:v1";
type StoragePort = Pick<Storage, "getItem" | "setItem">;
interface LocalDraftRecord {
  draft: DraftBrief;
  candidates: Candidate[];
  proposal: Proposal;
}
interface LocalWorkspaceRecords {
  version: 1;
  drafts: Record<string, LocalDraftRecord>;
  proposals: ReviewQueueItem[];
}

export function readLocalWorkspace(
  storage: Pick<Storage, "getItem"> = window.localStorage,
): LocalWorkspaceRecords {
  try {
    const record = JSON.parse(
      storage.getItem(LOCAL_WORKSPACE_KEY) ?? "null",
    ) as LocalWorkspaceRecords | null;
    if (
      record?.version === 1 &&
      record.drafts &&
      Array.isArray(record.proposals)
    )
      return record;
  } catch {
    /* A damaged demo cache does not grant access or replace hosted records. */
  }
  return { version: 1, drafts: {}, proposals: [] };
}

/** Local demo only. Immutable submitted snapshots are separate from mutable drafts. */
export function persistLocalWorkspace(
  state: PersistedAppState,
  storage: StoragePort = window.localStorage,
) {
  const records = readLocalWorkspace(storage);
  if (state.draft.workspaceIconId)
    records.drafts[state.draft.workspaceIconId] = structuredClone({
      draft: state.draft,
      candidates: state.candidates,
      proposal: state.proposal,
    });
  if (state.proposal.id && state.proposal.status !== "draft") {
    const existing = records.proposals.find(
      (item) => item.proposal.id === state.proposal.id,
    );
    const submitted = state.candidates.find(
      (candidate) => candidate.id === state.proposal.candidateId,
    );
    if (existing || submitted) {
      const revisions = existing?.revisions ?? [];
      const latest = revisions.at(-1);
      const newSubmission =
        !latest ||
        (state.proposal.status === "in_review" &&
          latest.submittedAt !== state.proposal.submittedAt);
      if (submitted && newSubmission) {
        revisions.push({
          id: `local-revision-${crypto.randomUUID()}`,
          sequence: revisions.length + 1,
          candidate: structuredClone(submitted),
          submittedAt: state.proposal.submittedAt ?? state.draft.updatedAt,
          submittedBy: "local-contributor",
        });
      }
      const decisions = existing?.decisions ?? [];
      const decisionByStatus = {
        approved: "approve",
        changes_requested: "request_changes",
        rejected: "reject",
      } as const;
      const decision =
        decisionByStatus[
          state.proposal.status as keyof typeof decisionByStatus
        ];
      if (decision && existing?.proposal.status !== state.proposal.status) {
        const audit = state.auditEvents.find(
          (event) =>
            event.targetId === state.proposal.id && event.metadata.note,
        );
        decisions.push({
          id: `local-decision-${crypto.randomUUID()}`,
          decision,
          reviewerId: "local-admin",
          body: String(audit?.metadata.note ?? ""),
          createdAt: state.proposal.decidedAt ?? state.draft.updatedAt,
        } satisfies ReviewDecision);
      }
      const item: ReviewQueueItem = {
        proposal: structuredClone({
          ...state.proposal,
          candidateId:
            revisions.at(-1)?.candidate.id ?? state.proposal.candidateId,
        }),
        databaseProposalId: state.proposal.id,
        draft: structuredClone(
          newSubmission ? state.draft : (existing?.draft ?? state.draft),
        ),
        authorId: "local-contributor",
        updatedAt:
          state.proposal.decidedAt ??
          state.proposal.submittedAt ??
          state.draft.updatedAt,
        revisions,
        baselineCandidate: existing?.baselineCandidate ?? null,
        decisions,
      };
      records.proposals = [
        ...records.proposals.filter(
          (record) => record.proposal.id !== item.proposal.id,
        ),
        item,
      ];
    }
  }
  storage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(records));
}
