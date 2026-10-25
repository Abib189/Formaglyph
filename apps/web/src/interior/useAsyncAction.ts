// Adapted from ddoemonn/interior, b6b272307464ba79db7183cee0515846d7eb1f9c.
// Copyright (c) 2026 ozzy. MIT; full notice: /licenses/interior.txt.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type ActionStatus = "idle" | "pending" | "success" | "error";

/** Real promise state, an immediate invocation, and stale-completion protection. */
export function useAsyncAction<T>(action: (argument: T) => unknown, resetAfter = 1600) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const phase = useRef<ActionStatus>("idle");
  const sequence = useRef(0);
  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(action);
  useLayoutEffect(() => { latest.current = action; }, [action]);
  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const reset = useCallback(() => {
    sequence.current += 1;
    clear();
    phase.current = "idle";
    setStatus("idle");
  }, [clear]);
  const run = useCallback(async (argument: T) => {
    if (!alive.current || phase.current === "pending") return false;
    clear();
    const ticket = ++sequence.current;
    phase.current = "pending";
    setStatus("pending");
    let ok = false;
    try {
      // Unlike the upstream microtask wrapper, start in the activation handler.
      // Do not weaken clipboard/user-activation behaviour or treat false as success.
      ok = (await latest.current(argument)) !== false;
    } catch { ok = false; }
    if (!alive.current || ticket !== sequence.current) return ok;
    phase.current = ok ? "success" : "error";
    setStatus(phase.current);
    timer.current = setTimeout(() => {
      if (!alive.current || ticket !== sequence.current) return;
      phase.current = "idle";
      setStatus("idle");
    }, resetAfter);
    return ok;
  }, [clear, resetAfter]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; sequence.current += 1; clear(); };
  }, [clear]);
  return { status, run, reset, pending: status === "pending" };
}
