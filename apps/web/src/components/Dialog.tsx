import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react/X";
import * as m from "motion/react-m";
import { motionTiming, useWorkbenchReducedMotion } from "./WorkbenchMotion";

const scrollLocks = new Set<symbol>();
let previousOverflow = "";
function lockModalScroll() {
  const token = Symbol();
  if (scrollLocks.size === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
  scrollLocks.add(token);
  return () => {
    scrollLocks.delete(token);
    if (scrollLocks.size === 0) document.body.style.overflow = previousOverflow;
  };
}

/** Native modal: focus trap, Escape and focus return stay with the browser. */
export function Dialog({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduced = useWorkbenchReducedMotion();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const unlock = lockModalScroll();
    return () => {
      dialog?.close();
      unlock();
    };
  }, []);
  return createPortal(
    <m.dialog
      ref={ref}
      className={`workbench-dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      aria-label={title}
      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? motionTiming.instant : motionTiming.enter}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <header className="dialog-heading">
          <h2>{title}</h2>
          <button
            className="icon-action"
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </m.dialog>,
    document.body,
  );
}
