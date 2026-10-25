import { useEffect, type ReactNode } from "react";
import * as m from "motion/react-m";
import { type HTMLMotionProps } from "motion/react";
import { Check } from "@phosphor-icons/react/Check";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import { useAsyncAction, type ActionStatus } from "../interior/useAsyncAction";
import { usePressDepth } from "../interior/usePressDepth";
import { motionTiming, useWorkbenchReducedMotion } from "./WorkbenchMotion";

interface ActionButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "onClick"> {
  label: string;
  icon?: ReactNode;
  onAction: (trigger: HTMLButtonElement) => unknown;
  pendingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  resetKey?: string;
  announce?: boolean;
}

export function ActionButton({ label, icon, onAction, pendingLabel = "Working…", successLabel = "Done", errorLabel = "Try again", resetKey, announce = true, disabled = false, className = "secondary-action", ...props }: ActionButtonProps) {
  const { status, run, reset, pending } = useAsyncAction(async (trigger: HTMLButtonElement) => {
    try { return await onAction(trigger); }
    finally {
      // The clipboard fallback briefly focuses a textarea. Restore only lost
      // focus, never steal it from another control or a newly opened dialog.
      requestAnimationFrame(() => { if (trigger.isConnected && document.activeElement === document.body) trigger.focus({ preventScroll: true }); });
    }
  });
  const reduced = useWorkbenchReducedMotion();
  const press = usePressDepth(disabled || pending);
  useEffect(() => { reset(); }, [resetKey, reset]);
  const faces: { state: ActionStatus; text: string; icon: ReactNode }[] = [
    { state: "idle", text: label, icon },
    { state: "pending", text: pendingLabel, icon: <span className="action-progress-mark" /> },
    { state: "success", text: successLabel, icon: <Check size={16} /> },
    { state: "error", text: errorLabel, icon: <WarningCircle size={16} /> },
  ];
  return <>
    <m.button {...props} {...press.bind} ref={press.ref} type={props.type ?? "button"}
      className={`motion-action ${className}`} disabled={disabled && !pending}
      aria-label={label} aria-busy={pending || undefined} aria-disabled={disabled || pending || undefined}
      data-action-state={status} data-pressed={press.pressed || undefined}
      initial={false}
      onClick={event => { if (disabled || pending) { event.preventDefault(); return; } void run(event.currentTarget); }}>
      <m.span className="action-faces" aria-hidden="true" initial={false} animate={{ y: press.pressed && !reduced ? 1 : 0 }} transition={reduced ? motionTiming.instant : motionTiming.feedback}>{faces.map(face => <m.span key={face.state} className="action-face" initial={false}
        animate={{ opacity: status === face.state ? 1 : 0, y: status === face.state || reduced ? 0 : 2 }}
        transition={reduced ? motionTiming.instant : motionTiming.feedback}>
        {face.icon}<span>{face.text}</span>
      </m.span>)}</m.span>
    </m.button>
    {announce && <span className="sr-only" role="status">{status === "success" ? successLabel : status === "error" ? errorLabel : ""}</span>}
  </>;
}
