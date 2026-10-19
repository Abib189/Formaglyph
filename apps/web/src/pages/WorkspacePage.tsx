import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Archive } from "@phosphor-icons/react/Archive";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { Plus } from "@phosphor-icons/react/Plus";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { iconResults, workspaceIconLibrary } from "../data/catalog";
import type { WorkspaceIcon, WorkspaceStatus } from "../domain/types";
import { SvgIcon } from "../components/IconPreview";
import { Dialog } from "../components/Dialog";
import { PageFooter, PageIntro } from "../components/Layout";
import { downloadSvg } from "../services/svg";
import { useAppState } from "../state/AppState";
import { useAuthState } from "../state/AuthState";
import { isSupabaseMode } from "../services/dataMode";
import type { RouteName } from "../domain/types";

const labels: Record<string, string> = {
  all: "All icons",
  draft: "Drafts",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  deprecated: "Deprecated",
  archived: "Archived",
};
function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function WorkspaceRow({ icon }: { icon: WorkspaceIcon }) {
  const {
    reviewQueue,
    role,
    openWorkspaceIcon,
    updateWorkspaceStatus,
    reopenApprovedProposal,
  } = useAppState();
  const { user } = useAuthState();
  const { projectSlug = "core" } = useParams();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<
    "publish" | "archive" | "deprecate" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const proposal = reviewQueue.find(
    (item) =>
      item.draft.workspaceIconId === icon.id &&
      (icon.status !== "approved" || item.proposal.status === "approved"),
  );
  const candidate = proposal?.revisions.at(-1)?.candidate;
  const fixture = !isSupabaseMode
    ? iconResults.find(
        (item) => item.name === icon.visualKey && item.variant === icon.variant,
      )
    : null;
  const svg = candidate?.variants[icon.variant] ?? fixture?.svg;
  const DemoIcon = !isSupabaseMode
    ? workspaceIconLibrary[icon.visualKey as keyof typeof workspaceIconLibrary]
    : null;
  const pair = Boolean(candidate?.variants.regular && candidate.variants.solid);
  const canEdit = !isSupabaseMode || icon.creatorId === user?.id;
  const edit = () => {
    if (!isSupabaseMode) openWorkspaceIcon(icon.id);
    navigate(
      `/projects/${projectSlug}/create?draft=${encodeURIComponent(icon.id)}`,
    );
  };
  const act = async () => {
    setBusy(true);
    setError("");
    try {
      const ok = await updateWorkspaceStatus(
        icon.id,
        confirm === "publish"
          ? "published"
          : confirm === "deprecate"
            ? "deprecated"
            : icon.status === "archived"
              ? "draft"
              : "archived",
        reason,
        proposal?.proposal.id,
      );
      if (ok) setConfirm(null);
      else
        setError(
          "The action could not be verified. Your records are retained; refresh before retrying.",
        );
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="workspace-row">
      <div className="workspace-glyph">
        {svg ? (
          <SvgIcon svg={svg} size={28} />
        ) : DemoIcon ? (
          <DemoIcon size={28} />
        ) : (
          <span className="asset-unavailable">SVG</span>
        )}
      </div>
      <div className="workspace-name">
        <strong>{icon.name}</strong>
        <span>
          {candidate
            ? `${candidate.name} · R${proposal?.revisions.at(-1)?.sequence ?? 1}`
            : icon.status === "published"
              ? `Release ${icon.version}`
              : icon.project}
        </span>
      </div>
      <div className="workspace-status">
        <span className="status-label">{labels[icon.status]}</span>
      </div>
      <div className="workspace-meta">
        <time dateTime={icon.updatedAt}>{date(icon.updatedAt)}</time>
        <span>{icon.creator}</span>
      </div>
      <div className="workspace-actions">
        {(icon.status === "draft" || icon.status === "changes_requested") &&
          (canEdit ? (
            <button className="secondary-action" onClick={edit}>
              Continue draft
            </button>
          ) : (
            <span className="permission-note">Author edit</span>
          ))}
        {icon.status === "in_review" && (
          <Link
            className="secondary-action"
            to={`/projects/${projectSlug}/review${proposal ? `/${proposal.proposal.id}` : ""}`}
          >
            Open proposal
          </Link>
        )}
        {icon.status === "approved" &&
          role === "admin" &&
          (pair ? (
            <button
              className="primary-action"
              onClick={() => setConfirm("publish")}
            >
              Publish…
            </button>
          ) : proposal ? (
            <button
              className="secondary-action"
              onClick={() => void reopenApprovedProposal(proposal.proposal.id)}
            >
              Return for pair
            </button>
          ) : (
            <span className="permission-note">Open Review to verify pair</span>
          ))}
        {icon.status === "approved" && role !== "admin" && (
          <span className="permission-note">Admin publication required</span>
        )}
        {(icon.status === "published" || icon.status === "deprecated") && (
          <Link
            className="secondary-action"
            to={`/explore?library=projects&q=${encodeURIComponent(icon.name)}`}
          >
            View release
          </Link>
        )}
        <details className="workspace-row-menu">
          <summary aria-label={`More actions for ${icon.name}`}>
            <SlidersHorizontal size={16} />
          </summary>
          <div>
            {svg && (
              <button
                onClick={() =>
                  downloadSvg(`${icon.name}-${icon.variant}.svg`, svg)
                }
              >
                <DownloadSimple size={15} />
                Download SVG
              </button>
            )}
            {icon.status === "published" && role === "admin" && (
              <button onClick={() => setConfirm("deprecate")}>
                Deprecate release
              </button>
            )}
            {!isSupabaseMode &&
              canEdit &&
              icon.status !== "published" &&
              icon.status !== "deprecated" && (
                <button onClick={() => setConfirm("archive")}>
                  <Archive size={15} />
                  {icon.status === "archived"
                    ? "Restore draft"
                    : "Archive draft"}
                </button>
              )}
          </div>
        </details>
      </div>
      {confirm && (
        <Dialog
          title={
            confirm === "publish"
              ? "Publish this pair?"
              : confirm === "deprecate"
                ? "Deprecate release?"
                : icon.status === "archived"
                  ? "Restore draft?"
                  : "Archive draft?"
          }
          onClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <p>
            <strong>{icon.name}</strong> · {candidate?.name ?? "Stored draft"} ·
            v{proposal?.proposal.targetVersion ?? icon.version}
          </p>
          <p>
            {confirm === "publish"
              ? isSupabaseMode
                ? "Regular and Solid will be published together at immutable, content-addressed URLs. Approval is already recorded. The server verifies admin access and the complete pair again."
                : "This publishes the reviewed pair in this browser's local demo. No hosted release or immutable Storage URL is created. Approval stays recorded separately."
              : confirm === "deprecate"
                ? "The immutable release stays available by its URL. Record why it should no longer be used."
                : "This changes the workspace lifecycle state; the history is retained."}
          </p>
          {confirm === "deprecate" && (
            <label>
              Reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            <button
              className="secondary-action"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={
                busy || (confirm === "deprecate" && reason.trim().length < 10)
              }
              onClick={() => void act()}
            >
              {busy
                ? "Confirming…"
                : confirm === "publish"
                  ? "Publish Regular + Solid"
                  : "Confirm"}
            </button>
          </div>
        </Dialog>
      )}
    </article>
  );
}

export function WorkspacePage({
  onNavigate,
  dark,
}: {
  onNavigate: (route: RouteName) => void;
  dark: boolean;
}) {
  const { state, project, backendLoading, backendError, role, startNewDraft } =
    useAppState();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const filter = params.get("status") ?? "all";
  const filtered = useMemo(
    () =>
      state.workspace.filter(
        (icon) =>
          (filter === "all" || icon.status === filter) &&
          [icon.name, icon.project, ...icon.tags].some((value) =>
            value.toLowerCase().includes(query.toLowerCase()),
          ),
      ),
    [state.workspace, filter, query],
  );
  const setFilter = (status: string) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      status === "all" ? next.delete("status") : next.set("status", status);
      return next;
    });
  return (
    <main className="page-shell workspace-page">
      <span className="workspace-project-label">
        {project?.name ?? "Project workspace"} / Team workspace
      </span>
      <PageIntro
        title="Your icon workspace"
        aside={
          <button
            className="primary-action"
            onClick={() => {
              startNewDraft();
              onNavigate("create");
            }}
          >
            <Plus size={16} />
            New icon
          </button>
        }
      >
        From the first draft to the next immutable release.
      </PageIntro>
      <div className="workspace-filter-strip">
        <nav className="workspace-tabs" aria-label="Workspace status">
          {["all", "draft", "in_review", "published"].map((status) => (
            <button
              key={status}
              aria-pressed={filter === status}
              className={filter === status ? "active" : ""}
              onClick={() => setFilter(status)}
            >
              {labels[status]}{" "}
              <small>
                {status === "all"
                  ? state.workspace.length
                  : state.workspace.filter((icon) => icon.status === status)
                      .length}
              </small>
            </button>
          ))}
        </nav>
        <label className="workspace-inline-search">
          <MagnifyingGlass size={16} />
          <input
            aria-label="Search workspace"
            type="search"
            value={query}
            placeholder="Search your icons…"
            onChange={(event) =>
              setParams(
                (current) => {
                  const next = new URLSearchParams(current);
                  event.target.value
                    ? next.set("q", event.target.value)
                    : next.delete("q");
                  return next;
                },
                { replace: true },
              )
            }
          />
        </label>
        <label className="workspace-more-filter">
          <span className="sr-only">More lifecycle filters</span>
          <select
            aria-label="More lifecycle filters"
            value={
              ["all", "draft", "in_review", "published"].includes(filter)
                ? "more"
                : filter
            }
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="more" disabled>
              More filters
            </option>
            {[
              "changes_requested",
              "approved",
              "rejected",
              "deprecated",
              "archived",
            ].map((status) => (
              <option key={status} value={status}>
                {labels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="workspace-columns" aria-hidden="true">
        <span />
        <span>Icon</span>
        <span>State</span>
        <span>Last activity</span>
        <span>Next step</span>
      </div>
      <div className="workspace-list">
        {backendLoading ? (
          <div className="workspace-empty" role="status">
            Restoring project records…
          </div>
        ) : backendError ? (
          <div className="workspace-empty" role="alert">
            <strong>Workspace unavailable</strong>
            <p>{backendError}</p>
          </div>
        ) : filtered.length ? (
          filtered.map((icon) => <WorkspaceRow key={icon.id} icon={icon} />)
        ) : (
          <div className="workspace-empty">
            <MagnifyingGlass size={28} />
            <strong>
              {state.workspace.length
                ? "No icons match this view"
                : "Start with your first icon pair"}
            </strong>
            <p>
              {state.workspace.length
                ? "Change the status or search filter."
                : "Import original Regular and Solid SVGs, then send the pair for human review."}
            </p>
            <button
              className="secondary-action"
              onClick={() => {
                setParams({});
                if (!state.workspace.length) {
                  startNewDraft();
                  onNavigate("create");
                }
              }}
            >
              {" "}
              {state.workspace.length ? "Show all icons" : "Create icon"}
            </button>
          </div>
        )}
      </div>
      <p className="workspace-permission-note">
        Only admins can publish. Approval is recorded separately from release.
      </p>
      <details className="governance-disclosure">
        <summary>Release & audit history</summary>
        {role === "contributor" ? (
          <p className="microcopy">
            Reviewer or admin access is required for governance history.
          </p>
        ) : (
          <div className="governance-grid">
            <section>
              <header>
                <strong>Release changelog</strong>
                <span>{state.releaseEntries.length} versions</span>
              </header>
              <div className="release-log">
                {state.releaseEntries.slice(0, 12).map((entry) => (
                  <article key={entry.id}>
                    <div>
                      <strong>{entry.iconName}</strong>
                      <span>
                        v{entry.version} / {entry.variant}
                      </span>
                    </div>
                    <code>{entry.contentHash.slice(0, 12)}</code>
                    <time>{date(entry.occurredAt)}</time>
                    {entry.reason && <p>{entry.reason}</p>}
                  </article>
                ))}
              </div>
              {!state.releaseEntries.length && (
                <p className="microcopy">No immutable releases yet.</p>
              )}
            </section>
            <section>
              <header>
                <strong>Audit trail</strong>
                <span>{state.auditEvents.length} events</span>
              </header>
              <div className="audit-log">
                {state.auditEvents.slice(0, 12).map((event) => (
                  <article key={event.id}>
                    <strong>{event.action.replaceAll(".", " ")}</strong>
                    <small>{event.actorId?.slice(0, 8) ?? "System"}</small>
                    <time>{date(event.occurredAt)}</time>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </details>
      <PageFooter dark={dark} />
    </main>
  );
}
