// Adapted from ddoemonn/interior, b6b272307464ba79db7183cee0515846d7eb1f9c.
// Copyright (c) 2026 ozzy. MIT; full notice: /licenses/interior.txt.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/** Keep the upstream interruption model; omit tilt, pointer-origin and 3D skin. */
export function usePressDepth(disabled = false) {
  const [pressed, setPressed] = useState(false);
  const [tracking, setTracking] = useState(false);
  const node = useRef<HTMLButtonElement | null>(null);
  const pointer = useRef<number | null>(null);
  const stop = useCallback(() => {
    pointer.current = null;
    setTracking(false);
    setPressed(false);
  }, []);
  useEffect(() => {
    if (!tracking) return;
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointer.current || !node.current) return;
      const rect = node.current.getBoundingClientRect();
      setPressed(event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
    };
    const lift = (event: globalThis.PointerEvent) => { if (event.pointerId === pointer.current) stop(); };
    const hidden = () => { if (document.hidden) stop(); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", lift);
    window.addEventListener("pointercancel", lift);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", lift);
      window.removeEventListener("pointercancel", lift);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [tracking, stop]);
  useEffect(() => { if (disabled) stop(); }, [disabled, stop]);
  const ref = useCallback((next: HTMLButtonElement | null) => { node.current = next; }, []);
  return { pressed, ref, bind: {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointer.current = event.pointerId;
      setTracking(true); setPressed(true);
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!disabled && !event.repeat && (event.key === " " || event.key === "Enter")) { setTracking(true); setPressed(true); }
      if (event.key === "Escape") stop();
    },
    onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => { if ([" ", "Enter", "Escape"].includes(event.key)) stop(); },
    onBlur: stop,
  } };
}
