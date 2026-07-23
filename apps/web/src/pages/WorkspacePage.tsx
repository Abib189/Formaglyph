import { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  Copy,
  DownloadSimple,
  MagnifyingGlass,
  NotePencil,
  Prohibit,
  Plus,
  RocketLaunch,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import { CloudArrowUp } from "@phosphor-icons/react";
import { workspaceIconLibrary } from "../data/catalog";
import type { RouteName, WorkspaceIcon, WorkspaceStatus } from "../domain/types";
import { PageFooter, PageIntro, Panel, PanelHeader } from "../components/Layout";
import { downloadSvg, renderIconSvg } from "../services/svg";
import { useAppState } from "../state/AppState";

type WorkspaceFilter = "all" | WorkspaceStatus;

const statusLabels: Record<WorkspaceFilter, string> = {
  all: "All",
  draft: "Drafts",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  deprecated: "Deprecated",
  archived: "Archived",
};

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function WorkspaceRow({ icon, onNavigate, role }: { icon: WorkspaceIcon; onNavigate: (route: RouteName) => void; role: "contributor" | "reviewer" | "admin" }) {
  const { openWorkspaceIcon, updateWorkspaceStatus, duplicateWorkspaceIcon } = useAppState();
  const [deprecating, setDeprecating] = useState(false);
  const [deprecationReason, setDeprecationReason] = useState("");
  const Icon = workspaceIconLibrary[icon.visualKey as keyof typeof workspaceIconLibrary] ?? CloudArrowUp;

  const open = (route: RouteName) => {
    openWorkspaceIcon(icon.id);
    onNavigate(route);
  };

  const exportIcon = () => downloadSvg(`${icon.name}.svg`, renderIconSvg(Icon, icon.variant === "solid" ? "fill" : "regular"));

  return (
    <article className="workspace-row">
      <div className="workspace-glyph"><Icon size={36} weight={icon.variant === "solid" ? "fill" : "regular"} /></div>
      <div className="workspace-name"><strong>{icon.name}</strong><span>{icon.project}</span></div>
      <div className="workspace-status"><span className={`status-label status-${icon.status}`}>{statusLabels[icon.status]}</span><small>{icon.validation === "passed" ? "Validation passed" : "Validation issue"}</small></div>
      <div className="workspace-meta"><span>{icon.variant}</span><span>{icon.creator}</span><span>{formatUpdated(icon.updatedAt)}</span></div>
      <div className="workspace-actions">
        {(icon.status === "draft" || icon.status === "changes_requested") && <button onClick={() => open("create")}><NotePencil size={15} /> Edit</button>}
        {icon.status === "in_review" && <button onClick={() => open("review")}><ArrowRight size={15} /> Review</button>}
        {icon.status === "approved" && role === "admin" && <button className="workspace-publish" onClick={() => void updateWorkspaceStatus(icon.id, "published")}><RocketLaunch size={15} /> Publish</button>}
        {icon.status === "approved" && role !== "admin" && <span className="permission-note">Admin publish</span>}
        {icon.status === "published" && <button onClick={() => { window.location.assign(`/explore?q=${encodeURIComponent(icon.name)}`); }}><ArrowRight size={15} /> Explore</button>}
        {icon.status === "published" && role === "admin" && <button className="workspace-deprecate" onClick={() => setDeprecating((current) => !current)}><Prohibit size={15} /> Deprecate</button>}
        {icon.status === "deprecated" && <span className="permission-note">Immutable release retained</span>}
        {icon.status !== "archived" && <button className="icon-action" onClick={() => duplicateWorkspaceIcon(icon.id)} aria-label={`Duplicate ${icon.name}`} title="Duplicate"><Copy size={15} /></button>}
        {icon.status !== "archived" && <button className="icon-action" onClick={exportIcon} aria-label={`Export ${icon.name}`} title="Export SVG"><DownloadSimple size={15} /></button>}
        {icon.status !== "published" && icon.status !== "deprecated" && <button className="icon-action" onClick={() => void updateWorkspaceStatus(icon.id, icon.status === "archived" ? "draft" : "archived")} aria-label={`${icon.status === "archived" ? "Restore" : "Archive"} ${icon.name}`} title={icon.status === "archived" ? "Restore as draft" : "Archive"}><Archive size={15} /></button>}
      </div>
      {deprecating && <form className="workspace-governance-form" onSubmit={(event) => { event.preventDefault(); void updateWorkspaceStatus(icon.id, "deprecated", deprecationReason); setDeprecating(false); setDeprecationReason(""); }}><label><span>Deprecation reason</span><textarea value={deprecationReason} onChange={(event) => setDeprecationReason(event.target.value)} placeholder="Explain the replacement or product decision" /></label><div><button type="button" onClick={() => setDeprecating(false)}>Cancel</button><button type="submit" className="danger-action" disabled={deprecationReason.trim().length < 10}><Prohibit size={16} />Confirm deprecation</button></div></form>}
    </article>
  );
}

function governanceLabel(action: string) {
  const labels: Record<string, string> = {
    "proposal.submitted": "Proposal submitted",
    "proposal.approved": "Proposal approved",
    "proposal.changes_requested": "Changes requested",
    "proposal.rejected": "Proposal rejected",
    "icon.published": "Icon published",
    "icon.deprecated": "Icon deprecated",
    "review.comment_added": "Review note added",
    "review.comment_resolved": "Review note resolved",
    "review.comment_reopened": "Review note reopened",
    "generation.started": "Generation started",
    "generation.completed": "Generation completed",
  };
  return labels[action] ?? action.replaceAll(".", " ");
}

export function WorkspacePage({ onNavigate, dark }: { onNavigate: (route: RouteName) => void; dark: boolean }) {
  const { state, backendLoading, backendError, role } = useAppState();
  const [filter, setFilter] = useState<WorkspaceFilter>("all");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("all");

  const projects = useMemo(() => ["all", ...new Set(state.workspace.map((icon) => icon.project))], [state.workspace]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.workspace.filter((icon) => filter === "all" || icon.status === filter)
      .filter((icon) => project === "all" || icon.project === project)
      .filter((icon) => !normalized || [icon.name, icon.label, icon.project, ...icon.tags].some((value) => value.toLowerCase().includes(normalized)));
  }, [filter, project, query, state.workspace]);

  const activeCount = state.workspace.filter((icon) => icon.status !== "archived" && icon.status !== "deprecated").length;
  const reviewCount = state.workspace.filter((icon) => icon.status === "in_review" || icon.status === "changes_requested").length;
  const publishedCount = state.workspace.filter((icon) => icon.status === "published").length;

  return (
    <main className="page-shell workspace-page">
      <PageIntro number="01" title="Your icon workspace." aside={<div className="workspace-summary"><div><strong>{activeCount}</strong><span>Active icons</span></div><div><strong>{reviewCount}</strong><span>Need attention</span></div><div><strong>{publishedCount}</strong><span>Published</span></div></div>}>
        Manage every icon your team creates, from first draft through review, release, export, and archive.
      </PageIntro>

      <div className="workspace-toolbar">
        <label className="workspace-search"><MagnifyingGlass size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search workspace" placeholder="Search your icons" />{query && <button onClick={() => setQuery("")} aria-label="Clear workspace search"><X size={15} /></button>}</label>
        <label className="workspace-project"><span>Project</span><select value={project} onChange={(event) => setProject(event.target.value)}>{projects.map((item) => <option key={item} value={item}>{item === "all" ? "All projects" : item}</option>)}</select></label>
        <button className="primary-action" onClick={() => onNavigate("create")}><Plus size={17} /> New icon</button>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Workspace status">
        {(Object.keys(statusLabels) as WorkspaceFilter[]).map((status) => {
          const count = status === "all" ? state.workspace.length : state.workspace.filter((icon) => icon.status === status).length;
          return <button key={status} role="tab" aria-selected={filter === status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}><span>{statusLabels[status]}</span><small>{count}</small></button>;
        })}
      </div>

      <Panel className="workspace-list-panel">
        <PanelHeader number="02" title={`Icons (${filtered.length})`} meta={backendLoading ? "SYNCING" : "PROJECT WORKSPACE"} />
        <div className="workspace-columns" aria-hidden="true"><span>Icon</span><span>Name / project</span><span>Status</span><span>Style / creator / updated</span><span>Actions</span></div>
        <div className="workspace-list">
          {backendLoading ? <div className="workspace-empty"><strong>Loading project records…</strong><p>Restoring drafts, proposals, and published versions.</p></div> : backendError ? <div className="workspace-empty"><strong>Workspace unavailable</strong><p>{backendError}</p></div> : filtered.length ? filtered.map((icon) => <WorkspaceRow key={icon.id} icon={icon} onNavigate={onNavigate} role={role} />) : <div className="workspace-empty"><MagnifyingGlass size={30} /><strong>No icons match this view.</strong><p>Change the status, project, or search filter.</p><button onClick={() => { setFilter("all"); setProject("all"); setQuery(""); }}>Clear filters</button></div>}
        </div>
      </Panel>
      <Panel className="governance-panel">
        <PanelHeader number="03" title="Release and audit" meta={role === "contributor" ? "REVIEWER ACCESS" : "IMMUTABLE HISTORY"} />
        {role === "contributor" ? <div className="governance-restricted"><ShieldCheck size={28} /><strong>Governance history is restricted</strong><p>Reviewers and administrators can inspect project audit events and release provenance.</p></div> : <div className="governance-grid">
          <section>
            <header><strong>Release changelog</strong><span>{state.releaseEntries.length} versions</span></header>
            <div className="release-log">{state.releaseEntries.slice(0, 6).map((entry) => <article key={entry.id}><div><strong>{entry.iconName}</strong><span>v{entry.version} / {entry.variant}</span></div><span className={`release-state ${entry.status}`}>{entry.status}</span><code>{entry.contentHash.slice(0, 12)}</code><time dateTime={entry.occurredAt}>{formatUpdated(entry.occurredAt)}</time>{entry.reason && <p>{entry.reason}</p>}</article>)}</div>
            {!state.releaseEntries.length && <div className="governance-empty">Published versions will appear here with their immutable content hash.</div>}
          </section>
          <section>
            <header><strong>Audit trail</strong><span>{state.auditEvents.length} events</span></header>
            <div className="audit-log">{state.auditEvents.slice(0, 6).map((event) => <article key={event.id}><span className="audit-action">{governanceLabel(event.action)}</span><strong>{event.targetType}</strong><small>{event.actorId ? event.actorId.slice(0, 8) : "system"} / {event.source}</small><time dateTime={event.occurredAt}>{formatUpdated(event.occurredAt)}</time></article>)}</div>
            {!state.auditEvents.length && <div className="governance-empty">No privileged activity has been recorded for this project.</div>}
          </section>
        </div>}
      </Panel>
      <PageFooter dark={dark} />
    </main>
  );
}
