// Measurement pattern adapted from Interior tabs.tsx (MIT, copyright 2026 ozzy).
// b6b272307464ba79db7183cee0515846d7eb1f9c; full notice /licenses/interior.txt.
import { useLayoutEffect, useState, type RefObject } from "react";
import * as m from "motion/react-m";
import { motionTiming, useWorkbenchReducedMotion } from "./WorkbenchMotion";

export function NavigationIndicator({ container, active }: { container: RefObject<HTMLElement | null>; active: string }) {
  const [bounds, setBounds] = useState({ left: 0, width: 0 });
  const reduced = useWorkbenchReducedMotion();
  useLayoutEffect(() => {
    const parent = container.current;
    const link = parent?.querySelector<HTMLElement>(".nav-link.active");
    if (!parent || !link) return;
    const read = () => {
      const next = { left: link.offsetLeft, width: link.offsetWidth };
      setBounds(old => old.left === next.left && old.width === next.width ? old : next);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(parent); observer.observe(link);
    return () => observer.disconnect();
  }, [container, active]);
  return bounds.width > 0 ? <m.span className="navigation-indicator" aria-hidden="true" initial={false}
    animate={{ x: bounds.left, width: bounds.width }} transition={reduced ? motionTiming.instant : motionTiming.state} /> : null;
}
