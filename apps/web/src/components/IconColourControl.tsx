import {
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { Dialog } from "./Dialog";
import { normalizeIconColour } from "../services/iconColour";
import {
  clampUnit,
  hexToHsv,
  hsvToHex,
  type HsvColour,
} from "../services/colourSpace";

const brandColours = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Burgundy", value: "#A10232" },
];

interface PreviewProps {
  previewLabel: string;
  renderPreview: (colour: string | null) => ReactNode;
}

/** A locally responsive editor; URL navigation may be deferred during pointer input. */
function ColourEditor({
  colour,
  onChange,
  onClose,
  previewLabel,
  renderPreview,
}: PreviewProps & {
  colour: string | null;
  onChange: (colour: string | null) => void;
  onClose: () => void;
}) {
  const [hsv, setHsv] = useState(() => hexToHsv(colour ?? "#A10232"));
  const [fixed, setFixed] = useState(colour !== null);
  const [draft, setDraft] = useState(colour ?? "");
  const [error, setError] = useState("");
  const errorId = useId();
  const hexId = useId();
  const currentHex = hsvToHex(hsv);
  const commitHsv = (next: HsvColour) => {
    const hex = hsvToHex(next);
    setHsv(next);
    setDraft(hex);
    setFixed(true);
    setError("");
    onChange(hex);
  };
  const commitHex = (value: string) => {
    const hex = normalizeIconColour(value);
    if (!hex) {
      setError("Use a hex colour such as #A10232 or #FFF.");
      return false;
    }
    setHsv(hexToHsv(hex, hsv.h));
    setDraft(hex);
    setFixed(true);
    setError("");
    onChange(hex);
    return true;
  };
  const chooseAuto = () => {
    setFixed(false);
    setDraft("");
    setError("");
    onChange(null);
  };
  const pointAtSpectrum = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    commitHsv({
      ...hsv,
      s: clampUnit((event.clientX - rect.left) / rect.width),
      v: 1 - clampUnit((event.clientY - rect.top) / rect.height),
    });
  };
  return (
    <>
      <div className="colour-mode" role="group" aria-label="Colour behaviour">
        <button type="button" aria-pressed={!fixed} onClick={chooseAuto}>
          Auto <code>currentColor</code>
        </button>
        <button
          type="button"
          aria-pressed={fixed}
          onClick={() => commitHex(currentHex)}
        >
          Fixed colour
        </button>
      </div>
      <div className="colour-live-proof">
        <div className="colour-proof-icon">
          {renderPreview(fixed ? currentHex : null)}
        </div>
        <div>
          <span className="colour-micro-label">Live preview</span>
          <code title={previewLabel}>{previewLabel}</code>
        </div>
        <span className="colour-proof-value">
          {fixed ? currentHex : "Auto"}
        </span>
      </div>
      <div
        className="colour-spectrum"
        aria-hidden="true"
        style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointAtSpectrum(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            pointAtSpectrum(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        <span
          className="colour-spectrum-thumb"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: currentHex,
          }}
        />
      </div>
      <label className="colour-hue">
        <span className="sr-only">Hue</span>
        <input
          aria-label="Hue"
          aria-valuetext={`${Math.round(hsv.h)} degrees`}
          type="range"
          min="0"
          max="360"
          step="1"
          value={hsv.h}
          onChange={(event) =>
            commitHsv({ ...hsv, h: Number(event.target.value) })
          }
        />
      </label>
      <div className="colour-value-fields">
        <div className="colour-hex">
          <label htmlFor={hexId}>Hex</label>
          <div>
            <input
              type="color"
              aria-label="Pick icon colour"
              value={currentHex}
              onInput={(event) => commitHex(event.currentTarget.value)}
              onChange={(event) => commitHex(event.target.value)}
            />
            <input
              id={hexId}
              aria-label="Icon hex colour"
              value={draft}
              placeholder="Auto"
              spellCheck={false}
              autoComplete="off"
              maxLength={7}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
                if (
                  event.target.value.replace(/^#/, "").length === 6 &&
                  normalizeIconColour(event.target.value)
                )
                  commitHex(event.target.value);
              }}
              onBlur={() => {
                if (draft) commitHex(draft);
                else if (fixed) setError("Enter a hex colour, or choose Auto.");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          </div>
        </div>
        <label>
          <span>Sat %</span>
          <input
            aria-label="Saturation"
            type="number"
            min="0"
            max="100"
            step="1"
            value={Math.round(hsv.s * 100)}
            onChange={(event) =>
              commitHsv({
                ...hsv,
                s: clampUnit(Number(event.target.value) / 100),
              })
            }
          />
        </label>
        <label>
          <span>Value %</span>
          <input
            aria-label="Brightness"
            type="number"
            min="0"
            max="100"
            step="1"
            value={Math.round(hsv.v * 100)}
            onChange={(event) =>
              commitHsv({
                ...hsv,
                v: clampUnit(Number(event.target.value) / 100),
              })
            }
          />
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="field-error colour-error">
          {error}
        </p>
      )}
      <div className="colour-brand-palette">
        <span className="colour-micro-label">Formaglyph palette</span>
        <div>
          {brandColours.map(({ name, value }) => (
            <button
              key={value}
              type="button"
              aria-label={`Use ${name} ${value}`}
              aria-pressed={fixed && currentHex === value}
              onClick={() => commitHex(value)}
            >
              <span style={{ background: value }} aria-hidden="true" />
              {name}
            </button>
          ))}
        </div>
      </div>
      <footer className="colour-panel-footer">
        <p>
          {fixed
            ? "Applied to previews & SVG exports."
            : "Follows your theme or text colour."}
          <span>SVG export · originals unchanged.</span>
        </p>
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            if ((fixed || draft) && (!draft || !commitHex(draft))) {
              if (!draft) setError("Enter a hex colour, or choose Auto.");
              return;
            }
            onClose();
          }}
        >
          Done
        </button>
      </footer>
    </>
  );
}

export function IconColourControl({
  colour,
  onChange,
  label = "Icon colour",
  previewLabel,
  renderPreview,
}: PreviewProps & {
  colour: string | null;
  onChange: (colour: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closePicker = () => {
    setOpen(false);
    window.requestAnimationFrame(() =>
      triggerRef.current?.focus({ preventScroll: true }),
    );
  };
  return (
    <>
      <button
        ref={triggerRef}
        className="icon-colour-trigger"
        aria-label={`${label}: ${colour ?? "Auto"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span
          className={`icon-colour-swatch${colour ? "" : " is-auto"}`}
          style={colour ? { background: colour } : undefined}
          aria-hidden="true"
        />
        <span>Colour</span>
        <code>{colour ?? "Auto"}</code>
        <CaretDown size={12} aria-hidden="true" />
      </button>
      {open && (
        <Dialog
          title="Icon colour"
          className="icon-colour-dialog"
          onClose={closePicker}
        >
          <ColourEditor
            colour={colour}
            onChange={onChange}
            onClose={closePicker}
            previewLabel={previewLabel}
            renderPreview={renderPreview}
          />
        </Dialog>
      )}
    </>
  );
}
