import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppSettings, AuditEvent, DraftBrief, IntegrationName, PersistedAppState, ReviewComment, WorkspaceStatus } from "../domain/types";
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
  addComment: (text: string) => Promise<void>;
  toggleComment: (commentId: string) => Promise<void>;
  requestChanges: (note: string) => Promise<void>;
  approveProposal: (note?: string) => Promise<void>;
  rejectProposal: (note: string) => Promise<void>;
  openWorkspaceIcon: (iconId: string) => boolean;
  updateWorkspaceStatus: (iconId: string, status: WorkspaceStatus, reason?: string) => Promise<void>;
  duplicateWorkspaceIcon: (iconId: string) => void;
  updateSetting: <Key extends keyof Omit<AppSettings, "integrations">>(key: Key, value: AppSettings[Key]) => void;
  toggleIntegration: (integration: IntegrationName) => void;
  markApiKeyCreated: () => void;
  clearNotice: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function localAuditEvent(action: string, targetType: string, targetId: string | null, metadata: AuditEvent["metadata"] = {}): AuditEvent {
  return {
    id: `evt-${crypto.randomUUID()}`,
    action,
    actorId: "local-admin",
    targetType,
    targetId,
    source: "local",
    occurredAt: new Date().toISOString(),
    metadata,
  };
}

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
  const requestedDraftId = new URLSearchParams(location.search).get("draft");

  useEffect(() => {
    if (repository.mode === "local") saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (repository.mode !== "supabase" || !user || !location.pathname.startsWith("/projects/")) return;
    let active = true;
    setBackendLoading(true);
    setBackendError(null);
    void repository.loadWorkspace(projectSlug, requestedDraftId).then((workspace) => {
      if (!active) return;
      if (!workspace) throw new Error("Project not found or you do not have access.");
      setRole(workspace.project.role);
      setState((current) => ({
        ...current,
        workspace: workspace.icons,
        draft: workspace.draft ?? current.draft,
        proposal: workspace.proposal ?? current.proposal,
        auditEvents: workspace.auditEvents,
        releaseEntries: workspace.releaseEntries,
      }));
    }).catch((error: unknown) => {
      if (active) setBackendError(error instanceof Error ? error.message : "Could not load this workspace.");
    }).finally(() => { if (active) setBackendLoading(false); });
    return () => { active = false; };
  }, [location.pathname, projectSlug, requestedDraftId, user]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const refreshWorkspace = useCallback(async () => {
    if (repository.mode !== "supabase") return null;
    const workspace = await repository.loadWorkspace(projectSlug, requestedDraftId);
    if (!workspace) throw new Error("Project not found or you do not have access.");
    setRole(workspace.project.role);
    setState((current) => ({
      ...current,
      workspace: workspace.icons,
      draft: workspace.draft ?? current.draft,
      proposal: workspace.proposal ?? current.proposal,
      auditEvents: workspace.auditEvents,
      releaseEntries: workspace.releaseEntries,
    }));
    return workspace;
  }, [projectSlug, requestedDraftId]);

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

  const addComment = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    try {
      const comment = await repository.commentProposal(state.proposal.id, "Reviewer note", cleanText);
      if (repository.mode === "supabase") await refreshWorkspace();
      else setState((current) => ({
        ...current,
        proposal: { ...current.proposal, comments: [...current.proposal.comments, comment] },
        auditEvents: [localAuditEvent("review.comment_added", "review", comment.id, { title: comment.title }), ...current.auditEvents],
      }));
      setNotice({ tone: "success", message: "Review note added and audited." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not add review note." });
    }
  }, [refreshWorkspace, state.proposal.id]);

  const toggleComment = useCallback(async (commentId: string) => {
    const currentComment = state.proposal.comments.find((comment) => comment.id === commentId);
    if (!currentComment) return;
    try {
      const comment = await repository.resolveReview(commentId, !currentComment.resolved);
      if (repository.mode === "supabase") await refreshWorkspace();
      else setState((current) => ({
        ...current,
        proposal: { ...current.proposal, comments: current.proposal.comments.map((item) => item.id === commentId ? { ...item, resolved: comment.resolved } : item) },
        auditEvents: [localAuditEvent(comment.resolved ? "review.comment_resolved" : "review.comment_reopened", "review", commentId), ...current.auditEvents],
      }));
      setNotice({ tone: "info", message: comment.resolved ? "Review note resolved." : "Review note reopened." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not update review note." });
    }
  }, [refreshWorkspace, state.proposal.comments]);

  const requestChanges = useCallback(async (note: string) => {
    try {
      if (repository.mode === "supabase") {
        await repository.reviewProposal(state.proposal.id, "request_changes", note);
        await refreshWorkspace();
      } else setState((current) => ({
        ...current,
        proposal: transitionProposal(current.proposal, "changes_requested"),
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "changes_requested", updatedAt: new Date().toISOString() } : icon),
        auditEvents: [localAuditEvent("proposal.changes_requested", "proposal", current.proposal.id, { note }), ...current.auditEvents],
      }));
      setNotice({ tone: "info", message: "Changes requested. The proposal is back with its author." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not update proposal." });
    }
  }, [refreshWorkspace, state.proposal.id]);

  const approveProposal = useCallback(async (note = "") => {
    try {
      if (repository.mode === "supabase") {
        await repository.reviewProposal(state.proposal.id, "approve", note);
        await refreshWorkspace();
      } else setState((current) => ({
        ...current,
        proposal: transitionProposal(current.proposal, "approved"),
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "approved", updatedAt: new Date().toISOString() } : icon),
        auditEvents: [localAuditEvent("proposal.approved", "proposal", current.proposal.id, { note: note || null }), ...current.auditEvents],
      }));
      setNotice({ tone: "success", message: `Proposal approved and queued for v${state.proposal.targetVersion}.` });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not approve proposal." });
    }
  }, [refreshWorkspace, state.proposal.id, state.proposal.targetVersion]);

  const rejectProposal = useCallback(async (note: string) => {
    try {
      if (repository.mode === "supabase") {
        await repository.reviewProposal(state.proposal.id, "reject", note);
        await refreshWorkspace();
      } else setState((current) => ({
        ...current,
        proposal: transitionProposal(current.proposal, "rejected"),
        workspace: current.workspace.map((icon) => icon.id === current.draft.workspaceIconId ? { ...icon, status: "rejected", updatedAt: new Date().toISOString() } : icon),
        auditEvents: [localAuditEvent("proposal.rejected", "proposal", current.proposal.id, { note }), ...current.auditEvents],
      }));
      setNotice({ tone: "info", message: "Proposal rejected with an audited decision note." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not reject proposal." });
    }
  }, [refreshWorkspace, state.proposal.id]);

  const openWorkspaceIcon = useCallback((iconId: string) => {
    const icon = state.workspace.find((item) => item.id === iconId);
    if (!icon) return false;
    const proposalStatus = icon.status === "in_review" || icon.status === "changes_requested" || icon.status === "approved" || icon.status === "rejected" ? icon.status : "draft";
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
        decidedAt: proposalStatus === "approved" || proposalStatus === "changes_requested" || proposalStatus === "rejected" ? icon.updatedAt : null,
        submittedAt: proposalStatus === "in_review" ? icon.updatedAt : null,
        comments: icon.id === "wrk-cloud-upload" ? current.proposal.comments : [],
      },
    }));
    return true;
  }, [state.workspace]);

  const updateWorkspaceStatus = useCallback(async (iconId: string, status: WorkspaceStatus, reason = "") => {
    const target = state.workspace.find((icon) => icon.id === iconId);
    if (!target || !canTransitionWorkspaceIcon(target.status, status)) {
      setNotice({ tone: "error", message: target ? `Icon cannot move from ${target.status.replace("_", " ")} to ${status.replace("_", " ")}.` : "Workspace icon was not found." });
      return;
    }
    try {
      if (repository.mode === "supabase") {
        if (status === "published") await repository.publishProposal(state.proposal.id);
        else if (status === "deprecated") await repository.deprecateIcon(target.databaseIconId ?? target.id, reason);
        await refreshWorkspace();
      } else setState((current) => {
        const now = new Date().toISOString();
        const selected = current.candidates.find((candidate) => candidate.id === current.proposal.candidateId);
        const next = {
          ...current,
          proposal: status === "published" && current.proposal.status === "approved" ? transitionProposal(current.proposal, "published") : current.proposal,
          workspace: current.workspace.map((icon) => icon.id === iconId ? transitionWorkspaceIcon(icon, status) : icon),
        };
        if (status === "published") {
          const entry = {
            id: `rel-${crypto.randomUUID()}`,
            iconId,
            iconName: target.name,
            version: target.version,
            variant: target.variant,
            status: "published" as const,
            contentHash: selected?.provenance.promptHash ?? "0".repeat(64),
            occurredAt: now,
            reason: null,
          };
          return { ...next, releaseEntries: [entry, ...current.releaseEntries], auditEvents: [localAuditEvent("icon.published", "icon_version", entry.id, { version: entry.version }), ...current.auditEvents] };
        }
        if (status === "deprecated") {
          return {
            ...next,
            releaseEntries: current.releaseEntries.map((entry) => entry.iconId === iconId && entry.status === "published" ? { ...entry, status: "deprecated" as const, reason } : entry),
            auditEvents: [localAuditEvent("icon.deprecated", "icon", iconId, { reason }), ...current.auditEvents],
          };
        }
        return next;
      });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not update icon governance." });
      return;
    }
    const message = status === "published" ? "Icon published to Explore." : status === "deprecated" ? "Icon deprecated. Its immutable release remains available by URL." : status === "archived" ? "Icon archived." : status === "draft" ? "Icon restored as a draft." : `Icon moved to ${status.replace("_", " ")}.`;
    setNotice({ tone: status === "published" ? "success" : "info", message });
  }, [refreshWorkspace, state.candidates, state.proposal.id, state.workspace]);

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
    rejectProposal,
    openWorkspaceIcon,
    updateWorkspaceStatus,
    duplicateWorkspaceIcon,
    updateSetting,
    toggleIntegration,
    markApiKeyCreated,
    clearNotice: () => setNotice(null),
  }), [state, backendLoading, backendError, role, notice, updateDraft, selectCandidate, generateCandidates, importCandidate, cancelGeneration, saveDraft, submitForReview, addComment, toggleComment, requestChanges, approveProposal, rejectProposal, openWorkspaceIcon, updateWorkspaceStatus, duplicateWorkspaceIcon, updateSetting, toggleIntegration, markApiKeyCreated]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider.");
  return value;
}
