import { CloudArrowUp } from "@phosphor-icons/react";
import type { AuditEvent, Candidate, CatalogIcon, DraftBrief, GenerationJob, Proposal, ReleaseEntry, ReviewComment, WorkspaceIcon } from "../../domain/types";
import { requireSupabaseClient } from "../supabase";
import type { Database, Json } from "../database.types";
import { validateCandidateAsset } from "../candidateValidation";
import { hydratePersistedCandidate } from "../candidateAsset";
import { SVG_VALIDATOR_VERSION } from "@formaglyph/validators";
import type { CandidateAssetInput, FormaglyphRepository, MembershipRole, ProjectAccess, ProjectTokenSummary, SavedDraft, WorkspaceData } from "./types";

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type GenerationJobRow = Database["public"]["Tables"]["generation_jobs"]["Row"];

function rowToProposal(row: ProposalRow, comments: Proposal["comments"] = []): Proposal {
  return {
    id: row.public_id,
    draftId: row.draft_id,
    status: row.status as Proposal["status"],
    candidateId: row.candidate_id,
    targetVersion: row.target_version,
    comments,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    publishedAt: row.published_at,
  };
}

function rowToGenerationJob(row: GenerationJobRow): GenerationJob {
  return {
    id: row.id,
    adapter: row.adapter as GenerationJob["adapter"],
    status: row.status as GenerationJob["status"],
    progress: row.progress,
    promptHash: row.prompt_sha256,
    promptRetained: row.retain_prompt,
    candidateCount: row.candidate_count,
    error: row.error_message,
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at,
  };
}

