import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowClockwise } from "@phosphor-icons/react/ArrowClockwise";
import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import type { Candidate, ReviewQueueItem } from "../domain/types";
import { SvgIcon } from "../components/IconPreview";
import { MotionCheck } from "../components/MotionCheck";
import { Dialog } from "../components/Dialog";
import { PageIntro, RouteLoading } from "../components/Layout";
import { reviewFeedbackForRevision } from "../services/reviewQueue";
import { useAppState } from "../state/AppState";
import { useAuthState } from "../state/AuthState";
import { isSupabaseMode } from "../services/dataMode";

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";
}
function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}
function Pair({
  candidate,
  size = 32,
}: {
  candidate: Candidate | null;
  size?: number;
}) {
  return (
    <span className="inline-pair">
      {(["regular", "solid"] as const).map((variant) =>
        candidate?.variants[variant] ? (
          <SvgIcon
            key={variant}
            svg={candidate.variants[variant]!}
            size={size}
          />
        ) : (
          <span key={variant} className="asset-unavailable">
            {variant} not supplied
          </span>
        ),
      )}
    </span>
  );
}

function ReviewQueue({
  items,
  refreshing,
  refresh,
}: {
  items: ReviewQueueItem[];
  refreshing: boolean;
  refresh: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const { projectSlug = "core" } = useParams();
  const query = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (status === "all" || item.proposal.status === status) &&
          [
            item.draft.name,
            item.proposal.id,
            item.revisions.at(-1)?.candidate.name ?? "",
          ].some((value) => value.toLowerCase().includes(query.toLowerCase())),
      ),
    [items, query, status],
  );
  return (
    <>
      <PageIntro
        title="Review queue"
        aside={
          <button
            className="secondary-action"
            onClick={refresh}
            disabled={refreshing}
          >
            <ArrowClockwise size={16} />
            {refreshing ? "Refreshing…" : "Refresh queue"}
          </button>
        }
      >
        Every submitted pair, with its exact candidate, revision and received
        time.
      </PageIntro>
      <div className="queue-filter-toolbar">
        <label className="workspace-search">
          <MagnifyingGlass size={17} />
          <input
            aria-label="Search review queue"
            placeholder="Search icons or proposal IDs…"
            value={query}
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
        <label>
          <span className="sr-only">Proposal status</span>
          <select
            aria-label="Proposal status"
            value={status}
            onChange={(event) =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                next.set("status", event.target.value);
                return next;
              })
            }
          >
            {[
              "all",
              "in_review",
              "changes_requested",
              "approved",
              "rejected",
              "published",
            ].map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All submissions" : statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="queue-result-count" role="status">
        {filtered.length} submissions ·{" "}
        {items.filter((item) => item.proposal.status === "in_review").length}{" "}
        awaiting review
      </p>
      <div className="proposal-queue">
        <div className="proposal-queue-columns" aria-hidden="true">
          <span>Icon / candidate</span>
          <span>Status</span>
          <span>Received</span>
          <span>Proposal</span>
        </div>
        {filtered.map((item) => {
          const revision = item.revisions.at(-1);
          return (
            <Link
              key={item.databaseProposalId}
              className="proposal-queue-row"
              to={`/projects/${projectSlug}/review/${item.proposal.id}`}
            >
              <div className="queue-pair-name">
                <Pair candidate={revision?.candidate ?? null} size={28} />
                <div>
                  <strong>{item.draft.name}</strong>
                  <span>
                    {revision?.candidate.name ?? "Candidate unavailable"} ·
                    Revision {revision?.sequence ?? 1} · Regular + Solid
                  </span>
                </div>
              </div>
              <span className="status-label">
                {statusLabel(item.proposal.status)}
              </span>
              <time dateTime={item.proposal.submittedAt ?? item.updatedAt}>
                {formatDate(item.proposal.submittedAt ?? item.updatedAt)}
              </time>
              <span className="queue-proposal-id">
                {item.proposal.id}
                <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
        {!filtered.length && (
          <div className="workspace-empty">
            <CheckCircle size={28} />
            <strong>
              {items.length
                ? "No matching submissions"
                : "Nothing waiting for review"}
            </strong>
            <p>
              {items.length
                ? "Try another search or status filter."
                : "Validated pairs appear here when an author submits them."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function ComparisonCell({
  candidate,
  variant,
  empty,
}: {
  candidate: Candidate | null;
  variant: "regular" | "solid";
  empty: string;
}) {
  return (
    <div className="comparison-specimen">
      {candidate?.variants[variant] ? (
        <SvgIcon svg={candidate.variants[variant]!} size={86} />
      ) : (
        <span>{empty}</span>
      )}
    </div>
  );
}

function ReviewDetail({ item }: { item: ReviewQueueItem }) {
  const {
    role,
    addComment,
    toggleComment,
    requestChanges,
    approveProposal,
    rejectProposal,
  } = useAppState();
  const { user } = useAuthState();
  const { projectSlug = "core" } = useParams();
  const [revisionId, setRevisionId] = useState(item.revisions.at(-1)?.id ?? "");
  useEffect(() => {
    setRevisionId(item.revisions.at(-1)?.id ?? "");
  }, [item.proposal.candidateId, item.revisions.length]);
  const [newComment, setNewComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<
    "approve" | "request_changes" | "reject" | null
  >(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("comparison");
  const revisionIndex = Math.max(
    0,
    item.revisions.findIndex((revision) => revision.id === revisionId),
  );
  const revision = item.revisions[revisionIndex];
  const previousRevision = item.revisions[revisionIndex - 1];
  const previous = previousRevision?.candidate ?? item.baselineCandidate;
  const proposed = revision?.candidate ?? null;
  const latest = revisionIndex === item.revisions.length - 1;
  const hasPair = Boolean(
    proposed?.variants.regular && proposed.variants.solid,
  );
  const isAuthor = isSupabaseMode && item.authorId === user?.id;
  const canDecide =
    item.proposal.status === "in_review" &&
    latest &&
    role !== "contributor" &&
    !isAuthor;
  const canDiscuss =
    role !== "contributor" && item.proposal.status === "in_review";
  const proposal = item.proposal;
  const sendComment = async (event: FormEvent) => {
    event.preventDefault();
    setCommentBusy(true);
    setError("");
    try {
      if (await addComment(newComment, proposal.id)) setNewComment("");
      else
        setError("Your note was not saved. The text is retained; try again.");
    } finally {
      setCommentBusy(false);
    }
  };
  const decide = async (event: FormEvent) => {
    event.preventDefault();
    if (!decision || !canDecide) return;
    setDecisionBusy(true);
    setError("");
    try {
      const accepted =
        decision === "approve"
          ? await approveProposal(decisionNote, proposal.id)
          : decision === "request_changes"
            ? await requestChanges(decisionNote, proposal.id)
            : await rejectProposal(decisionNote, proposal.id);
      if (accepted) {
        setDecision(null);
        setDecisionNote("");
      } else
        setError(
          "Decision could not be saved. Your note is retained; retry after checking your connection.",
        );
    } finally {
      setDecisionBusy(false);
    }
  };
  return (
    <section className="proposal-detail">
      <Link
        className="review-breadcrumb"
        to={`/projects/${projectSlug}/review`}
      >
        <ArrowLeft size={14} />
        Review queue <span>/</span>
        <code>{proposal.id}</code>
      </Link>
      <header className="proposal-heading">
        <div>
          <h1>{item.draft.name}</h1>
          <p>
            {proposed?.name ?? "Unavailable"} · Revision{" "}
            {revision?.sequence ?? 1} · Submitted{" "}
            {formatDate(revision?.submittedAt ?? proposal.submittedAt)}
          </p>
        </div>
        <span className="status-label">{statusLabel(proposal.status)}</span>
        <button
          className="secondary-action"
          onClick={() => setDetailsOpen(true)}
        >
          View provenance
        </button>
      </header>
      <nav className="review-mobile-tabs" aria-label="Review sections">
        {["comparison", "discussion", "history"].map((tab) => (
          <button
            key={tab}
            aria-pressed={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className={`focused-review-grid mobile-${mobileTab}`}>
        <div className="review-comparison-column">
          <section className="comparison-section">
            <header>
              <div>
                <h2>Compare submissions</h2>
                <p>
                  {previousRevision
                    ? "Baseline is a prior submission, not a published release."
                    : previous
                      ? "Baseline is the current published release."
                      : "New icon — no preceding submission or published baseline."}
                </p>
              </div>
              <span className="status-label">
                {hasPair ? "Pair complete" : "Pair incomplete"}
              </span>
            </header>
            <div className="paired-comparison">
              <div className="comparison-header">
                <span />
                <div>
                  <strong>
                    {previousRevision
                      ? `R${previousRevision.sequence} / ${previous?.name}`
                      : previous
                        ? `Published / ${previous.name}`
                        : "No baseline"}
                  </strong>
                  <small>
                    {previousRevision
                      ? "Previous submission"
                      : previous
                        ? "Current release"
                        : "New icon"}
                  </small>
                </div>
                <div>
                  <strong>
                    R{revision?.sequence ?? 1} /{" "}
                    {proposed?.name ?? "Unavailable"}
                  </strong>
                  <small>
                    {latest ? "Current submission" : "Historical submission"}
                  </small>
                </div>
              </div>
              {(["regular", "solid"] as const).map((variant) => (
                <div className="comparison-row" key={variant}>
                  <div className="comparison-row-label">
                    <strong>
                      {variant === "regular" ? "Regular" : "Solid"}
                    </strong>
                    <small>24 × 24</small>
                  </div>
                  <ComparisonCell
                    candidate={previous}
                    variant={variant}
                    empty="No baseline variant"
                  />
                  <ComparisonCell
                    candidate={proposed}
                    variant={variant}
                    empty="Not supplied"
                  />
                </div>
              ))}
            </div>
            <div className="review-size-proof">
              <strong>16 px proof</strong>
              <span>
                {previousRevision
                  ? `R${previousRevision.sequence}`
                  : "Baseline"}
              </span>
              <Pair candidate={previous} size={16} />
              <span>R{revision?.sequence ?? 1}</span>
              <Pair candidate={proposed} size={16} />
            </div>
          </section>
          <section className="submission-history">
            <h2>Submission history</h2>
            <div>
              {item.revisions.map((snapshot, index) => (
                <button
                  key={snapshot.id}
                  aria-pressed={revision?.id === snapshot.id}
                  onClick={() => {
                    setRevisionId(snapshot.id);
                    setMobileTab("comparison");
                  }}
                >
                  <Pair candidate={snapshot.candidate} size={24} />
                  <span>
                    <strong>
                      R{snapshot.sequence} · {snapshot.candidate.name}
                      {index === item.revisions.length - 1 ? " / Latest" : ""}
                    </strong>
                    <small>{formatDate(snapshot.submittedAt)}</small>
                    {reviewFeedbackForRevision(item, index) && (
                      <small>
                        Changes were requested after this submission
                      </small>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <details className="optional-motion">
            <summary>Optional motion inspection</summary>
            <MotionCheck
              previous={previous}
              proposed={proposed}
              previousLabel={
                previousRevision
                  ? `Revision ${previousRevision.sequence}`
                  : "Baseline"
              }
              proposedLabel={`Revision ${revision?.sequence ?? 1}`}
            />
          </details>
        </div>
        <aside className="proposal-discussion">
          <header>
            <h2>Discussion</h2>
            <p>Proposal-level · shared across revisions</p>
          </header>
          <div className="proposal-thread">
            {proposal.comments.map((comment) => (
              <article
                key={comment.id}
                className={
                  comment.resolved ? "proposal-note resolved" : "proposal-note"
                }
              >
                <strong>{comment.title}</strong>
                <small>
                  {comment.author.slice(0, 12)} · {comment.time}
                </small>
                <p>{comment.text}</p>
                <button
                  disabled={!canDiscuss}
                  className="text-action"
                  onClick={() => void toggleComment(comment.id, proposal.id)}
                >
                  {comment.resolved
                    ? "Reopen discussion"
                    : "Resolve discussion"}
                </button>
              </article>
            ))}
            {item.decisions.map((event) => (
              <article className="proposal-note" key={event.id}>
                <strong>{statusLabel(event.decision)}</strong>
                <small>{formatDate(event.createdAt)}</small>
                <p>{event.body || "No decision note was added."}</p>
              </article>
            ))}
            {!proposal.comments.length && !item.decisions.length && (
              <p className="empty-discussion">
                No discussion yet. Add context before recording a decision.
              </p>
            )}
          </div>
          <form
            className="proposal-comment-form"
            onSubmit={(event) => void sendComment(event)}
          >
            <label className="sr-only" htmlFor="proposal-comment">
              Proposal comment
            </label>
            <textarea
              id="proposal-comment"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Add a proposal comment…"
              disabled={!canDiscuss || commentBusy}
            />
            <button
              className="secondary-action"
              disabled={!newComment.trim() || !canDiscuss || commentBusy}
            >
              {commentBusy ? "Adding…" : "Add comment"}
            </button>
          </form>
          {error && !decision && (
            <p role="alert" className="inline-request-error">
              {error}
            </p>
          )}
        </aside>
      </div>
      <footer className="review-decision-footer">
        <div>
          <strong>
            {proposal.status === "approved"
              ? "Approved — awaiting publication"
              : proposal.status === "published"
                ? "Published release"
                : `Review revision ${revision?.sequence ?? 1}`}
          </strong>
          <p>
            {!latest
              ? "Historical view. Select the latest revision to record a decision."
              : isAuthor
                ? "A different reviewer must review your proposal."
                : role === "contributor"
                  ? "Reviewer or admin access is required to record a decision."
                  : "Approval does not publish this icon."}
          </p>
        </div>
        {proposal.status === "published" ? (
          <Link
            className="secondary-action"
            to={`/explore?library=projects&q=${encodeURIComponent(item.draft.name)}`}
          >
            View release
          </Link>
        ) : proposal.status === "approved" ? (
          <Link
            className="primary-action"
            to={`/projects/${projectSlug}/workspace`}
          >
            Open Workspace <ArrowRight size={16} />
          </Link>
        ) : (
          <div>
            <button
              className="text-action"
              disabled={!canDecide}
              onClick={() => setDecision("reject")}
            >
              Reject
            </button>
            <button
              className="secondary-action"
              disabled={!canDecide}
              onClick={() => setDecision("request_changes")}
            >
              Request changes
            </button>
            <button
              className="primary-action"
              disabled={!canDecide || !hasPair || Boolean(proposed?.issue)}
              onClick={() => setDecision("approve")}
            >
              Approve pair
            </button>
          </div>
        )}
      </footer>
      {decision && (
        <Dialog
          title={
            decision === "approve"
              ? "Approve this pair?"
              : decision === "request_changes"
                ? "Request changes"
                : "Reject proposal"
          }
          onClose={() => {
            if (!decisionBusy) setDecision(null);
          }}
        >
          <p>
            {proposed?.name} · Revision {revision?.sequence} · Regular + Solid ·
            Target v{proposal.targetVersion}
          </p>
          <p>
            {decision === "approve"
              ? "This records a review decision. An administrator must separately publish the immutable release."
              : "Your decision and note are recorded in proposal history. The author keeps the submitted geometry."}
          </p>
          <form onSubmit={(event) => void decide(event)}>
            <label>
              Decision note{" "}
              {decision === "approve" ? "(optional)" : "(required)"}
              <textarea
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                required={decision !== "approve"}
                minLength={decision === "approve" ? undefined : 10}
              />
            </label>
            {decision !== "approve" && <small>At least 10 characters.</small>}
            {error && <p role="alert">{error}</p>}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-action"
                disabled={decisionBusy}
                onClick={() => setDecision(null)}
              >
                Cancel
              </button>
              <button
                className="primary-action"
                disabled={
                  decisionBusy ||
                  (decision !== "approve" && decisionNote.trim().length < 10)
                }
              >
                {decisionBusy
                  ? "Recording…"
                  : decision === "approve"
                    ? "Approve pair"
                    : decision === "request_changes"
                      ? "Send to author"
                      : "Reject proposal"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {detailsOpen && (
        <Dialog
          title="Submission provenance"
          onClose={() => setDetailsOpen(false)}
        >
          <dl className="inspector-facts">
            <div>
              <dt>Proposal</dt>
              <dd>{proposal.id}</dd>
            </div>
            <div>
              <dt>Candidate</dt>
              <dd>{proposed?.id ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Author</dt>
              <dd>{item.authorId}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{revision?.sequence}</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>{proposed?.provenance.kind}</dd>
            </div>
            <div>
              <dt>Adapter</dt>
              <dd>{proposed?.provenance.model}</dd>
            </div>
            <div>
              <dt>Licence</dt>
              <dd>Project asset licence (MIT)</dd>
            </div>
            <div>
              <dt>Prompt hash</dt>
              <dd>
                {proposed?.provenance.promptHash ?? "No retained prompt hash"}
              </dd>
            </div>
          </dl>
        </Dialog>
      )}
    </section>
  );
}

export function ReviewPage() {
  const { reviewQueue, backendLoading, backendError, refreshWorkspace } =
    useAppState();
  const { projectSlug = "core", proposalId } = useParams();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const selected = proposalId
    ? (reviewQueue.find(
        (item) =>
          item.proposal.id === proposalId ||
          item.databaseProposalId === proposalId,
      ) ??
      (proposalId === "current"
        ? (reviewQueue.find((item) => item.proposal.status === "in_review") ??
          reviewQueue[0])
        : undefined))
    : undefined;
  const refresh = async () => {
    setRefreshing(true);
    setRefreshError("");
    try {
      await refreshWorkspace();
    } catch {
      setRefreshError(
        "The queue could not refresh. Previously verified submissions are retained.",
      );
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    const onFocus = () => {
      void refreshWorkspace().catch(() => undefined);
    };
    const interval = window.setInterval(onFocus, 15_000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshWorkspace]);
  if (backendLoading && !reviewQueue.length)
    return <RouteLoading label="Loading review queue" />;
  return (
    <main
      className={`page-shell review-page${proposalId ? " review-detail-page" : ""}`}
    >
      {backendError ? (
        <>
          <PageIntro title="Review unavailable">
            Protected project data could not be verified.
          </PageIntro>
          <p role="alert">{backendError}</p>
          <Link to={`/projects/${projectSlug}/workspace`}>
            Back to Workspace
          </Link>
        </>
      ) : proposalId ? (
        selected ? (
          <ReviewDetail key={selected.databaseProposalId} item={selected} />
        ) : (
          <>
            <PageIntro title="Proposal not found">
              This link does not identify an available proposal in this project.
            </PageIntro>
            <Link to={`/projects/${projectSlug}/review`}>
              Back to Review queue
            </Link>
          </>
        )
      ) : (
        <ReviewQueue
          items={reviewQueue}
          refreshing={refreshing}
          refresh={() => void refresh()}
        />
      )}
      {refreshError && (
        <p className="inline-request-error" role="alert">
          {refreshError}
        </p>
      )}
    </main>
  );
}
