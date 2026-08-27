import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowClockwise, ArrowRight, Check, Clock, GridFour, Package, Plus, XCircle } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import type { Candidate, PreviewWeight, ReviewQueueItem } from "../domain/types";
import { SvgIcon } from "../components/IconPreview";
import { MotionCheck } from "../components/MotionCheck";
import { Panel, PageIntro, PanelHeader, RouteLoading } from "../components/Layout";
import { reviewFeedbackForRevision, selectReviewComparison } from "../services/reviewQueue";
import { useAppState } from "../state/AppState";

function formatDate(value: string | null, includeTime = true) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", includeTime
    ? { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }
    : { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

function ReviewIconCell({ candidate, label, weight, changed = false }: { candidate: Candidate | null; label: string; weight: PreviewWeight; changed?: boolean }) {
  const svg = weight === "fill" ? candidate?.variants.solid : candidate?.variants.regular;
  return (
    <div className="review-icon-cell">
      <span>{label}</span>
      <div className="review-cell-pair">
        <div className="review-icon-stage plain-stage">{svg ? <SvgIcon svg={svg} size={86} /> : <small>Variant unavailable</small>}</div>
        <div className="review-icon-stage">
          <GridFour className="grid-asset" size={154} weight="thin" />
          {svg ? <SvgIcon svg={svg} size={78} /> : <small>Variant unavailable</small>}
          {changed && svg && <span className="change-pin">Changed</span>}
        </div>
      </div>
    </div>
  );
}

function ReviewQueue({ items, selected, onSelect }: { items: ReviewQueueItem[]; selected: ReviewQueueItem; onSelect: (item: ReviewQueueItem) => void }) {
  const awaiting = items.filter((item) => item.proposal.status === "in_review").length;
  const returned = items.filter((item) => item.proposal.status === "changes_requested").length;
  return (
    <Panel className="review-queue-panel">
      <PanelHeader number="01" title="Review queue" meta={`${items.length} TOTAL`} />
      <div className="queue-counts">
        <span><strong>{awaiting}</strong>Awaiting</span>
        <span><strong>{returned}</strong>Returned</span>
      </div>
      <div className="review-queue-list">
        {items.map((item) => {
          const latest = item.revisions.at(-1);
          const active = item.databaseProposalId === selected.databaseProposalId;
          return (
            <button key={item.databaseProposalId} className={active ? "review-queue-row active" : "review-queue-row"} onClick={() => onSelect(item)} aria-pressed={active}>
              <span className={`queue-status ${item.proposal.status}`}>{statusLabel(item.proposal.status)}</span>
              <strong>{item.draft.name}</strong>
              <small>{latest?.candidate.name ?? "Candidate unavailable"} / revision {latest?.sequence ?? 1}</small>
              <time dateTime={item.proposal.submittedAt ?? item.updatedAt}>{formatDate(item.proposal.submittedAt ?? item.updatedAt)}</time>
              <ArrowRight size={15} />
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function RevisionVariants({ candidate }: { candidate: Candidate }) {
  return (
    <div className="revision-variants" aria-label={`${candidate.name} Regular and Solid variants`}>
      <div>
        <span>Regular</span>
        {candidate.variants.regular ? <SvgIcon svg={candidate.variants.regular} size={52} /> : <small>Not captured</small>}
      </div>
      <div>
        <span>Solid</span>
        {candidate.variants.solid ? <SvgIcon svg={candidate.variants.solid} size={52} /> : <small>Not captured</small>}
      </div>
    </div>
  );
}

function RevisionHistory({ item }: { item: ReviewQueueItem }) {
  return (
    <Panel className="revision-panel">
      <PanelHeader number="02" title="Submission history" meta={`${item.revisions.length} REVISION${item.revisions.length === 1 ? "" : "S"}`} />
      <div className="revision-list">
        {item.baselineCandidate && (
          <article className="revision-card baseline">
            <span>Published baseline</span>
            <RevisionVariants candidate={item.baselineCandidate} />
            <strong>{item.baselineCandidate.name}</strong>
            <small>Current release</small>
          </article>
        )}
        {item.revisions.map((revision, index) => {
          const feedback = reviewFeedbackForRevision(item, index);
          return (
            <article className={index === item.revisions.length - 1 ? "revision-card current" : "revision-card"} key={revision.id}>
              <span>Revision {revision.sequence}</span>
              <RevisionVariants candidate={revision.candidate} />
              <strong>{revision.candidate.name}</strong>
              <small>{formatDate(revision.submittedAt)}</small>
              {feedback && <p><b>Returned:</b> {feedback.body}</p>}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function ReviewDetail({ item }: { item: ReviewQueueItem }) {
  const { role, addComment, toggleComment, requestChanges, approveProposal, rejectProposal } = useAppState();
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const { previous, proposed } = selectReviewComparison(item);
  const proposal = item.proposal;
  const approved = proposal.status === "approved" || proposal.status === "published";
  const changesRequested = proposal.status === "changes_requested";
  const rejected = proposal.status === "rejected";
  const latestRevision = item.revisions.at(-1);
  const releaseSteps = ["Submitted", "Validated", "In review", `v${proposal.targetVersion}`];
  const activeStep = approved ? 3 : changesRequested || rejected ? 1 : 2;
  const adapterLabel = proposed?.provenance.adapter === "manual_import" ? "Manual import" : proposed?.provenance.model ?? "Unknown";

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    await addComment(newComment, proposal.id);
    setNewComment("");
    setCommenting(false);
  };

  return (
    <section className="review-detail">
      <div className="review-detail-heading">
        <div>
          <span>{proposal.id}</span>
          <h2>{item.draft.name}</h2>
          <p>Compare the exact submitted SVG with the preceding revision or published baseline.</p>
        </div>
        <ol className="release-sequence">{releaseSteps.map((step, index) => (
          <li key={step} className={index === activeStep ? "active" : index < activeStep ? "complete" : ""}>
            <span>{index + 1}</span><strong>{step}</strong>
            <small>{index === 0 ? formatDate(proposal.submittedAt, false) : index === 3 ? statusLabel(proposal.status) : index < activeStep ? "complete" : "pending"}</small>
          </li>
        ))}</ol>
      </div>

      <RevisionHistory item={item} />

      <Panel className="motion-check-panel">
        <PanelHeader number="03" title="Motion check" meta={previous && proposed ? "LIVE REVISION DIFF" : "AWAITING BASELINE"} />
        <MotionCheck
          key={`${previous?.id ?? "none"}-${proposed?.id ?? "none"}`}
          previous={previous}
          proposed={proposed}
          previousLabel={item.revisions.length > 1 ? `Revision ${item.revisions.length - 1}` : "Baseline"}
          proposedLabel={`Revision ${latestRevision?.sequence ?? 1}`}
        />
      </Panel>

      <div className="review-grid">
        <Panel className="diff-panel">
          <PanelHeader number="04" title={`Visual diff: ${item.draft.name}`} meta="GRID 24 / STROKE 2" />
          <div className="diff-head"><span>Style</span><span>{item.revisions.length > 1 ? `Revision ${item.revisions.length - 1}` : "Before"}</span><span>Revision {latestRevision?.sequence ?? 1}</span></div>
          <div className="diff-row"><strong>Regular<br /><small>24 × 24</small></strong><ReviewIconCell candidate={previous} label={previous?.name ?? "No baseline"} weight="regular" /><ReviewIconCell candidate={proposed} label={proposed?.name ?? "Submitted"} weight="regular" changed /></div>
          <div className="diff-row"><strong>Solid<br /><small>24 × 24</small></strong><ReviewIconCell candidate={previous} label={previous?.name ?? "No baseline"} weight="fill" /><ReviewIconCell candidate={proposed} label={proposed?.name ?? "Submitted"} weight="fill" changed /></div>
          <footer className="diff-legend"><span><i className="accent-line" />Latest submitted geometry</span><span><i className="dash-line" />Construction field</span><span>Keyline: 24px</span></footer>
        </Panel>

        <div className="review-sidebar">
          <Panel className="ledger-panel">
            <PanelHeader number="05" title="Review activity" meta={`${proposal.comments.length + item.decisions.length} EVENTS`} />
            <div className="comment-list">
              {proposal.comments.map((comment) => (
                <button key={comment.id} className="comment-row" onClick={() => void toggleComment(comment.id, proposal.id)} aria-label={`${comment.resolved ? "Reopen" : "Resolve"} ${comment.title}`}>
                  <span className={comment.resolved ? "comment-dot resolved" : "comment-dot"} />
                  <div><strong>{comment.title}</strong><p>{comment.text}</p></div>
                  <small>{comment.author.slice(0, 8)}<br />{comment.time}</small>
                </button>
              ))}
              {item.decisions.map((decision) => (
                <article className={`decision-event ${decision.decision}`} key={decision.id}>
                  <span>{statusLabel(decision.decision)}</span>
                  <p>{decision.body || "No decision note was added."}</p>
                  <small>{formatDate(decision.createdAt)}</small>
                </article>
              ))}
              {!proposal.comments.length && !item.decisions.length && <div className="activity-empty"><strong>No review activity yet</strong><p>Add a precise note or record a decision.</p></div>}
            </div>
            <button className="text-action" onClick={() => setCommenting(!commenting)} disabled={proposal.status !== "in_review" || role === "contributor"}><Plus size={15} /> Add comment</button>
            {commenting && <form className="comment-form" onSubmit={submitComment}><label>Review note<textarea autoFocus value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Describe the geometry or naming issue" /></label><div><button type="button" onClick={() => setCommenting(false)}>Cancel</button><button type="submit" disabled={!newComment.trim()}>Add note</button></div></form>}
          </Panel>

          <div className="review-meta-grid">
            <Panel><PanelHeader number="06" title="Metadata & provenance" /><dl className="compact-dl"><div><dt>Status</dt><dd>{statusLabel(proposal.status)}</dd></div><div><dt>Candidate</dt><dd>{proposed?.name ?? "Unavailable"}</dd></div><div><dt>Licence</dt><dd>MIT</dd></div><div><dt>Author</dt><dd>{item.authorId.slice(0, 8)}</dd></div><div><dt>Adapter</dt><dd>{adapterLabel}</dd></div><div><dt>Validation</dt><dd><Check size={13} /> Passed</dd></div></dl></Panel>
            <Panel><PanelHeader number="07" title="Submission" /><div className="impact-list"><strong>Received</strong><span>{formatDate(proposal.submittedAt)}</span><strong>Revision</strong><span>{latestRevision?.sequence ?? 1} of {item.revisions.length}</span><strong>Target</strong><span>v{proposal.targetVersion}</span></div></Panel>
          </div>
        </div>
      </div>

      <div className={approved ? "decision-bar approved" : changesRequested ? "decision-bar changes-requested" : rejected ? "decision-bar rejected" : "decision-bar"}>
        <div className="decision-summary"><span>08</span><strong>{approved ? "Approved" : changesRequested ? "Changes requested" : rejected ? "Rejected" : "Decision"}</strong><p>{approved ? `${proposal.id} is ready for v${proposal.targetVersion}.` : changesRequested ? "The author can revise this icon and resubmit it as the next visible revision." : rejected ? "This proposal is closed. Its submission history remains available." : "Comments add notes. Request changes returns this revision to its author."}</p></div>
        {proposal.status === "in_review" && role !== "contributor" && <label className="decision-note"><span>Decision note</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Required for changes or rejection" /><small>{decisionNote.trim().length}/10 minimum for changes or rejection</small></label>}
        <div className="decision-actions">
          <button className="primary-action" onClick={() => { void approveProposal(decisionNote, proposal.id); setDecisionNote(""); }} disabled={proposal.status !== "in_review" || role === "contributor"}><Package size={19} />Approve for v{proposal.targetVersion}</button>
          <button className="secondary-action" onClick={() => { void requestChanges(decisionNote, proposal.id); setDecisionNote(""); }} disabled={proposal.status !== "in_review" || role === "contributor" || decisionNote.trim().length < 10}>Request changes</button>
          <button className="danger-action" onClick={() => { void rejectProposal(decisionNote, proposal.id); setDecisionNote(""); }} disabled={proposal.status !== "in_review" || role === "contributor" || decisionNote.trim().length < 10}><XCircle size={18} />Reject</button>
        </div>
      </div>
    </section>
  );
}

export function ReviewPage() {
  const { reviewQueue, backendLoading, backendError, refreshWorkspace } = useAppState();
  const { projectSlug = "core", proposalId } = useParams();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const selected = useMemo(() => (
    reviewQueue.find((item) => item.proposal.id === proposalId || item.databaseProposalId === proposalId)
    ?? reviewQueue.find((item) => item.proposal.status === "in_review")
    ?? reviewQueue[0]
  ), [proposalId, reviewQueue]);

  const refresh = async () => {
    setRefreshing(true);
    try { await refreshWorkspace(); } finally { setRefreshing(false); }
  };

  useEffect(() => {
    const refreshOnFocus = () => { void refreshWorkspace().catch(() => undefined); };
    const refreshOnVisibility = () => { if (document.visibilityState === "visible") refreshOnFocus(); };
    const interval = window.setInterval(refreshOnFocus, 15_000);
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [refreshWorkspace]);

  if (backendLoading && !reviewQueue.length) return <RouteLoading label="Loading review queue" />;
  if (backendError) {
    return (
      <main className="page-shell review-page">
        <PageIntro number="01" title="Review queue unavailable.">Formaglyph could not restore the project submissions from protected storage.</PageIntro>
        <Panel><div className="workspace-empty" role="alert"><strong>Review data could not be verified</strong><p>{backendError}</p></div></Panel>
      </main>
    );
  }
  if (!selected) {
    return (
      <main className="page-shell review-page">
        <PageIntro number="01" title="Review queue.">Every submitted icon will appear here with its candidate, received time, feedback, and revision history.</PageIntro>
        <Panel><div className="workspace-empty"><Clock size={26} /><strong>No submissions yet</strong><p>Validated proposals will appear here when a contributor sends them for review.</p></div></Panel>
      </main>
    );
  }

  return (
    <main className="page-shell review-page">
      <PageIntro number="01" title="Review queue." aside={<div className="queue-intro-actions"><span>{reviewQueue.filter((item) => item.proposal.status === "in_review").length} awaiting decision</span><button onClick={() => void refresh()} disabled={refreshing}><ArrowClockwise size={16} className={refreshing ? "rotating" : ""} />{refreshing ? "Refreshing" : "Refresh queue"}</button></div>}>
        Review every submitted icon, preserve feedback, and compare each resubmission with the exact geometry it replaces.
      </PageIntro>
      <div className="review-workbench">
        <ReviewQueue items={reviewQueue} selected={selected} onSelect={(item) => navigate(`/projects/${projectSlug}/review/${item.proposal.id}`)} />
        <ReviewDetail item={selected} />
      </div>
    </main>
  );
}
