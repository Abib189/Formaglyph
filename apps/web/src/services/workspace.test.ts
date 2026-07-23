import { describe, expect, it } from "vitest";
import { initialAppState } from "../data/catalog";
import { canTransitionWorkspaceIcon, transitionWorkspaceIcon } from "./workspace";

describe("workspace icon workflow", () => {
  it("allows publication only after approval", () => {
    expect(canTransitionWorkspaceIcon("approved", "published")).toBe(true);
    expect(canTransitionWorkspaceIcon("draft", "published")).toBe(false);
    expect(canTransitionWorkspaceIcon("in_review", "published")).toBe(false);
  });

  it("restores archived icons as drafts", () => {
    const archived = initialAppState.workspace.find((icon) => icon.status === "archived")!;
    const restored = transitionWorkspaceIcon(archived, "draft", new Date("2026-07-21T08:00:00.000Z"));
    expect(restored.status).toBe("draft");
    expect(restored.updatedAt).toBe("2026-07-21T08:00:00.000Z");
  });

  it("rejects skipped review states", () => {
    const draft = initialAppState.workspace.find((icon) => icon.status === "draft")!;
    expect(() => transitionWorkspaceIcon(draft, "approved")).toThrow(/cannot transition/);
  });

  it("keeps deprecation irreversible in the workspace state machine", () => {
    expect(canTransitionWorkspaceIcon("published", "deprecated")).toBe(true);
    expect(canTransitionWorkspaceIcon("deprecated", "published")).toBe(false);
    expect(canTransitionWorkspaceIcon("published", "archived")).toBe(false);
  });
});
