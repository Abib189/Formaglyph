import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { FloppyDisk } from "@phosphor-icons/react/FloppyDisk";
import { UploadSimple } from "@phosphor-icons/react/UploadSimple";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import type { RouteName } from "../domain/types";
import { SvgIcon } from "../components/IconPreview";
import { Dialog } from "../components/Dialog";
import {
  PageFooter,
  PageIntro,
  Panel,
  PanelHeader,
  RouteLoading,
} from "../components/Layout";
import { downloadSvg } from "../services/svg";
import { isSupabaseMode } from "../services/dataMode";
import { iconNameError } from "../services/iconName";
import { useAppState } from "../state/AppState";
import { ActionButton } from "../components/ActionButton";

function PairImport({ onClose }: { onClose: () => void }) {
  const { importPair } = useAppState();
  const [name, setName] = useState("Imported pair");
  const [regular, setRegular] = useState<File | null>(null);
  const [solid, setSolid] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if ([regular, solid].some((file) => file && file.size > 256_000))
        throw new Error("Each SVG must be smaller than 256 KB.");
      const [regularSvg, solidSvg] = await Promise.all([
        regular?.text() ?? null,
        solid?.text() ?? null,
      ]);
      if (importPair({ name, regular: regularSvg, solid: solidSvg })) onClose();
      else
        setError(
          "Import could not be validated. Check the SVG files and try again.",
        );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not read the selected files.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title="Import SVG pair" onClose={onClose}>
      <p>
        One candidate, two variants. Files are sanitized and validated locally.
        A partial import can be saved, but both variants are required for
        review.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          Candidate name
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Regular SVG
          <input
            type="file"
            accept=".svg,image/svg+xml"
            onChange={(event) => setRegular(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Solid SVG
          <input
            type="file"
            accept=".svg,image/svg+xml"
            onChange={(event) => setSolid(event.target.files?.[0] ?? null)}
          />
        </label>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-action"
            disabled={busy || !name.trim() || (!regular && !solid)}
          >
            {busy ? "Importing…" : "Import candidate"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function CreatePage({
  dark,
}: {
  onNavigate: (route: RouteName) => void;
  dark: boolean;
}) {
  const {
    state,
    backendLoading,
    backendError,
    updateDraft,
    selectCandidate,
    saveDraft,
    submitForReview,
  } = useAppState();
  const navigate = useNavigate();
  const { projectSlug = "core" } = useParams();
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const selected =
    state.candidates.find(
      (candidate) => candidate.id === state.draft.selectedCandidateId,
    ) ?? state.candidates[0];
  const fingerprint = JSON.stringify([
    state.draft.name,
    state.draft.description,
    state.draft.keywords,
    selected?.id,
  ]);
  const [savedFingerprint, setSavedFingerprint] = useState(fingerprint);
  useEffect(() => {
    if (!backendLoading)
      setSavedFingerprint(fingerprint); /* restore, not an automatic save */
  }, [backendLoading]);
  const dirty = savedFingerprint !== fingerprint;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const hasPair = Boolean(
    selected?.variants.regular && selected.variants.solid,
  );
  const nameError = iconNameError(state.draft.name);
  const locked =
    state.proposal.status === "in_review" ||
    state.proposal.status === "approved";
  const canSubmit =
    hasPair &&
    !nameError &&
    !selected?.issue &&
    Boolean(state.draft.description.trim()) &&
    !locked;
  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const id = await saveDraft();
      setSavedFingerprint(fingerprint);
      if (isSupabaseMode)
        navigate(
          `/projects/${encodeURIComponent(projectSlug)}/create?draft=${encodeURIComponent(id)}`,
          { replace: true },
        );
      return true;
    } catch {
      setSaveError(
        "Could not save. Your brief and selected pair are retained. Check your connection and retry.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  const submit = async () => {
    setSubmitting(true);
    setSaveError("");
    try {
      const submitted = await submitForReview();
      if (submitted) setSavedFingerprint(fingerprint);
      else
        setSaveError(
          "Submission was not completed. Your current candidate is retained; check the notification and retry.",
        );
      return submitted;
    } finally {
      setSubmitting(false);
    }
  };
  if (backendLoading) return <RouteLoading label="Loading icon draft" />;
  if (backendError)
    return (
      <main className="page-shell create-page">
        <PageIntro title="Draft unavailable">{backendError}</PageIntro>
        <Link to={`/projects/${projectSlug}/workspace`}>Back to Workspace</Link>
      </main>
    );
  return (
    <main className="page-shell create-page">
      <Link
        className="review-breadcrumb"
        to={`/projects/${projectSlug}/workspace`}
      >
        <ArrowRight size={14} className="back-arrow" />
        Workspace <span>/</span>New icon
      </Link>
      <PageIntro
        title="Create an icon pair"
        aside={
          <span
            className={`draft-save-state${saveError ? " error" : ""}`}
            role="status"
          >
            {saving
              ? "Saving…"
              : saveError
                ? "Save or submission failed"
                : dirty
                  ? "Unsaved changes"
                  : state.draft.name
                    ? "Draft restored"
                    : "New draft"}
          </span>
        }
      >
        Write a brief, import both variants, then submit one candidate for
        review.
      </PageIntro>
      {locked && (
        <div className="submission-receipt" role="status">
          <CheckCircle size={22} />
          <div>
            <strong>
              {state.proposal.status === "approved"
                ? "Pair approved — not yet published"
                : "Submitted for review"}
            </strong>
            <p>
              {selected?.name} · {state.proposal.id} ·{" "}
              {hasPair
                ? "Regular + Solid are part of this submission."
                : "Legacy incomplete pair — an admin must return it for both variants."}
            </p>
          </div>
          <Link
            className="secondary-action"
            to={`/projects/${projectSlug}/review/${state.proposal.id}`}
          >
            Open proposal <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="create-grid">
        <Panel className="brief-panel">
          <PanelHeader title="Brief" />
          <div className="brief-fields">
            <label>
              Icon name
              <input
                aria-label="Icon name"
                value={state.draft.name}
                disabled={locked || saving || submitting}
                onChange={(event) => updateDraft("name", event.target.value)}
                aria-invalid={Boolean(state.draft.name && nameError)}
                aria-describedby="icon-name-help"
                placeholder="e.g. cloud-upload"
                required
              />
              <small id="icon-name-help" className="field-help">
                {state.draft.name && nameError
                  ? nameError
                  : "Kebab-case. Open an existing draft from Workspace to revise it."}
              </small>
            </label>
            <label>
              Description
              <textarea
                disabled={locked || saving || submitting}
                value={state.draft.description}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                placeholder="What should this icon communicate?"
                required
              />
            </label>
            <label>
              Keywords
              <input
                disabled={locked || saving || submitting}
                value={state.draft.keywords}
                onChange={(event) =>
                  updateDraft("keywords", event.target.value)
                }
                placeholder="cloud, upload, file"
              />
            </label>
            <div className="brief-static">
              <span>Formaglyph Core</span>
              <p>24 px grid · currentColor · Regular + Solid</p>
            </div>
          </div>
          <div className="generation-paused">
            <strong>Generation paused</strong>Model generation will return after
            the server milestone. Import your own SVGs to continue.
          </div>
        </Panel>
        <Panel className="candidate-panel">
          <header className="selected-candidate-heading">
            <div>
              <h2>Selected candidate</h2>
              <p>{selected?.name ?? "No candidate selected"}</p>
            </div>
            <button
              className="secondary-action"
              onClick={() => setImporting(true)}
              disabled={locked || saving || submitting}
            >
              <UploadSimple size={16} />
              Import SVG pair
            </button>
          </header>
          <div className="candidate-list">
            {state.candidates.length ? (
              state.candidates
                .filter((candidate) => candidate.id === selected?.id)
                .map((candidate) => (
                  <button
                    key={candidate.id}
                    disabled={locked || saving || submitting}
                    className={`candidate-row${selected?.id === candidate.id ? " selected" : ""}`}
                    onClick={() => selectCandidate(candidate.id)}
                    aria-pressed={selected?.id === candidate.id}
                  >
                    <span className="radio-mark">
                      {selected?.id === candidate.id && <i />}
                    </span>
                    <span className="candidate-copy">
                      <strong>{candidate.name}</strong>
                      <small>{candidate.description}</small>
                    </span>
                    {(["regular", "solid"] as const).map((variant) => (
                      <span
                        key={variant}
                        className="candidate-svg-cell"
                        aria-label={`${variant} ${candidate.variants[variant] ? "preview" : "not supplied"}`}
                      >
                        {candidate.variants[variant] ? (
                          <SvgIcon
                            svg={candidate.variants[variant]!}
                            size={96}
                          />
                        ) : (
                          <small>Not supplied</small>
                        )}
                        <span className="candidate-variant-label">
                          {variant === "regular" ? "Regular" : "Solid"}
                        </span>
                      </span>
                    ))}
                  </button>
                ))
            ) : (
              <div className="workspace-empty">
                <UploadSimple size={28} />
                <strong>Import your first pair</strong>
                <p>Regular and Solid are reviewed together as one candidate.</p>
                <button
                  className="secondary-action"
                  onClick={() => setImporting(true)}
                >
                  Choose SVG files
                </button>
              </div>
            )}
          </div>
          {state.candidates.length > 1 && (
            <div className="candidate-chooser">
              <label>
                Choose candidate
                <select
                  aria-label="Choose candidate"
                  disabled={locked || saving || submitting}
                  value={selected?.id ?? ""}
                  onChange={(event) => selectCandidate(event.target.value)}
                >
                  {state.candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <footer className="candidate-footer">
            <span>24 px native grid</span>
            <span>
              {selected?.provenance.adapter === "manual_import"
                ? "Manual SVG import"
                : "Stored candidate"}
            </span>
            {selected?.variants.regular && (
              <button
                onClick={() =>
                  downloadSvg(
                    `${state.draft.name || "draft"}-regular.svg`,
                    selected.variants.regular!,
                  )
                }
              >
                <DownloadSimple size={16} />
                Regular
              </button>
            )}
            {selected?.variants.solid && (
              <button
                onClick={() =>
                  downloadSvg(
                    `${state.draft.name || "draft"}-solid.svg`,
                    selected.variants.solid!,
                  )
                }
              >
                <DownloadSimple size={16} />
                Solid
              </button>
            )}
          </footer>
        </Panel>
        <Panel className="validation-panel">
          <PanelHeader
            title="Validation"
            meta={
              hasPair && !selected?.issue ? "Pair complete" : "Action needed"
            }
          />
          <div className={`issue-box${canSubmit ? " passed" : ""}`}>
            {canSubmit ? (
              <CheckCircle size={20} />
            ) : (
              <WarningCircle size={20} />
            )}
            <div>
              <strong>
                {!selected
                  ? "Import a candidate"
                  : !hasPair
                    ? "Both variants required"
                    : nameError
                      ? "Check the icon name"
                      : selected.issue
                        ? "Revise this candidate"
                        : !state.draft.description.trim()
                          ? "Add a description"
                          : locked
                            ? "Review in progress"
                            : "Ready for review"}
              </strong>
              <p>
                {selected?.issue ??
                  (!hasPair
                    ? "Regular and Solid must both be present before review."
                    : (nameError ??
                      "Approval and publication remain separate steps."))}
              </p>
            </div>
          </div>
          <details className="validation-rules" open={Boolean(selected?.issue)}>
            <summary>Geometry & safety checks</summary>
            <p>
              {selected
                ? "Imported assets pass through SVG sanitization, native-grid, paint and complexity checks. See any candidate issue above."
                : "Checks run after import. Nothing has been validated yet."}
            </p>
          </details>
          <details className="validation-rules">
            <summary>Naming & provenance</summary>
            <p>
              Kebab-case is checked locally. Project name uniqueness and
              publication permissions are checked by the server. Stored
              provenance and the project licence travel with the submission.
            </p>
          </details>
          <p className="validation-reminder">
            Human review is required. The author cannot approve their own
            proposal.
          </p>
        </Panel>
      </div>
      {saveError && (
        <p className="inline-request-error" role="alert">
          {saveError}
        </p>
      )}
      <div className="sticky-actions">
        <div className="submission-context">
          <strong>{selected?.name ?? "No candidate"}</strong>
          <span>
            {hasPair ? "Regular + Solid" : "Incomplete pair"} ·{" "}
            {state.proposal.status.replaceAll("_", " ")}
          </span>
        </div>
        <div>
          <ActionButton
            className="secondary-action"
            disabled={!selected || saving || submitting || locked}
            onAction={save} label="Save draft" icon={<FloppyDisk size={17} />}
            pendingLabel="Saving…" successLabel="Draft saved" resetKey={fingerprint}
          />
          <ActionButton
            className="primary-action"
            disabled={!canSubmit || submitting || saving}
            onAction={submit} label={state.proposal.status === "changes_requested" ? "Resubmit for review" : "Submit for review"}
            icon={<ArrowRight size={17} />} pendingLabel="Submitting…" successLabel="Submitted" resetKey={fingerprint}
          />
        </div>
      </div>
      <PageFooter dark={dark} />
      {importing && <PairImport onClose={() => setImporting(false)} />}
    </main>
  );
}
