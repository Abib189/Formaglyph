// @vitest-environment happy-dom
import { StrictMode, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAsyncAction } from "./useAsyncAction";
import { usePressDepth } from "./usePressDepth";
import { ActionButton } from "../components/ActionButton";
import { WorkbenchMotion, useWorkbenchReducedMotion } from "../components/WorkbenchMotion";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const strict = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
function pending() {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>(done => { resolve = done; });
  return { promise, resolve };
}

describe("Interior async-action adaptation", () => {
  it("invokes immediately, ignores rapid duplicate activation, and waits for the real promise", async () => {
    vi.useFakeTimers(); const work = pending(); const action = vi.fn(() => work.promise);
    const { result } = renderHook(() => useAsyncAction(action), { wrapper: strict });
    let completion!: Promise<boolean>;
    act(() => { completion = result.current.run(undefined); void result.current.run(undefined); });
    expect(action).toHaveBeenCalledTimes(1); expect(result.current.status).toBe("pending");
    await act(async () => { work.resolve(true); await completion; });
    expect(result.current.status).toBe("success");
    act(() => vi.advanceTimersByTime(1600)); expect(result.current.status).toBe("idle");
  });
  it("treats explicit false and exceptions as failures, then permits a real retry", async () => {
    const action = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(true);
    const { result } = renderHook(() => useAsyncAction(action));
    await act(async () => { await result.current.run(undefined); }); expect(result.current.status).toBe("error");
    await act(async () => { await result.current.run(undefined); }); expect(result.current.status).toBe("error");
    await act(async () => { await result.current.run(undefined); }); expect(result.current.status).toBe("success");
  });
  it("invalidates stale completions after reset and clears timers on unmount", async () => {
    vi.useFakeTimers(); const work = pending();
    const { result, unmount } = renderHook(() => useAsyncAction(() => work.promise));
    let completion!: Promise<boolean>;
    act(() => { completion = result.current.run(undefined); });
    act(() => result.current.reset());
    await act(async () => { work.resolve(true); await completion; });
    expect(result.current.status).toBe("idle"); expect(vi.getTimerCount()).toBe(0);
    await act(async () => { await result.current.run(undefined); });
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it("uses the latest action without deferring its invocation to a microtask", async () => {
    const first = vi.fn(), second = vi.fn();
    const { result, rerender } = renderHook(({ action }) => useAsyncAction(action), { initialProps: { action: first } });
    rerender({ action: second });
    let completion!: Promise<boolean>;
    act(() => { completion = result.current.run("selected"); expect(second).toHaveBeenCalledWith("selected"); });
    await act(async () => { await completion; }); expect(first).not.toHaveBeenCalled();
  });
});

function Press({ disabled = false }: { disabled?: boolean }) {
  const press = usePressDepth(disabled);
  return <button ref={press.ref} {...press.bind} data-pressed={String(press.pressed)}>Press</button>;
}
describe("Interior press interruption adaptation", () => {
  it("cancels pointer presses and ignores secondary mouse buttons", () => {
    render(<Press />); const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { pointerId: 7, pointerType: "mouse", button: 2 }); expect(button.dataset.pressed).toBe("false");
    fireEvent.pointerDown(button, { pointerId: 7, pointerType: "mouse", button: 0 }); expect(button.dataset.pressed).toBe("true");
    fireEvent.pointerCancel(button, { pointerId: 7 }); expect(button.dataset.pressed).toBe("false");
  });
  it("supports keyboard press/release and cancels on window blur or disabling", () => {
    const { rerender } = render(<Press />); const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: " " }); expect(button.dataset.pressed).toBe("true");
    fireEvent.keyUp(button, { key: " " }); expect(button.dataset.pressed).toBe("false");
    fireEvent.keyDown(button, { key: "Enter" }); fireEvent(window, new Event("blur")); expect(button.dataset.pressed).toBe("false");
    fireEvent.keyDown(button, { key: "Enter" }); rerender(<Press disabled />); expect(button.dataset.pressed).toBe("false");
  });
  it("cancels an in-progress pointer gesture when the document becomes hidden", () => {
    render(<Press />); const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { pointerId: 9, pointerType: "touch", button: 0 });
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange")); expect(button.dataset.pressed).toBe("false");
  });
});

describe("Workbench motion contract", () => {
  it("keeps a stable accessible name and announces failure rather than false success", async () => {
    // Business-state/ARIA test: motion timing is verified in real Chromium,
    // rather than relying on Happy DOM's incomplete native-animation lifecycle.
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    vi.spyOn(window, "matchMedia").mockReturnValue({ ...media, matches: true, addEventListener: () => {}, removeEventListener: () => {} } as MediaQueryList);
    render(<WorkbenchMotion><ActionButton label="Copy SVG" onAction={() => false} successLabel="Copied" /></WorkbenchMotion>);
    const button = screen.getByRole("button", { name: "Copy SVG" });
    await act(async () => { fireEvent.click(button); });
    expect(button.dataset.actionState).toBe("error"); expect(screen.getByRole("status").textContent).toBe("Try again");
    expect(screen.getByRole("button", { name: "Copy SVG" })).toBe(button);
    expect(button.querySelectorAll(".action-face")).toHaveLength(4);
  });
  it("reacts to a reduced-motion preference change without remounting product state", () => {
    let matches = false;
    const media = new EventTarget() as MediaQueryList;
    Object.defineProperty(media, "matches", { get: () => matches });
    vi.spyOn(window, "matchMedia").mockReturnValue(media);
    function Read() { const reduced = useWorkbenchReducedMotion(); return <span data-testid="policy">{String(reduced)}</span>; }
    render(<WorkbenchMotion><Read /><input defaultValue="retain me" /></WorkbenchMotion>);
    expect(screen.getByTestId("policy").textContent).toBe("false");
    act(() => { matches = true; media.dispatchEvent(new Event("change")); });
    expect(screen.getByTestId("policy").textContent).toBe("true");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("retain me");
  });
});
