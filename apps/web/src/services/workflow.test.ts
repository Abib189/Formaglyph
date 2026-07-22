import { describe, expect, it } from "vitest";
import { initialAppState } from "../data/catalog";
import { canTransitionProposal, transitionProposal } from "./workflow";

describe("proposal state machine", () => {
  it("allows a proposal to be approved only from review", () => {
    expect(canTransitionProposal("in_review", "approved")).toBe(true);
    expect(canTransitionProposal("draft", "approved")).toBe(false);
  });

  it("records a durable decision timestamp", () => {
    const now = new Date("2026-07-20T18:00:00.000Z");
    const approved = transitionProposal(initialAppState.proposal, "approved", now);
    expect(approved.status).toBe("approved");
    expect(approved.decidedAt).toBe(now.toISOString());
  });

  it("rejects invalid transitions", () => {
    expect(() => transitionProposal({ ...initialAppState.proposal, status: "approved" }, "in_review")).toThrow(/cannot transition/);
  });
});
