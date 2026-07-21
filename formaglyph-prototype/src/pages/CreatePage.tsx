import { useState } from "react";
import { ArrowRight, CaretDown, Check, CheckCircle, CloudArrowUp, CloudCheck, DownloadSimple, FloppyDisk, UploadSimple, WarningCircle } from "@phosphor-icons/react";
import { candidates } from "../data/catalog";
import type { RouteName } from "../domain/types";
import { WeightIcon } from "../components/IconPreview";
import { PageFooter, PageIntro, Panel, PanelHeader } from "../components/Layout";
import { downloadSvg, renderIconSvg } from "../services/svg";
import { useAppState } from "../state/AppState";

function WorkflowSteps({ active }: { active: number }) {
  const steps = ["Brief", "Candidates", "Validate", "Review"];
  return <ol className="workflow-steps">{steps.map((step, index) => <li key={step} className={index + 1 === active ? "active" : index + 1 < active ? "complete" : ""}><span>{index + 1 < active ? <Check size={15} /> : index + 1}</span><strong>{step}</strong>{index < steps.length - 1 && <i />}</li>)}</ol>;
}

function ValidationGroup({ title, checks, defaultOpen = true }: { title: string; checks: string[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="validation-group"><button onClick={() => setOpen(!open)} aria-expanded={open}><strong>{title}</strong><span>{checks.length} checks <CaretDown size={14} className={open ? "rotated" : ""} /></span></button>{open && <ul>{checks.map((check) => <li key={check}><Check size={14} />{check}</li>)}</ul>}</div>;
}

export function CreatePage({ onNavigate, dark }: { onNavigate: (route: RouteName) => void; dark: boolean }) {
  const { state, updateDraft, selectCandidate, saveDraft, submitForReview } = useAppState();
  const [submitting, setSubmitting] = useState(false);
  const selected = candidates.find((candidate) => candidate.id === state.draft.selectedCandidateId) ?? candidates[0];

  const submit = () => {
    setSubmitting(true);
    const accepted = submitForReview();
    if (accepted) window.setTimeout(() => onNavigate("review"), 650);
    window.setTimeout(() => setSubmitting(false), 900);
  };

  const exportCandidate = () => downloadSvg(`${state.draft.name || "formaglyph-draft"}.svg`, renderIconSvg(selected.Icon));

  return (
    <main className="page-shell create-page">
      <PageIntro number="01" title="Create the missing glyph.">Define the icon you need, compare candidate drafts in Regular and Solid, validate the system rules, then submit for review.</PageIntro>
      <WorkflowSteps active={state.proposal.status === "changes_requested" ? 2 : 3} />
      <div className="create-grid">
        <Panel className="brief-panel">
          <PanelHeader number="01" title="Brief" meta="PERSISTED" />
          <div className="brief-fields">
            <label>Icon name<input value={state.draft.name} onChange={(event) => updateDraft("name", event.target.value)} required /></label>
            <label>Description<textarea value={state.draft.description} onChange={(event) => updateDraft("description", event.target.value)} required /></label>
            <label>Keywords<input value={state.draft.keywords} onChange={(event) => updateDraft("keywords", event.target.value)} /></label>
            <div className="brief-static"><span>Style alignment</span><p>System Regular 2px, rounded joins, 24px grid.</p></div>
            <div className="reference-set"><span>References</span><div><WeightIcon Icon={CloudArrowUp} size={32} /><WeightIcon Icon={UploadSimple} size={32} /><WeightIcon Icon={CloudCheck} size={32} /></div></div>
          </div>
          <div className="reference-notes"><strong>Reference notes</strong><p>Arrow remains centred on the cloud midpoint. Keep the base open only when the family aperture allows it.</p></div>
        </Panel>

        <Panel className="candidate-panel">
          <PanelHeader number="02" title="Candidate drafts" meta={`${selected.name} selected`} accent />
          <div className="candidate-head" aria-hidden="true"><span>Candidate</span><span>Regular</span><span>Solid</span></div>
          <div className="candidate-list">{candidates.map((candidate, index) => <button key={candidate.id} className={selected.id === candidate.id ? "candidate-row selected" : "candidate-row"} onClick={() => selectCandidate(candidate.id)} aria-pressed={selected.id === candidate.id}><span className="radio-mark">{selected.id === candidate.id && <i />}</span><span className="candidate-copy"><b>{String(index + 1).padStart(2, "0")}</b><strong>{candidate.name}</strong><small>{candidate.description}</small></span><WeightIcon Icon={candidate.Icon} size={78} /><WeightIcon Icon={candidate.Icon} size={78} weight="fill" /></button>)}</div>
          <footer className="candidate-footer"><span>Grid: 24px</span><span>Stroke: 2px</span><span>Radius: 2px</span><button onClick={exportCandidate}><DownloadSimple size={16} /> Export SVG</button></footer>
        </Panel>

        <Panel className="validation-panel">
          <PanelHeader number="03" title="Validation" meta={selected.issue ? "1 ISSUE" : "PASSED"} accent={Boolean(selected.issue)} />
          <ValidationGroup title="Geometry" checks={["24 × 24 canvas", "Whole and half-unit alignment", "2px Regular stroke", "Optical balance"]} />
          <ValidationGroup title="Naming" checks={["Kebab-case", "Unique within set", "Semantic aliases present"]} />
          <ValidationGroup title="Provenance" checks={["Source references recorded", "Original output", "Review chain attached"]} defaultOpen={false} />
          <ValidationGroup title="Licence" checks={["MIT asset licence", "Attribution notice retained"]} defaultOpen={false} />
          <div className={selected.issue ? "issue-box" : "issue-box passed"}>{selected.issue ? <WarningCircle size={18} /> : <CheckCircle size={18} />}<div><strong>{selected.issue ? "Review required" : "All checks passed"}</strong><p>{selected.issue ?? "Candidate is ready to submit for human review."}</p></div></div>
        </Panel>
      </div>

      <div className="sticky-actions"><span>Draft ID: {state.proposal.draftId}</span><span>Updated: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(state.draft.updatedAt))} UTC</span><div><button className="secondary-action" onClick={saveDraft}><FloppyDisk size={18} />Save draft</button><button className="primary-action" onClick={submit} disabled={submitting}>{submitting ? <Check size={19} /> : null}{submitting ? "Submitting" : state.proposal.status === "changes_requested" ? "Resubmit for review" : "Submit for review"}<ArrowRight size={18} /></button></div></div>
      <PageFooter dark={dark} />
    </main>
  );
}
