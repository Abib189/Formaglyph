import { useState, type FormEvent } from "react";
import { Check, GridFour, Package, Plus, XCircle } from "@phosphor-icons/react";
import type { PreviewWeight } from "../domain/types";
import { SvgIcon } from "../components/IconPreview";
import { Panel, PageIntro, PanelHeader, RouteLoading } from "../components/Layout";
import { selectReviewAssets } from "../services/reviewAssets";
import { useAppState } from "../state/AppState";

function ReviewIconCell({ label, weight, after = false }: { label: string; weight: PreviewWeight; after?: boolean }) {
  const { state } = useAppState();
  const { current, proposed } = selectReviewAssets(state.candidates, state.draft.selectedCandidateId);
  const candidate = after ? proposed : current;
  const svg = weight === "fill" ? candidate?.variants.solid : candidate?.variants.regular;
  const unavailable = after ? "Submitted variant unavailable" : "No current release";
  return <div className="review-icon-cell"><span>{label}</span><div className="review-cell-pair"><div className="review-icon-stage plain-stage">{svg ? <SvgIcon svg={svg} size={86} /> : <small>{unavailable}</small>}</div><div className="review-icon-stage"><GridFour className="grid-asset" size={154} weight="thin" />{svg ? <SvgIcon svg={svg} size={78} /> : <small>{unavailable}</small>}{after && svg && <span className="change-pin">+1</span>}</div></div></div>;
}

