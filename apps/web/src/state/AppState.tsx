import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppSettings, DraftBrief, IntegrationName, PersistedAppState, ReviewComment, WorkspaceStatus } from "../domain/types";
import { loadAppState, saveAppState } from "../services/storage";
import { transitionProposal } from "../services/workflow";
import { canTransitionWorkspaceIcon, transitionWorkspaceIcon } from "../services/workspace";
import { repository } from "../services/repositories";
import { generationPrompt, importSvgCandidate, LocalGeometryAdapter, sha256Text } from "../services/generation";
import { useLocation } from "react-router-dom";
import { useAuthState } from "./AuthState";

type NoticeTone = "success" | "error" | "info";

interface Notice {
  message: string;
  tone: NoticeTone;
}

interface AppStateValue {
  state: PersistedAppState;
  backendLoading: boolean;
  backendError: string | null;
  role: "contributor" | "reviewer" | "admin";
  notice: Notice | null;
  updateDraft: (field: keyof Pick<DraftBrief, "name" | "description" | "keywords">, value: string) => void;
  selectCandidate: (candidateId: string) => void;
  generateCandidates: () => Promise<boolean>;
  importCandidate: (svg: string, variant: "regular" | "solid", filename: string) => boolean;
  cancelGeneration: () => Promise<void>;
  saveDraft: () => Promise<void>;
  submitForReview: () => Promise<boolean>;
  addComment: (text: string) => void;
  toggleComment: (commentId: string) => void;
  requestChanges: () => Promise<void>;
  approveProposal: () => Promise<void>;
  openWorkspaceIcon: (iconId: string) => boolean;
  updateWorkspaceStatus: (iconId: string, status: WorkspaceStatus) => Promise<void>;
  duplicateWorkspaceIcon: (iconId: string) => void;
  updateSetting: <Key extends keyof Omit<AppSettings, "integrations">>(key: Key, value: AppSettings[Key]) => void;
  toggleIntegration: (integration: IntegrationName) => void;
  markApiKeyCreated: () => void;
  clearNotice: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(() => loadAppState());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [role, setRole] = useState<"contributor" | "reviewer" | "admin">("admin");
  const generationController = useRef<AbortController | null>(null);
  const { user } = useAuthState();
  const location = useLocation();
  const projectSlug = location.pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "core";