function rowToReview(row: Database["public"]["Tables"]["reviews"]["Row"]): ReviewComment {
  return {
    id: row.id,
    title: row.title,
    author: row.reviewer_id,
    time: new Date(row.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    text: row.body,
    resolved: row.resolved,
  };
}

function rowToProjectToken(row: {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  expires_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}): ProjectTokenSummary {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.token_prefix,
    scopes: row.scopes,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

async function sha256(value: string | Blob) {
  const bytes = value instanceof Blob ? await value.arrayBuffer() : new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function currentProject(projectSlug: string): Promise<ProjectAccess> {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error("Sign in to open a project.");
  const { data: project, error: projectError } = await client.from("projects").select("*").eq("slug", projectSlug).single();
  if (projectError) throw projectError;
  const { data: membership, error: membershipError } = await client.from("memberships").select("role").eq("organization_id", project.organization_id).eq("user_id", authData.user.id).single();
  if (membershipError) throw membershipError;
  return { id: project.id, organizationId: project.organization_id, slug: project.slug, name: project.name, role: membership.role as MembershipRole };
}

async function findProposal(proposalId: string): Promise<ProposalRow> {
  const client = requireSupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId);
  const query = client.from("proposals").select("*");
  const { data, error } = isUuid ? await query.eq("id", proposalId).single() : await query.eq("public_id", proposalId).single();
  if (error) throw new Error(error.message);
  return data;
}

async function loadCandidateFromStorage(candidateId: string): Promise<Candidate> {
  const client = requireSupabaseClient();
  const { data: candidate, error: candidateError } = await client.from("candidates").select("*").eq("id", candidateId).single();
  if (candidateError) throw new Error(`Could not load the submitted candidate: ${candidateError.message}`);
  const { data: asset, error: assetError } = await client.from("asset_blobs").select("*").eq("id", candidate.asset_id).single();
  if (assetError) throw new Error(`Could not load the submitted asset record: ${assetError.message}`);
  const { data: blob, error: downloadError } = await client.storage.from(asset.storage_bucket).download(asset.storage_path);
  if (downloadError) throw new Error(`Could not download the submitted SVG: ${downloadError.message}`);

  return hydratePersistedCandidate({
    id: candidate.id,
    name: candidate.name,
    description: candidate.description,
    variant: candidate.variant,
    issue: candidate.issue,
    provenance: candidate.provenance,
    generationJobId: candidate.generation_job_id,
    promptSha256: candidate.prompt_sha256,
    createdAt: candidate.created_at,
  }, await blob.text(), asset.sha256);
}

export class SupabaseRepository implements FormaglyphRepository {
  readonly mode = "supabase" as const;

  async listPublishedIcons(): Promise<CatalogIcon[]> {
    const client = requireSupabaseClient();
    const { data: icons, error } = await client.from("icons").select("*").eq("status", "published").order("canonical_name");
    if (error) throw error;
    const versionIds = icons.map((icon) => icon.current_version_id).filter((id): id is string => Boolean(id));
    const iconIds = icons.map((icon) => icon.id);
    const { data: versions, error: versionError } = versionIds.length ? await client.from("icon_versions").select("*").in("id", versionIds) : { data: [], error: null };
    if (versionError) throw versionError;
    const assetIds = versions.map((version) => version.optimized_asset_id ?? version.source_asset_id);
    const { data: assets, error: assetError } = assetIds.length ? await client.from("asset_blobs").select("*").in("id", assetIds) : { data: [], error: null };
    if (assetError) throw assetError;
    const { data: aliases, error: aliasError } = iconIds.length ? await client.from("icon_aliases").select("*").in("icon_id", iconIds) : { data: [], error: null };
    if (aliasError) throw aliasError;

    return icons.map((icon) => {
      const version = versions.find((item) => item.id === icon.current_version_id);
      const asset = assets.find((item) => item.id === (version?.optimized_asset_id ?? version?.source_asset_id));
      const assetUrl = asset ? client.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl : undefined;
      return {
        id: icon.id,
        stableId: icon.stable_id,
        name: icon.canonical_name,
        label: icon.label,
        category: icon.category,
        description: icon.description,
        Icon: CloudArrowUp,
        tags: aliases.filter((item) => item.icon_id === icon.id).map((item) => item.alias),
        aliases: aliases.filter((item) => item.icon_id === icon.id).map((item) => ({ locale: item.locale, value: item.alias, reviewed: item.reviewed })),
        version: version?.version ?? "0.0.0",
        variant: version?.variant === "solid" ? "solid" : "regular",
        previewWeight: version?.variant === "solid" ? "fill" : "regular",
        directionality: icon.directionality === "ltr" ? "ltr-specific" : icon.directionality === "rtl" ? "rtl-specific" : icon.directionality === "mirrored" ? "mirrored-safe" : "neutral",
        licence: "MIT",
        status: "published",
        provenance: { kind: "original", source: "Formaglyph", disclosed: true },
        assetUrl,
        contentHash: version?.content_hash,
      };
    });
  }

  async loadWorkspace(projectSlug: string, draftId?: string | null): Promise<WorkspaceData | null> {
    const client = requireSupabaseClient();
    let project: ProjectAccess;
    try { project = await currentProject(projectSlug); } catch { return null; }
    const [{ data: icons, error: iconError }, { data: drafts, error: draftError }, { data: proposals, error: proposalError }] = await Promise.all([
      client.from("icons").select("*").eq("project_id", project.id).order("updated_at", { ascending: false }),
      client.from("drafts").select("*").eq("project_id", project.id).order("updated_at", { ascending: false }),
      client.from("proposals").select("*").eq("project_id", project.id).order("updated_at", { ascending: false }),
    ]);
    if (iconError || draftError || proposalError) throw iconError ?? draftError ?? proposalError;
    const workspace: WorkspaceIcon[] = [
      ...drafts.map((draft) => {
        const linkedIcon = icons.find((icon) => icon.id === draft.icon_id);
        return {
          id: draft.id,
          stableId: draft.icon_id ? `ico_${draft.icon_id.replaceAll("-", "_")}` : `draft_${draft.id.replaceAll("-", "_")}`,
          name: draft.name,
          label: draft.name.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "),
          description: draft.description,
          category: "Workspace",
          tags: draft.keywords,
          project: project.name,
          status: (linkedIcon?.status === "deprecated" ? "deprecated" : draft.status) as WorkspaceIcon["status"],
          variant: "regular" as const,
          visualKey: "cloud-upload",
          creator: "Team member",
          updatedAt: linkedIcon?.status === "deprecated" ? linkedIcon.updated_at : draft.updated_at,
          validation: "passed" as const,
          version: proposals.find((item) => item.draft_id === draft.id)?.target_version ?? "1.0.0",
          databaseIconId: draft.icon_id,
        };
      }),
      ...icons.filter((icon) => !drafts.some((draft) => draft.icon_id === icon.id)).map((icon) => ({
        id: icon.id, stableId: icon.stable_id, name: icon.canonical_name, label: icon.label, description: icon.description,
        category: icon.category, tags: [], project: project.name, status: icon.status as WorkspaceIcon["status"], variant: "regular" as const,
        visualKey: "cloud-upload", creator: "Team member", updatedAt: icon.updated_at, validation: "passed" as const, version: "1.0.0",
        databaseIconId: icon.id,
      })),
    ];
    const activeDraft = (draftId ? drafts.find((draft) => draft.id === draftId) : undefined) ?? drafts[0];
    const activeProposal = proposals.find((item) => (
      item.draft_id === activeDraft?.id && item.status !== "published" && item.status !== "rejected"
    )) ?? proposals.find((item) => item.draft_id === activeDraft?.id) ?? proposals[0];
    const activeCandidateId = activeProposal?.candidate_id ?? activeDraft?.selected_candidate_id;
    const candidates = activeCandidateId ? [await loadCandidateFromStorage(activeCandidateId)] : [];
    let comments: Proposal["comments"] = [];
    if (activeProposal) {
      const { data: reviews, error } = await client.from("reviews").select("*").eq("proposal_id", activeProposal.id).order("created_at");
      if (error) throw error;
      comments = reviews.filter((review) => review.decision === "comment").map(rowToReview);
    }
    let auditEvents: AuditEvent[] = [];
    if (project.role !== "contributor") {
      const { data: events, error } = await client.from("audit_events").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      auditEvents = events.map((event) => ({
        id: String(event.id),
        action: event.action,
        actorId: event.actor_id,
        targetType: event.target_type,
        targetId: event.target_id,
        source: event.source,
        occurredAt: event.created_at,
        metadata: (event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {}) as AuditEvent["metadata"],
      }));
    }
    const iconIds = icons.map((icon) => icon.id);
    const { data: versions, error: versionError } = iconIds.length
      ? await client.from("icon_versions").select("*").in("icon_id", iconIds).order("created_at", { ascending: false }).limit(50)
      : { data: [], error: null };
    if (versionError) throw versionError;
    const releaseEntries: ReleaseEntry[] = versions.map((version) => {
      const icon = icons.find((item) => item.id === version.icon_id)!;
      const deprecation = auditEvents.find((event) => event.action === "icon.deprecated" && event.targetId === icon.id);
      return {
        id: version.id,
        iconId: icon.id,
        iconName: icon.canonical_name,
        version: version.version,
        variant: version.variant === "solid" ? "solid" : "regular",
        status: icon.status === "deprecated" && icon.current_version_id === version.id ? "deprecated" : "published",
        contentHash: version.content_hash,
        occurredAt: version.created_at,
        reason: typeof deprecation?.metadata.reason === "string" ? deprecation.metadata.reason : null,
      };
    });
    return {
      project,
      icons: workspace,
      draft: activeDraft ? { workspaceIconId: activeDraft.id, name: activeDraft.name, description: activeDraft.description, keywords: activeDraft.keywords.join(", "), selectedCandidateId: activeCandidateId ?? "", updatedAt: activeDraft.updated_at } : undefined,
      proposal: activeProposal ? rowToProposal(activeProposal, comments) : undefined,
      candidates,
      auditEvents,
      releaseEntries,
    };
  }

  async saveDraft(projectSlug: string, draft: DraftBrief, candidate: CandidateAssetInput): Promise<SavedDraft> {
    const client = requireSupabaseClient();
    const project = await currentProject(projectSlug);
    const { data: authData } = await client.auth.getUser();
    if (!authData.user) throw new Error("Sign in before saving a draft.");
    const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(draft.workspaceIconId);
    let draftId = looksLikeUuid ? draft.workspaceIconId : crypto.randomUUID();
    if (looksLikeUuid) {
      const { error } = await client.from("drafts").update({ name: draft.name, description: draft.description, keywords: draft.keywords.split(",").map((item) => item.trim()).filter(Boolean), updated_at: new Date().toISOString() }).eq("id", draftId);
      if (error) throw error;
    } else {
      const { data, error } = await client.from("drafts").insert({ id: draftId, project_id: project.id, name: draft.name, description: draft.description, keywords: draft.keywords.split(",").map((item) => item.trim()).filter(Boolean), created_by: authData.user.id }).select("id").single();
      if (error) throw error;
      draftId = data.id;
    }
    const candidateId = crypto.randomUUID();
    const assetId = crypto.randomUUID();
    const validationId = crypto.randomUUID();
    const path = `${project.organizationId}/${project.id}/${draftId}/${assetId}/source.svg`;
    const validation = validateCandidateAsset(candidate);
    const normalizedSvg = validation.normalizedSvg;
    if (!normalizedSvg) throw new Error("Safe normalized SVG output is required before upload.");
    const normalizedBlob = new Blob([normalizedSvg], { type: "image/svg+xml" });
    const hash = await sha256(normalizedSvg);
    const { error: uploadError } = await client.storage.from("source-assets").upload(path, normalizedBlob, { contentType: "image/svg+xml", upsert: false });
    if (uploadError) throw uploadError;
    const { error: assetError } = await client.from("asset_blobs").insert({ id: assetId, project_id: project.id, storage_bucket: "source-assets", storage_path: path, byte_size: normalizedBlob.size, sha256: hash, sanitization_status: "passed", created_by: authData.user.id });
    if (assetError) throw assetError;
    const issueCounts = validation.issues.reduce<Record<string, number>>((counts, issue) => ({ ...counts, [issue.severity]: (counts[issue.severity] ?? 0) + 1 }), {});
    const summary = { safe: validation.safe, changes: validation.changes, measurements: validation.measurements, issueCounts } as unknown as Json;
    const { error: validationError } = await client.from("validation_runs").insert({ id: validationId, project_id: project.id, target_type: "candidate", target_id: candidateId, validator_version: SVG_VALIDATOR_VERSION, status: validation.status, summary, created_by: authData.user.id });
    if (validationError) throw validationError;
    if (validation.issues.length) {
      const { error: issuesError } = await client.from("validation_issues").insert(validation.issues.map((issue) => ({ validation_run_id: validationId, rule_id: issue.ruleId, severity: issue.severity, location: issue.location ?? null, message: issue.message, remediation: issue.remediation ?? null })));
      if (issuesError) throw issuesError;
    }
    const blockingIssue = candidate.issue ?? validation.issues.find((issue) => issue.severity === "blocker" || issue.severity === "error")?.message ?? null;
    const { error: candidateError } = await client.from("candidates").insert({
      id: candidateId,
      draft_id: draftId,
      name: candidate.name,
      description: candidate.description,
      variant: candidate.variant ?? "regular",
      asset_id: assetId,
      validation_run_id: validationId,
      issue: blockingIssue,
      generation_job_id: candidate.generationJobId ?? null,
      prompt_sha256: candidate.promptSha256 ?? null,
      provenance: (candidate.provenance ?? { kind: "import", disclosed: true }) as unknown as Json,
      created_by: authData.user.id,
    });
    if (candidateError) throw candidateError;
    const { error: selectionError } = await client.from("drafts").update({ selected_candidate_id: candidateId, updated_at: new Date().toISOString() }).eq("id", draftId);
    if (selectionError) throw selectionError;
    return { draftId, candidateId, validation };
  }

  async submitProposal(draftId: string, candidateId: string, targetVersion: string) {
    const { data, error } = await requireSupabaseClient().rpc("submit_proposal", { p_draft_id: draftId, p_candidate_id: candidateId, p_target_version: targetVersion });
    if (error) throw error;
    return rowToProposal(data);
  }

  async reviewProposal(proposalId: string, decision: "approve" | "request_changes" | "reject", body = "") {
    const client = requireSupabaseClient();
    const row = await findProposal(proposalId);
    const { data, error } = await client.rpc("review_proposal", { p_proposal_id: row.id, p_decision: decision, p_body: body });
    if (error) throw new Error(error.message);
    return rowToProposal(data);
  }

  async publishProposal(proposalId: string) {
    const client = requireSupabaseClient();
    const proposal = await findProposal(proposalId);
    const { data: candidate, error: candidateError } = await client.from("candidates").select("*").eq("id", proposal.candidate_id).single();
    if (candidateError) throw candidateError;
    const { data: source, error: sourceError } = await client.from("asset_blobs").select("*").eq("id", candidate.asset_id).single();
    if (sourceError) throw sourceError;
    if (source.storage_bucket !== "published-assets") {
      const project = await currentProject((await client.from("projects").select("slug").eq("id", proposal.project_id).single()).data?.slug ?? "");
      const { data: sourceBlob, error: downloadError } = await client.storage.from(source.storage_bucket).download(source.storage_path);
      if (downloadError) throw downloadError;
      const publishedAssetId = crypto.randomUUID();
      const publishedPath = `${project.organizationId}/${project.id}/${proposal.draft_id}/${proposal.id}/${proposal.target_version}/${candidate.variant}.svg`;
      const { error: uploadError } = await client.storage.from("published-assets").upload(publishedPath, sourceBlob, { contentType: "image/svg+xml", upsert: false });
      if (uploadError) throw uploadError;
      const { error: assetError } = await client.from("asset_blobs").insert({ id: publishedAssetId, project_id: project.id, storage_bucket: "published-assets", storage_path: publishedPath, byte_size: sourceBlob.size, sha256: await sha256(sourceBlob), sanitization_status: "passed", created_by: (await client.auth.getUser()).data.user?.id });
      if (assetError) throw assetError;
      const { error: updateError } = await client.from("candidates").update({ asset_id: publishedAssetId }).eq("id", candidate.id);
      if (updateError) throw updateError;
    }
    const { error } = await client.rpc("publish_proposal", { p_proposal_id: proposal.id });
    if (error) throw error;
  }

  async commentProposal(proposalId: string, title: string, body: string) {
    const client = requireSupabaseClient();
    const proposal = await findProposal(proposalId);
    const { data, error } = await client.rpc("comment_proposal", { p_proposal_id: proposal.id, p_title: title, p_body: body });
    if (error) throw new Error(error.message);
    return rowToReview(data);
  }

  async resolveReview(reviewId: string, resolved: boolean) {
    const { data, error } = await requireSupabaseClient().rpc("resolve_review", { p_review_id: reviewId, p_resolved: resolved });
    if (error) throw new Error(error.message);
    return rowToReview(data);
  }

  async deprecateIcon(iconId: string, reason: string) {
    const { error } = await requireSupabaseClient().rpc("deprecate_icon", { p_icon_id: iconId, p_reason: reason });
    if (error) throw new Error(error.message);
  }

  async startGenerationJob(projectSlug: string, input: { draftId?: string | null; adapter: GenerationJob["adapter"]; prompt: string; promptHash: string; retainPrompt: boolean; candidateCount: number }) {
    const project = await currentProject(projectSlug);
    const draftId = input.draftId && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input.draftId) ? input.draftId : null;
    const { data, error } = await requireSupabaseClient().rpc("start_generation_job", {
      p_project_id: project.id,
      // PostgreSQL accepts NULL for this UUID argument; generated RPC types do
      // not currently represent nullable function arguments.
      p_draft_id: draftId as string,
      p_adapter: input.adapter,
      p_prompt: input.retainPrompt ? input.prompt : "",
      p_prompt_sha256: input.promptHash,
      p_retain_prompt: input.retainPrompt,
      p_candidate_count: input.candidateCount,
    });
    if (error) throw new Error(error.message);
    return rowToGenerationJob(data);
  }

  async completeGenerationJob(jobId: string, result: { candidateCount: number; passedCount: number }) {
    const { data, error } = await requireSupabaseClient().rpc("complete_generation_job", { p_job_id: jobId, p_result_summary: { candidate_count: result.candidateCount, passed_count: result.passedCount } });
    if (error) throw new Error(error.message);
    return rowToGenerationJob(data);
  }

  async failGenerationJob(jobId: string, errorCode: string, errorMessage: string) {
    const { data, error } = await requireSupabaseClient().rpc("fail_generation_job", { p_job_id: jobId, p_error_code: errorCode, p_error_message: errorMessage });
    if (error) throw new Error(error.message);
    return rowToGenerationJob(data);
  }

  async cancelGenerationJob(jobId: string) {
    const { data, error } = await requireSupabaseClient().rpc("cancel_generation_job", { p_job_id: jobId });
    if (error) throw new Error(error.message);
    return rowToGenerationJob(data);
  }

  async listProjectTokens(projectSlug: string) {
    const project = await currentProject(projectSlug);
    const { data, error } = await requireSupabaseClient().rpc("list_project_tokens", { p_project_id: project.id });
    if (error) throw new Error(error.message);
    return data.map(rowToProjectToken);
  }

  async issueProjectToken(projectSlug: string, name: string, expiresInDays = 30) {
    const project = await currentProject(projectSlug);
    const { data, error } = await requireSupabaseClient().rpc("issue_project_token", {
      p_project_id: project.id,
      p_name: name,
      p_expires_in_days: expiresInDays,
    });
    if (error) throw new Error(error.message);
    const row = data[0];
    if (!row) throw new Error("The project token was not issued.");
    return { ...rowToProjectToken(row), token: row.token };
  }

  async revokeProjectToken(tokenId: string) {
    const { data, error } = await requireSupabaseClient().rpc("revoke_project_token", { p_token_id: tokenId });
    if (error) throw new Error(error.message);
    const row = data[0];
    if (!row) throw new Error("The project token was not found.");
    return rowToProjectToken(row);
  }

  async bootstrapWorkspace(input: { organizationName: string; organizationSlug: string; projectName: string; projectSlug: string }) {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc("bootstrap_workspace", { p_organization_name: input.organizationName, p_organization_slug: input.organizationSlug, p_project_name: input.projectName, p_project_slug: input.projectSlug });
    if (error) throw error;
    const row = data[0];
    return { id: row.project_id, organizationId: row.organization_id, slug: row.project_slug, name: input.projectName, role: "admin" as const };
  }
}
