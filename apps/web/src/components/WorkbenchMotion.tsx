import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { domAnimation, LazyMotion, MotionConfig, useAnimationControls } from "motion/react";

const preference = "(prefers-reduced-motion: reduce)";
const ReducedMotion = createContext(true);
const readPreference = () => window.matchMedia(preference).matches;
const subscribePreference = (notify: () => void) => {
  const query = window.matchMedia(preference);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
export const useWorkbenchReducedMotion = () => useContext(ReducedMotion);

export const motionTiming = {
  feedback: { duration: 0.12, ease: [0.2, 0, 0, 1] as const },
  state: { duration: 0.2, ease: [0.2, 0, 0, 1] as const },
  enter: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
  exit: { duration: 0.14, ease: [0.4, 0, 1, 1] as const },
  instant: { duration: 0 },
};

export function WorkbenchMotion({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribePreference, readPreference, () => true);
  return <ReducedMotion.Provider value={reduced}><MotionConfig reducedMotion={reduced ? "always" : "never"} transition={motionTiming.state}><LazyMotion features={domAnimation} strict>{children}</LazyMotion></MotionConfig></ReducedMotion.Provider>;
}

/** One interruptible result-group fade, not thousands of animated SVGs. */
export function useResultFeedback(identity: string) {
  const controls = useAnimationControls();
  const reduced = useWorkbenchReducedMotion();
  const previous = useRef(identity);
  useEffect(() => {
    if (previous.current === identity) return;
    previous.current = identity;
    controls.stop();
    if (reduced !== false) controls.set({ opacity: 1 });
    else void controls.start({ opacity: [0.78, 1], transition: motionTiming.feedback });
    return () => controls.stop();
  }, [identity, controls, reduced]);
  return controls;
}
