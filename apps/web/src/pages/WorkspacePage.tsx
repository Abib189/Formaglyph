import { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  Copy,
  DownloadSimple,
  MagnifyingGlass,
  NotePencil,
  Plus,
  RocketLaunch,
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
  published: "Published",
  archived: "Archived",
};

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function WorkspaceRow({ icon, onNavigate, role }: { icon: WorkspaceIcon; onNavigate: (route: RouteName) => void; role: "contributor" | "reviewer" | "admin" }) {
  const { openWorkspaceIcon, updateWorkspaceStatus, duplicateWorkspaceIcon } = useAppState();
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
        {icon.status !== "archived" && <button className="icon-action" onClick={() => duplicateWorkspaceIcon(icon.id)} aria-label={`Duplicate ${icon.name}`} title="Duplicate"><Copy size={15} /></button>}
        {icon.status !== "archived" && <button className="icon-action" onClick={exportIcon} aria-label={`Export ${icon.name}`} title="Export SVG"><DownloadSimple size={15} /></button>}
        <button className="icon-action" onClick={() => updateWorkspaceStatus(icon.id, icon.status === "archived" ? "draft" : "archived")} aria-label={`${icon.status === "archived" ? "Restore" : "Archive"} ${icon.name}`} title={icon.status === "archived" ? "Restore as draft" : "Archive"}><Archive size={15} /></button>
      </div>
    </article>
  );
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

  const activeCount = state.workspace.filter((icon) => icon.status !== "archived").length;
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
      <PageFooter dark={dark} />
    </main>
  );
}
