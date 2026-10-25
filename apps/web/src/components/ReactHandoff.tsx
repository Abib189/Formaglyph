import { useEffect, useState } from "react";
import type { IconComponent } from "@formaglyph/react";
import type { CoreComponentName } from "@formaglyph/react/loaders";
import type { CatalogIcon } from "../domain/types";
import { copyText } from "../services/svg";
import { iconProofBackground } from "../services/iconColour";
import { downloadReactFile, fetchReactArchive, fetchReactSource, findReactEntry, loadReactRelease, reactUsage, verifyReactSelection, type ReactRelease } from "../services/reactDelivery";

export function ReactHandoff({ icon, colour, size }: { icon: CatalogIcon; colour: string | null; size: number }) {
  const [open, setOpen] = useState(false), [release, setRelease] = useState<ReactRelease | null>(null);
  const [error, setError] = useState(""), [feedback, setFeedback] = useState(""), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0);
  const [preview, setPreview] = useState<{ id: string; Component: IconComponent } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const entry = release ? findReactEntry(release, icon) : undefined;
  useEffect(() => {
    if (!open) return;
    let active = true; setError("");
    void loadReactRelease().then(value => { if (active) setRelease(value); }).catch(() => { if (active) setError("Could not load the React release. Try again."); });
    return () => { active = false; };
  }, [open, retry]);
  useEffect(() => {
    setFeedback("");
    if (!open || !entry) return;
    setError("");
    setPreviewFailed(false);
    let active = true;
    void verifyReactSelection(entry, icon).then(() => import("@formaglyph/react/loaders")).then(module => module.loadIcon(entry.component as CoreComponentName)).then(Component => {
      if (active) setPreview({ id: icon.id, Component });
    }).catch(() => { if (active) { setPreviewFailed(true); setError("The React preview could not be loaded or verified. Reload to use the latest release; your URL selection is retained."); } });
    return () => { active = false; };
  }, [open, entry, icon.id, retry]);
  useEffect(() => { setFeedback(""); }, [colour, size]);
  const Component = preview?.id === icon.id ? preview.Component : null;
  const usage = entry ? reactUsage(entry, colour, size) : "";
  const install = release ? `npm install ${JSON.stringify(new URL(release.package.url, window.location.origin).href)}` : "";
  const act = async (action: "usage" | "install" | "source" | "package", trigger: HTMLButtonElement) => {
    if (!entry || !release) return;
    setBusy(true); setError(""); setFeedback("");
    try {
      await verifyReactSelection(entry, icon);
      if (action === "usage" || action === "install") {
        await copyText(action === "usage" ? usage : install);
        setFeedback(action === "usage" ? `${entry.component} usage copied` : "Archive install command copied");
      } else if (action === "source") {
        downloadReactFile(`${entry.component}.tsx`, await fetchReactSource(entry, colour, size), "text/plain;charset=utf-8");
        setFeedback(`${entry.component}.tsx downloaded`);
      } else {
        downloadReactFile(`formaglyph-react-${release.version}.tgz`, await fetchReactArchive(release), "application/gzip");
        setFeedback("Verified Core React package downloaded");
      }
    } catch { setError("Could not verify or complete the React handoff. Try again; your selection is retained."); }
    finally {
      setBusy(false);
      requestAnimationFrame(() => { if (trigger.isConnected) trigger.focus({ preventScroll: true }); });
    }
  };
  return <details className="inspector-details react-handoff" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Use in React</summary>
    {open && <div className="react-handoff-content">
      {!release && !error && <p role="status">Loading the Core React release…</p>}
      {release && !entry && <p role="status">This Core version is not in the React release. SVG export remains available.</p>}
      {entry && release && <>
        <div className="react-handoff-proof">
          <span className="react-handoff-glyph" style={{ background: colour ? iconProofBackground(colour) : undefined }}>{Component ? <Component size={24} color={colour ?? "currentColor"} /> : null}</span>
          <div><code>{entry.component}</code><small>React 18/19 · package {release.version} · MIT</small></div>
        </div>
        <p>Install the archive, then import this icon. Not published to npm.</p>
        <div className="react-code-label"><span>Install package</span><button className="text-action" disabled={busy || !Component} onClick={event => void act("install", event.currentTarget)}>Copy install command</button></div>
        <pre tabIndex={0} aria-label="React package install command"><code>{install}</code></pre>
        <div className="react-code-label"><span>Usage</span><button className="text-action" disabled={busy || !Component} onClick={event => void act("usage", event.currentTarget)}>Copy React usage</button></div>
        <pre tabIndex={0} aria-label="React usage code"><code>{usage}</code></pre>
        <p>Decorative by default. Add a title or aria-label when the icon conveys meaning.</p>
        <div className="react-handoff-downloads">
          <button className="secondary-action" disabled={busy || !Component} onClick={event => void act("source", event.currentTarget)}>Download component</button>
          <button className="secondary-action" disabled={busy || !Component} onClick={event => void act("package", event.currentTarget)}>Download React package</button>
        </div>
        <p className="react-handoff-note">The standalone .tsx file uses your selected size and colour; import it from your own project. The full 48-icon package stays currentColor; the copied usage includes your colour. Original Core only.</p>
      </>}
      {busy && <p role="status">Verifying handoff…</p>}
      {feedback && <p className="action-feedback" role="status">{feedback}</p>}
      {error && <div className="field-error" role="alert"><p>{error}</p><button className="text-action" onClick={() => { if (previewFailed) window.location.reload(); else { setError(""); setRetry(value => value + 1); } }}>{previewFailed ? "Reload React preview" : "Retry React handoff"}</button></div>}
    </div>}
  </details>;
}