export function ReviewPage() {
  const { state, role, backendLoading, backendError, addComment, toggleComment, requestChanges, approveProposal, rejectProposal } = useAppState();
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const approved = state.proposal.status === "approved";
  const changesRequested = state.proposal.status === "changes_requested";
  const rejected = state.proposal.status === "rejected";

  if (backendLoading) return <RouteLoading label="Loading submitted candidate" />;
  if (backendError) {
    return (
      <main className="page-shell review-page">
        <PageIntro number="01" title="Review unavailable.">
          Formaglyph could not restore the submitted candidate from the protected project storage.
        </PageIntro>
        <Panel><div className="workspace-empty" role="alert"><strong>Candidate could not be verified</strong><p>{backendError}</p></div></Panel>
      </main>
    );
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
    setCommenting(false);
  };

  const releaseSteps = ["Draft", "Validated", "In review", `v${state.proposal.targetVersion}`];
  const activeStep = approved ? 3 : changesRequested || rejected ? 1 : 2;
  const { proposed: selectedCandidate } = selectReviewAssets(state.candidates, state.draft.selectedCandidateId);
  const adapterLabel = selectedCandidate?.provenance.adapter === "manual_import" ? "Manual import" : selectedCandidate?.provenance.model ?? "Unknown";

  return (
    <main className="page-shell review-page">
      <PageIntro number="01" title="Review the change." aside={<ol className="release-sequence">{releaseSteps.map((item, index) => <li key={item} className={index === activeStep ? "active" : index < activeStep ? "complete" : ""}><span>{index + 1}</span><strong>{item}</strong><small>{index === 3 ? approved ? "approved" : "pending" : changesRequested && index === 1 ? "changes" : "20 Jul"}</small></li>)}</ol>}>
        Compare the proposed icon to the current release. Inspect visual, technical, and package impact before approving it into v{state.proposal.targetVersion}.
      </PageIntro>

      <div className="review-grid">
        <Panel className="diff-panel">
          <PanelHeader number="01" title={`Visual diff: ${state.draft.name}`} meta="GRID 24 / STROKE 2" />
          <div className="diff-head"><span>Style</span><span>Before (v1.0.0)</span><span>After ({state.proposal.id})</span></div>
          <div className="diff-row"><strong>Regular<br /><small>24 × 24</small></strong><ReviewIconCell label="Current" weight="regular" /><ReviewIconCell label="Proposed" weight="regular" after /></div>
          <div className="diff-row"><strong>Solid<br /><small>24 × 24</small></strong><ReviewIconCell label="Current" weight="fill" /><ReviewIconCell label="Proposed" weight="fill" after /></div>
          <footer className="diff-legend"><span><i className="accent-line" />Changed geometry</span><span><i className="dash-line" />Construction field</span><span>Keyline: 24px</span></footer>
        </Panel>

        <div className="review-sidebar">
          <Panel className="ledger-panel">
            <PanelHeader number="02" title="Issue ledger" meta={`${state.proposal.comments.length} NOTES`} />
            <div className="comment-list">{state.proposal.comments.map((comment) => <button key={comment.id} className="comment-row" onClick={() => void toggleComment(comment.id)} aria-label={`${comment.resolved ? "Reopen" : "Resolve"} ${comment.title}`}><span className={comment.resolved ? "comment-dot resolved" : "comment-dot"} /><div><strong>{comment.id.length > 12 ? `R-${comment.id.slice(0, 4).toUpperCase()}` : comment.id} · {comment.title}</strong><p>{comment.text}</p></div><small>{comment.author === "You" ? "You" : comment.author.slice(0, 8)}<br />{comment.time}</small></button>)}</div>
            <button className="text-action" onClick={() => setCommenting(!commenting)}><Plus size={15} /> Add comment</button>
            {commenting && <form className="comment-form" onSubmit={submitComment}><textarea autoFocus value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Add a precise review note…" aria-label="Review note" /><div><button type="button" onClick={() => setCommenting(false)}>Cancel</button><button type="submit" disabled={!newComment.trim()}>Add note</button></div></form>}
          </Panel>

          <div className="review-meta-grid">
            <Panel><PanelHeader number="03" title="Metadata & provenance" /><dl className="compact-dl"><div><dt>Status</dt><dd>{state.proposal.status.replace("_", " ")}</dd></div><div><dt>Style</dt><dd>{state.settings.defaultVariant}</dd></div><div><dt>Licence</dt><dd>MIT</dd></div><div><dt>Author</dt><dd>Maintainer</dd></div><div><dt>Adapter</dt><dd>{adapterLabel}</dd></div><div><dt>Validation</dt><dd><Check size={13} /> Passed</dd></div></dl></Panel>
            <Panel><PanelHeader number="04" title="Release impact" /><div className="impact-list"><strong>Aliases</strong><span>{state.draft.name}</span><span>upload-cloud</span><span>cloud-uploaded</span><strong>Packages</strong><span>@formaglyph/core</span><span>@formaglyph/react</span></div></Panel>
          </div>
        </div>
      </div>

      <div className={approved ? "decision-bar approved" : changesRequested ? "decision-bar changes-requested" : rejected ? "decision-bar rejected" : "decision-bar"}>
        <div className="decision-summary"><span>05</span><strong>{approved ? "Approved" : changesRequested ? "Changes requested" : rejected ? "Rejected" : "Decision"}</strong><p>{approved ? `${state.proposal.id} is queued for Formaglyph v${state.proposal.targetVersion}.` : changesRequested ? "The author must revise and resubmit this proposal." : rejected ? "This proposal is closed. Its audit history remains immutable." : "Approve, return, or reject this change with a recorded decision."}</p></div>
        {state.proposal.status === "in_review" && role !== "contributor" && <label className="decision-note"><span>Decision note</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Required for changes or rejection" /><small>{decisionNote.trim().length}/10 minimum for changes or rejection</small></label>}
        <div className="decision-actions"><button className="primary-action" onClick={() => { void approveProposal(decisionNote); setDecisionNote(""); }} disabled={state.proposal.status !== "in_review" || role === "contributor"}>{approved ? <Check size={19} /> : <Package size={19} />}{approved ? `Approved for v${state.proposal.targetVersion}` : `Approve for v${state.proposal.targetVersion}`}</button><button className="secondary-action" onClick={() => { void requestChanges(decisionNote); setDecisionNote(""); }} disabled={state.proposal.status !== "in_review" || role === "contributor" || decisionNote.trim().length < 10}>Request changes</button><button className="danger-action" onClick={() => { void rejectProposal(decisionNote); setDecisionNote(""); }} disabled={state.proposal.status !== "in_review" || role === "contributor" || decisionNote.trim().length < 10}><XCircle size={18} />Reject</button></div>
      </div>
    </main>
  );
}
