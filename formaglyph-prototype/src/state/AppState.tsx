import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { candidates } from "../data/catalog";
import type { DraftBrief, PersistedAppState, ReviewComment } from "../domain/types";
import { loadAppState, saveAppState } from "../services/storage";
import { transitionProposal } from "../services/workflow";

type NoticeTone = "success" | "error" | "info";

interface Notice {
  message: string;
  tone: NoticeTone;
}

interface AppStateValue {
  state: PersistedAppState;
  notice: Notice | null;
  updateDraft: (field: keyof Pick<DraftBrief, "name" | "description" | "keywords">, value: string) => void;
  selectCandidate: (candidateId: string) => void;
  saveDraft: () => void;
  submitForReview: () => boolean;
  addComment: (text: string) => void;
  toggleComment: (commentId: string) => void;
  requestChanges: () => void;
  approveProposal: () => void;
  clearNotice: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(() => loadAppState());
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const updateDraft = useCallback<AppStateValue["updateDraft"]>((field, value) => {
    setState((current) => ({
      ...current,
      draft: { ...current.draft, [field]: value },
    }));
  }, []);

  const selectCandidate = useCallback((candidateId: string) => {
    if (!candidates.some((candidate) => candidate.id === candidateId)) return;
    setState((current) => ({
      ...current,
      draft: { ...current.draft, selectedCandidateId: candidateId },
    }));
  }, []);

  const saveDraft = useCallback(() => {
    setState((current) => ({
      ...current,
      draft: { ...current.draft, updatedAt: new Date().toISOString() },
    }));
    setNotice({ tone: "success", message: "Draft saved locally." });
  }, []);

  const submitForReview = useCallback(() => {
    const selected = candidates.find((candidate) => candidate.id === state.draft.selectedCandidateId);
    if (!state.draft.name.trim() || !state.draft.description.trim()) {
      setNotice({ tone: "error", message: "Name and description are required." });
      return false;
    }
    if (selected?.issue) {
      setNotice({ tone: "error", message: "Resolve the candidate validation issue before review." });
      return false;
    }
    try {
      setState((current) => ({
        ...current,
        draft: { ...current.draft, updatedAt: new Date().toISOString() },
        proposal: {
          ...transitionProposal(
            current.proposal.status === "approved"
              ? { ...current.proposal, status: "changes_requested" }
              : current.proposal,
            "in_review",
          ),
          candidateId: current.draft.selectedCandidateId,
          decidedAt: null,
        },
      }));
      setNotice({ tone: "success", message: "Proposal submitted for human review." });
      return true;
    } catch (error) {
      if (state.proposal.status === "in_review") {
        setNotice({ tone: "info", message: "Proposal is already in review." });
        return true;
      }
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not submit proposal." });
      return false;
    }
  }, [state.draft, state.proposal.status]);

  const addComment = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    setState((current) => {
      const comment: ReviewComment = {
        id: `R${current.proposal.comments.length + 1}`,
        title: "Reviewer note",
        author: "You",
        time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
        text: cleanText,
        resolved: false,
      };
      return { ...current, proposal: { ...current.proposal, comments: [...current.proposal.comments, comment] } };
    });
    setNotice({ tone: "success", message: "Review note added." });
  }, []);

  const toggleComment = useCallback((commentId: string) => {
    setState((current) => ({
      ...current,
      proposal: {
        ...current.proposal,
        comments: current.proposal.comments.map((comment) => comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment),
      },
    }));
  }, []);

  const requestChanges = useCallback(() => {
    try {
      setState((current) => ({ ...current, proposal: transitionProposal(current.proposal, "changes_requested") }));
      setNotice({ tone: "info", message: "Changes requested. The proposal is back with its author." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not update proposal." });
    }
  }, []);

  const approveProposal = useCallback(() => {
    try {
      setState((current) => ({ ...current, proposal: transitionProposal(current.proposal, "approved") }));
      setNotice({ tone: "success", message: "Proposal approved and queued for v1.1.0." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not approve proposal." });
    }
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    state,
    notice,
    updateDraft,
    selectCandidate,
    saveDraft,
    submitForReview,
    addComment,
    toggleComment,
    requestChanges,
    approveProposal,
    clearNotice: () => setNotice(null),
  }), [state, notice, updateDraft, selectCandidate, saveDraft, submitForReview, addComment, toggleComment, requestChanges, approveProposal]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider.");
  return value;
}
