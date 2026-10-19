import { useId, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import { normalizeIconColour } from "../services/iconColour";

export function IconColourControl({
  colour,
  onChange,
  label = "Icon colour",
}: {
  colour: string | null;
  onChange: (colour: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const errorId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closePicker = () => {
    setOpen(false);
    window.requestAnimationFrame(() =>
      triggerRef.current?.focus({ preventScroll: true }),
    );
  };
  const updatePicker = (value: string) => {
    const next = normalizeIconColour(value);
    if (!next) return;
    setDraft(next);
    setError("");
    onChange(next);
  };
  return (
    <>
      <button
        ref={triggerRef}
        className="icon-colour-trigger"
        aria-label={`${label}: ${colour ?? "Auto"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(colour ?? "");
          setError("");
          setOpen(true);
        }}
      >
        <span
          className="icon-colour-swatch"
          style={{ background: colour ?? "var(--fg)" }}
          aria-hidden="true"
        />
        <span>Colour</span>
        <code>{colour ?? "Auto"}</code>
      </button>
      {open && (
        <Dialog
          title="Icon colour"
          className="icon-colour-dialog"
          onClose={closePicker}
        >
          <p>
            Applies to icon previews, copied SVGs and downloads. Original
            library assets stay unchanged.
          </p>
          <div className="icon-colour-fields">
            <label>
              <span>Picker</span>
              <input
                type="color"
                aria-label="Pick icon colour"
                value={normalizeIconColour(draft) ?? colour ?? "#000000"}
                onInput={(event) => updatePicker(event.currentTarget.value)}
                onChange={(event) => updatePicker(event.target.value)}
              />
            </label>
            <label>
              <span>Hex colour</span>
              <input
                aria-label="Icon hex colour"
                value={draft}
                placeholder="#A10232"
                spellCheck={false}
                autoComplete="off"
                maxLength={7}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError("");
                  const next = normalizeIconColour(event.target.value);
                  // Commit complete six-digit entries as typed. Shorthand is expanded on blur/Enter.
                  if (next && event.target.value.replace(/^#/, "").length === 6)
                    onChange(next);
                }}
                onBlur={() => {
                  if (!draft && !colour) return;
                  const next = normalizeIconColour(draft);
                  if (next) {
                    setDraft(next);
                    onChange(next);
                  } else
                    setError("Enter a hex colour such as #A10232 or #FFF.");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </label>
          </div>
          {error && (
            <p id={errorId} role="alert" className="field-error">
              {error}
            </p>
          )}
          <div className="icon-colour-actions">
            <button
              className="secondary-action"
              onClick={() => {
                onChange(null);
                setDraft("");
                setError("");
              }}
            >
              Use currentColor
            </button>
            <button
              className="primary-action"
              onClick={() => {
                if (draft) {
                  const next = normalizeIconColour(draft);
                  if (!next) {
                    setError("Enter a hex colour such as #A10232 or #FFF.");
                    return;
                  }
                  onChange(next);
                }
                closePicker();
              }}
            >
              Done
            </button>
          </div>
          <p className="icon-colour-note">
            Auto uses <code>currentColor</code> to follow your theme or website
            text. Fixed colours are kept in exports. Contrast surfaces are
            preview-only; SVG backgrounds remain transparent.
          </p>
        </Dialog>
      )}
    </>
  );
}
