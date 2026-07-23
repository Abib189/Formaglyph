import { useState, type ChangeEvent } from "react";
import { ArrowClockwise, ArrowRight, CaretDown, Check, CheckCircle, DownloadSimple, FloppyDisk, HardDrives, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import type { RouteName } from "../domain/types";
import { SvgIcon } from "../components/IconPreview";
import { PageFooter, PageIntro, Panel, PanelHeader } from "../components/Layout";
import { downloadSvg } from "../services/svg";
import { useAppState } from "../state/AppState";

function WorkflowSteps({ active }: { active: number }) {
  const steps = ["Brief", "Candidates", "Validate", "Review"];
  return <ol className="workflow-steps">{steps.map((step, index) => <li key={step} className={index + 1 === active ? "active" : index + 1 < active ? "complete" : ""}><span>{index + 1 < active ? <Check size={15} /> : index + 1}</span><strong>{step}</strong>{index < steps.length - 1 && <i />}</li>)}</ol>;
}

function ValidationGroup({ title, checks, defaultOpen = true }: { title: string; checks: string[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="validation-group"><button onClick={() => setOpen(!open)} aria-expanded={open}><strong>{title}</strong><span>{checks.length} checks <CaretDown size={14} className={open ? "rotated" : ""} /></span></button>{open && <ul>{checks.map((check) => <li key={check}><Check size={14} />{check}</li>)}</ul>}</div>;
}

function CandidatePreview({ svg, label }: { svg: string | null; label: string }) {
  return <span className="candidate-svg-cell" aria-label={svg ? `${label} preview` : `${label} unavailable`}>{svg ? <SvgIcon svg={svg} size={78} /> : <small>Not supplied</small>}</span>;
}

export function CreatePage({ onNavigate, dark }: { onNavigate: (route: RouteName) => void; dark: boolean }) {
  const { state, updateDraft, selectCandidate, generateCandidates, importCandidate, cancelGeneration, saveDraft, submitForReview } = useAppState();
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const selected = state.candidates.find((candidate) => candidate.id === state.draft.selectedCandidateId) ?? state.candidates[0];
  const generationRunning = state.generationJob?.status === "queued" || state.generationJob?.status === "running";
  const activeStep = state.proposal.status === "changes_requested" ? 2 : state.candidates.length ? 3 : 1;
  const selectedSvg = selected?.variants[state.settings.defaultVariant] ?? selected?.variants.regular ?? selected?.variants.solid ?? null;

  const submit = async () => {
    setSubmitting(true);
    const accepted = await submitForReview();
    if (accepted) window.setTimeout(() => onNavigate("review"), 650);
    window.setTimeout(() => setSubmitting(false), 900);
  };

  const exportCandidate = () => {
    if (selectedSvg) downloadSvg(`${state.draft.name || "formaglyph-draft"}-${state.settings.defaultVariant}.svg`, selectedSvg);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      importCandidate(await file.text(), state.settings.defaultVariant, file.name);
    } finally {
      setImporting(false);
    }
  };

  const promptRetained = state.settings.retainPrompts ? "Prompt retained in project history" : "Only a SHA-256 prompt hash is retained";
  const adapterLabel = selected?.provenance.adapter === "manual_import" ? "Manual import" : selected?.provenance.model ?? "Local geometry";

  return (
    <main className="page-shell create-page">
      <PageIntro number="01" title="Create the missing glyph.">Write the brief, generate or import real SVG candidates, validate the system rules, then submit one variant for human review.</PageIntro>
      <WorkflowSteps active={activeStep} />
      <div className="create-grid">
        <Panel className="brief-panel">
          <PanelHeader number="01" title="Brief" meta="PERSISTED" />
          <div className="brief-fields">
            <label>Icon name<input value={state.draft.name} onChange={(event) => updateDraft("name", event.target.value)} required /></label>
            <label>Description<textarea value={state.draft.description} onChange={(event) => updateDraft("description", event.target.value)} required /></label>
            <label>Keywords<input value={state.draft.keywords} onChange={(event) => updateDraft("keywords", event.target.value)} /></label>
            <div className="brief-static"><span>Style alignment</span><p>24px grid, rounded joins, currentColor only.</p></div>
          </div>
          <div className="creation-tools">
            <button className="primary-action" onClick={() => void generateCandidates()} disabled={generationRunning}><HardDrives size={17} />{generationRunning ? "Generating" : "Generate 3 candidates"}</button>
            <label className="secondary-action import-action"><UploadSimple size={17} />{importing ? "Importing" : "Import SVG"}<input type="file" accept="image/svg+xml,.svg" onChange={(event) => void handleImport(event)} disabled={importing || generationRunning} /></label>
            <p>Local Geometry runs in this browser. It does not send the brief to a model provider.</p>
          </div>
          {state.generationJob && <div className={`generation-status ${state.generationJob.status}`} role="status">
            <div><strong>{state.generationJob.status === "completed" ? "Generation complete" : state.generationJob.status === "failed" ? "Generation failed" : state.generationJob.status === "cancelled" ? "Generation cancelled" : "Local generation running"}</strong><span>{state.generationJob.progress}%</span></div>
            <progress value={state.generationJob.progress} max="100" />
            <p>{state.generationJob.error ?? promptRetained}</p>
            {generationRunning ? <button onClick={() => void cancelGeneration()}><X size={14} />Cancel</button> : <button onClick={() => void generateCandidates()}><ArrowClockwise size={14} />Run again</button>}
          </div>}
        </Panel>

        <Panel className="candidate-panel">
          <PanelHeader number="02" title="Candidate drafts" meta={selected ? `${selected.name} selected` : "EMPTY"} accent={Boolean(selected)} />
          <div className="candidate-head" aria-hidden="true"><span>Candidate</span><span>Regular</span><span>Solid</span></div>
          <div className="candidate-list">{state.candidates.length ? state.candidates.map((candidate, index) => <button key={candidate.id} className={selected?.id === candidate.id ? "candidate-row selected" : "candidate-row"} onClick={() => selectCandidate(candidate.id)} aria-pressed={selected?.id === candidate.id}><span className="radio-mark">{selected?.id === candidate.id && <i />}</span><span className="candidate-copy"><b>{String(index + 1).padStart(2, "0")}</b><strong>{candidate.name}</strong><small>{candidate.description}</small></span><CandidatePreview svg={candidate.variants.regular} label="Regular" /><CandidatePreview svg={candidate.variants.solid} label="Solid" /></button>) : <div className="candidate-empty"><HardDrives size={28} /><strong>No candidates yet</strong><p>Generate a local set or import an SVG to begin.</p></div>}</div>
          <footer className="candidate-footer"><span>Grid: 24px</span><span>Variant: {state.settings.defaultVariant}</span><span>{adapterLabel}</span><button onClick={exportCandidate} disabled={!selectedSvg}><DownloadSimple size={16} /> Export SVG</button></footer>
        </Panel>

        <Panel className="validation-panel">
          <PanelHeader number="03" title="Validation" meta={!selected ? "WAITING" : selected.issue ? "1 ISSUE" : "PASSED"} accent={Boolean(selected?.issue)} />
          <ValidationGroup title="Geometry" checks={["24 × 24 canvas", "Safe SVG elements", "currentColor paint", "Complexity limits"]} />
          <ValidationGroup title="Naming" checks={["Kebab-case", "Project uniqueness", "Semantic keywords present"]} />
          <ValidationGroup title="Provenance" checks={[adapterLabel, selected?.provenance.promptHash ? "Prompt hash recorded" : "Source import recorded", "Human review required"]} defaultOpen={false} />
          <ValidationGroup title="Licence" checks={["Project asset licence", "Attribution metadata retained"]} defaultOpen={false} />
          <div className={!selected || selected.issue ? "issue-box" : "issue-box passed"}>{!selected || selected.issue ? <WarningCircle size={18} /> : <CheckCircle size={18} />}<div><strong>{!selected ? "Candidate required" : selected.issue ? "Review required" : "All checks passed"}</strong><p>{!selected ? "Generate or import a candidate before saving." : selected.issue ?? `${state.settings.defaultVariant === "regular" ? "Regular" : "Solid"} is ready to submit for human review.`}</p></div></div>
        </Panel>
      </div>

      <div className="sticky-actions"><span>Draft ID: {state.proposal.draftId}</span><span>Updated: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(state.draft.updatedAt))} UTC</span><div><button className="secondary-action" onClick={() => void saveDraft()} disabled={!selectedSvg || generationRunning}><FloppyDisk size={18} />Save draft</button><button className="primary-action" onClick={() => void submit()} disabled={submitting || !selectedSvg || generationRunning}>{submitting ? <Check size={19} /> : null}{submitting ? "Submitting" : state.proposal.status === "changes_requested" ? "Resubmit for review" : "Submit for review"}<ArrowRight size={18} /></button></div></div>
      <PageFooter dark={dark} />
    </main>
  );
}