  useEffect(() => {
    if (repository.mode === "local") saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (repository.mode !== "supabase" || !user || !location.pathname.startsWith("/projects/")) return;
    let active = true;
    setBackendLoading(true);
    setBackendError(null);
    void repository.loadWorkspace(projectSlug).then((workspace) => {
      if (!active) return;
      if (!workspace) throw new Error("Project not found or you do not have access.");
      setRole(workspace.project.role);
      setState((current) => ({ ...current, workspace: workspace.icons, draft: workspace.draft ?? current.draft, proposal: workspace.proposal ?? current.proposal }));
    }).catch((error: unknown) => {
      if (active) setBackendError(error instanceof Error ? error.message : "Could not load this workspace.");
    }).finally(() => { if (active) setBackendLoading(false); });
    return () => { active = false; };
  }, [location.pathname, projectSlug, user]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const updateDraft = useCallback<AppStateValue["updateDraft"]>((field, value) => {
    setState((current) => ({
      ...current,
      draft: { ...current.draft, [field]: value },
      workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? {
        ...icon,
        ...(field === "name" ? { name: value, label: value.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ") } : {}),
        ...(field === "description" ? { description: value } : {}),
      } : icon),
    }));
  }, []);

  const selectCandidate = useCallback((candidateId: string) => {
    setState((current) => ({
      ...current,
      draft: current.candidates.some((candidate) => candidate.id === candidateId) ? { ...current.draft, selectedCandidateId: candidateId } : current.draft,
    }));
  }, []);

  const generateCandidates = useCallback(async () => {
    if (!state.draft.name.trim() || !state.draft.description.trim()) {
      setNotice({ tone: "error", message: "Add an icon name and description before generating candidates." });
      return false;
    }
    if (state.settings.generationAdapter !== "local") {
      setNotice({ tone: "error", message: "Hosted generation is not enabled for this project." });
      return false;
    }
    const prompt = generationPrompt(state.draft);
    const promptHash = await sha256Text(prompt);
    let jobId: string | null = null;
    const controller = new AbortController();
    generationController.current?.abort();
    generationController.current = controller;
    try {
      const job = await repository.startGenerationJob(projectSlug, {
        draftId: state.draft.workspaceIconId,
        adapter: "local_geometry",
        prompt,
        promptHash,
        retainPrompt: state.settings.retainPrompts,
        candidateCount: 3,
      });
      jobId = job.id;
      setState((current) => ({ ...current, generationJob: job }));
      const generated = await new LocalGeometryAdapter().generate({ brief: state.draft, candidateCount: 3, generationJobId: job.id }, {
        signal: controller.signal,
        onProgress: ({ progress }) => setState((current) => current.generationJob?.id === job.id ? { ...current, generationJob: { ...current.generationJob, progress } } : current),
      });
      const completed = await repository.completeGenerationJob(job.id, { candidateCount: generated.length, passedCount: generated.filter((candidate) => !candidate.issue).length });
      setState((current) => ({
        ...current,
        candidates: generated,
        draft: { ...current.draft, selectedCandidateId: generated[0].id, updatedAt: new Date().toISOString() },
        generationJob: completed,
      }));
      setNotice({ tone: "success", message: "Three local candidates generated and validated. No prompt was sent to a model provider." });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setNotice({ tone: "info", message: "Generation cancelled." });
        return false;
      }
      const message = error instanceof Error ? error.message : "Could not generate candidates.";
      if (jobId) {
        try {
          const failed = await repository.failGenerationJob(jobId, "generation_failed", message);
          setState((current) => ({ ...current, generationJob: failed }));
        } catch {
          setState((current) => current.generationJob?.id === jobId ? { ...current, generationJob: { ...current.generationJob, status: "failed", error: message, completedAt: new Date().toISOString() } } : current);
        }
      }
      setNotice({ tone: "error", message });
      return false;
    } finally {
      if (generationController.current === controller) generationController.current = null;
    }
  }, [projectSlug, state.draft, state.settings.generationAdapter, state.settings.retainPrompts]);

  const importCandidate = useCallback((svg: string, variant: "regular" | "solid", filename: string) => {
    try {
      const candidate = importSvgCandidate(svg, variant, filename);
      setState((current) => ({ ...current, candidates: [candidate, ...current.candidates], draft: { ...current.draft, selectedCandidateId: candidate.id, updatedAt: new Date().toISOString() } }));
      setNotice({ tone: candidate.issue ? "info" : "success", message: candidate.issue ?? "SVG imported, normalized, and validated locally." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not import that SVG." });
      return false;
    }
  }, []);

  const cancelGeneration = useCallback(async () => {
    generationController.current?.abort();
    const job = state.generationJob;
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    try {
      const cancelled = await repository.cancelGenerationJob(job.id);
      setState((current) => ({ ...current, generationJob: cancelled }));
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not cancel generation." });
    }
  }, [state.generationJob]);

  const persistDraft = useCallback(async () => {
    const selected = state.candidates.find((candidate) => candidate.id === state.draft.selectedCandidateId) ?? state.candidates[0];
    if (!selected) throw new Error("Generate or import a candidate before saving this draft.");
    const variant = state.settings.defaultVariant;
    const svg = selected.variants[variant];
    if (!svg) throw new Error(`${variant === "regular" ? "Regular" : "Solid"} geometry is missing from the selected candidate.`);
    return repository.saveDraft(projectSlug, state.draft, {
      id: selected.id,
      name: selected.name,
      description: selected.description,
      svg,
      issue: selected.issue,
      variant,
      provenance: selected.provenance,
      generationJobId: selected.provenance.generationJobId,
      promptSha256: selected.provenance.promptHash,
    });
  }, [projectSlug, state.candidates, state.draft, state.settings.defaultVariant]);

  const saveDraft = useCallback(async () => {
    try {
      const saved = await persistDraft();
      setState((current) => ({
        ...current,
        draft: { ...current.draft, workspaceIconId: saved.draftId, updatedAt: new Date().toISOString() },
        proposal: { ...current.proposal, draftId: saved.draftId, candidateId: saved.candidateId },
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, updatedAt: new Date().toISOString() } : icon),
      }));
      setNotice({
        tone: saved.validation.status === "passed" ? "success" : "info",
        message: saved.validation.status === "passed"
          ? repository.mode === "local" ? "Draft saved locally. SVG validation passed." : "Draft saved securely. SVG validation passed."
          : "Draft saved with validation issues. Resolve them before review.",
      });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not save draft." });
      throw error;
    }
  }, [persistDraft]);

  const submitForReview = useCallback(async () => {
    const selected = state.candidates.find((candidate) => candidate.id === state.draft.selectedCandidateId);
    if (!state.draft.name.trim() || !state.draft.description.trim()) {
      setNotice({ tone: "error", message: "Name and description are required." });
      return false;
    }
    if (selected?.issue) {
      setNotice({ tone: "error", message: "Resolve the candidate validation issue before review." });
      return false;
    }
    try {
      if (repository.mode === "supabase") {
        const saved = await persistDraft();
        const proposal = await repository.submitProposal(saved.draftId, saved.candidateId, state.proposal.targetVersion);
        setState((current) => ({ ...current, draft: { ...current.draft, workspaceIconId: saved.draftId, updatedAt: new Date().toISOString() }, proposal }));
      } else setState((current) => ({
        ...current,
        draft: { ...current.draft, updatedAt: new Date().toISOString() },
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "in_review", validation: "passed", updatedAt: new Date().toISOString() } : icon),
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
  }, [persistDraft, state.candidates, state.draft, state.proposal.status, state.proposal.targetVersion]);

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

  const requestChanges = useCallback(async () => {
    try {
      if (repository.mode === "supabase") {
        const proposal = await repository.reviewProposal(state.proposal.id, "request_changes");
        setState((current) => ({ ...current, proposal, workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "changes_requested", updatedAt: new Date().toISOString() } : icon) }));
      } else setState((current) => ({
        ...current,
        proposal: transitionProposal(current.proposal, "changes_requested"),
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "changes_requested", updatedAt: new Date().toISOString() } : icon),
      }));
      setNotice({ tone: "info", message: "Changes requested. The proposal is back with its author." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not update proposal." });
    }
  }, [state.proposal.id]);

  const approveProposal = useCallback(async () => {
    try {
      if (repository.mode === "supabase") {
        const proposal = await repository.reviewProposal(state.proposal.id, "approve");
        setState((current) => ({ ...current, proposal, workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "approved", updatedAt: new Date().toISOString() } : icon) }));
      } else setState((current) => ({
        ...current,
        proposal: transitionProposal(current.proposal, "approved"),
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "approved", updatedAt: new Date().toISOString() } : icon),
      }));
      setNotice({ tone: "success", message: "Proposal approved and queued for v1.1.0." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not approve proposal." });
    }
  }, [state.proposal.id]);

  const openWorkspaceIcon = useCallback((iconId: string) => {
    const icon = state.workspace.find((item) => item.id === iconId);
    if (!icon) return false;
    const proposalStatus = icon.status === "in_review" || icon.status === "changes_requested" || icon.status === "approved" ? icon.status : "draft";
    setState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        workspaceIconId: icon.id,
        name: icon.name,
        description: icon.description,
        keywords: icon.tags.join(", "),
        selectedCandidateId: current.candidates[0]?.id ?? "candidate-01",
        updatedAt: icon.updatedAt,
      },
      proposal: {
        ...current.proposal,
        draftId: icon.id.toUpperCase(),
        status: proposalStatus,
        candidateId: current.candidates[0]?.id ?? "candidate-01",
        decidedAt: proposalStatus === "approved" || proposalStatus === "changes_requested" ? icon.updatedAt : null,
        submittedAt: proposalStatus === "in_review" ? icon.updatedAt : null,
        comments: icon.id === "wrk-cloud-upload" ? current.proposal.comments : [],
      },
    }));
    return true;
  }, [state.workspace]);

  const updateWorkspaceStatus = useCallback(async (iconId: string, status: WorkspaceStatus) => {
    const target = state.workspace.find((icon) => icon.id === iconId);
    if (!target || !canTransitionWorkspaceIcon(target.status, status)) {
      setNotice({ tone: "error", message: target ? `Icon cannot move from ${target.status.replace("_", " ")} to ${status.replace("_", " ")}.` : "Workspace icon was not found." });
      return;
    }
    try {
      if (repository.mode === "supabase" && status === "published") await repository.publishProposal(state.proposal.id);
      setState((current) => ({
        ...current,
        proposal: status === "published" && current.proposal.status === "approved" ? transitionProposal(current.proposal, "published") : current.proposal,
        workspace: current.workspace.map((icon) => icon.id === iconId ? transitionWorkspaceIcon(icon, status) : icon),
      }));
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not publish icon." });
      return;
    }
    const message = status === "published" ? "Icon published to Explore." : status === "archived" ? "Icon archived." : status === "draft" ? "Icon restored as a draft." : `Icon moved to ${status.replace("_", " ")}.`;
    setNotice({ tone: status === "published" ? "success" : "info", message });
  }, [state.proposal.id, state.workspace]);

  const duplicateWorkspaceIcon = useCallback((iconId: string) => {
    setState((current) => {
      const source = current.workspace.find((icon) => icon.id === iconId);
      if (!source) return current;
      const suffix = current.workspace.filter((icon) => icon.name.startsWith(`${source.name}-copy`)).length + 1;
      return {
        ...current,
        workspace: [{
          ...source,
          id: `wrk-${source.name}-copy-${Date.now()}`,
          stableId: `ico_workspace_${source.name.replaceAll("-", "_")}_copy_${suffix}`,
          name: `${source.name}-copy-${suffix}`,
          label: `${source.label} copy ${suffix}`,
          status: "draft",
          creator: "You",
          updatedAt: new Date().toISOString(),
          version: "1.1.0",
        }, ...current.workspace],
      };
    });
    setNotice({ tone: "success", message: "Draft copy created in Workspace." });
  }, []);

  const updateSetting = useCallback<AppStateValue["updateSetting"]>((key, value) => {
    setState((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }, []);

  const toggleIntegration = useCallback((integration: IntegrationName) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        integrations: { ...current.settings.integrations, [integration]: !current.settings.integrations[integration] },
      },
    }));
  }, []);

  const markApiKeyCreated = useCallback(() => {
    setState((current) => ({ ...current, settings: { ...current.settings, apiKeyCreatedAt: new Date().toISOString() } }));
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    state,
    backendLoading,
    backendError,
    role,
    notice,
    updateDraft,
    selectCandidate,
    generateCandidates,
    importCandidate,
    cancelGeneration,
    saveDraft,
    submitForReview,
    addComment,
    toggleComment,
    requestChanges,
    approveProposal,
    openWorkspaceIcon,
    updateWorkspaceStatus,
    duplicateWorkspaceIcon,
    updateSetting,
    toggleIntegration,
    markApiKeyCreated,
    clearNotice: () => setNotice(null),
  }), [state, backendLoading, backendError, role, notice, updateDraft, selectCandidate, generateCandidates, importCandidate, cancelGeneration, saveDraft, submitForReview, addComment, toggleComment, requestChanges, approveProposal, openWorkspaceIcon, updateWorkspaceStatus, duplicateWorkspaceIcon, updateSetting, toggleIntegration, markApiKeyCreated]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider.");
  return value;
}
