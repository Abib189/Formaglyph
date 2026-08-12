import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Play } from "@phosphor-icons/react";
import { MorphIcon, type MorphHandle } from "morphicons/react";
import type { Candidate } from "../domain/types";
import { prepareMorphIcon, svgStrokeWidth } from "../services/morphicons";
import { SvgIcon } from "./IconPreview";

interface MotionCheckProps {
  previous: Candidate | null;
  proposed: Candidate | null;
  previousLabel: string;
  proposedLabel: string;
}

export function MotionCheck({ previous, proposed, previousLabel, proposedLabel }: MotionCheckProps) {
  const previousMorph = useMemo(() => prepareMorphIcon(previous?.variants.regular ?? null), [previous?.variants.regular]);
  const proposedMorph = useMemo(() => prepareMorphIcon(proposed?.variants.regular ?? null), [proposed?.variants.regular]);
  const morphRef = useRef<MorphHandle>(null);
  const frameRef = useRef<number | null>(null);
  const [showProposed, setShowProposed] = useState(true);
  const canMorph = Boolean(previousMorph.icon && proposedMorph.icon);
  const strokeWidth = svgStrokeWidth(proposed?.variants.regular ?? null, 2);

  useEffect(() => {
    setShowProposed(true);
    if (proposedMorph.icon) morphRef.current?.set(proposedMorph.icon);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [previous?.id, proposed?.id, proposedMorph.icon]);

  const play = () => {
    if (!previousMorph.icon || !proposedMorph.icon) return;
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    morphRef.current?.set(previousMorph.icon);
    setShowProposed(false);
    frameRef.current = window.requestAnimationFrame(() => {
      morphRef.current?.morphTo(proposedMorph.icon!, "snappy");
      setShowProposed(true);
      frameRef.current = null;
    });
  };

  const unavailableReason = previous ? previousMorph.reason ?? proposedMorph.reason : "No preceding revision or published baseline exists yet.";

  return (
    <div className="motion-check-body">
      <div className="motion-stage" aria-label="Regular icon revision motion preview">
        <div className="motion-endpoints" aria-hidden="true">
          <span>{previousLabel}</span><ArrowRight size={14} /><span>{proposedLabel}</span>
        </div>
        <div className="motion-icon-frame">
          {canMorph ? (
            <MorphIcon ref={morphRef} icon={proposedMorph.icon!} size={118} strokeWidth={strokeWidth} color="currentColor" spring="snappy" reducedMotion="user" label={`${previousLabel} morphing into ${proposedLabel}`} />
          ) : proposed?.variants.regular ? (
            <SvgIcon svg={proposed.variants.regular} size={118} />
          ) : (
            <small>Regular variant unavailable</small>
          )}
        </div>
        <button className="motion-play" type="button" onClick={play} disabled={!canMorph}><Play size={16} weight="fill" />Replay regular change</button>
      </div>

      <div className="motion-notes">
        <div><span>Regular</span><strong>{canMorph ? "Geometry morph" : "Static comparison"}</strong><p>{canMorph ? "Morphicons is interpolating the exact submitted stroke paths." : unavailableReason}</p></div>
        <div><span>Solid</span><strong>Accessible crossfade</strong><p>Fill silhouettes remain exact; they are never passed into the stroke-only morph engine.</p></div>
      </div>

      <div className="solid-motion-stage" aria-label="Solid icon revision crossfade preview">
        <span>Solid</span>
        <div className="solid-crossfade">
          {previous?.variants.solid ? <SvgIcon svg={previous.variants.solid} size={76} className={showProposed ? "solid-from hidden" : "solid-from"} /> : null}
          {proposed?.variants.solid ? <SvgIcon svg={proposed.variants.solid} size={76} className={showProposed ? "solid-to visible" : "solid-to"} /> : <small>Solid variant unavailable</small>}
        </div>
        <small>{previous?.variants.solid ? `${previousLabel} → ${proposedLabel}` : "No earlier solid baseline"}</small>
      </div>
    </div>
  );
}
