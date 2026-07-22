import { describe, expect, it } from "vitest";
import {
  roleHasScope,
  starterStyleProfile,
  transitionProposal,
  validateIconRecord,
  type IconRecord,
  type Proposal,
} from "./index";

const icon: IconRecord = {
  id: "circle-check",
  stableId: "ico_circle_check",
  name: "circle-check",
  label: "Circle check",
  category: "Status",
  description: "Indicates a successful state.",
  tags: ["success"],
  aliases: [{ locale: "en", value: "success", reviewed: true }],
  version: "1.0.0",
  variant: "regular",
  directionality: "neutral",
  licence: "MIT",
  status: "published",
  provenance: { kind: "original", source: "Formaglyph", disclosed: true },
};

const proposal: Proposal = {
  id: "prp_001",
  draftId: "draft_001",
  status: "in_review",
  candidateId: "candidate_001",
  targetVersion: "1.1.0",
  comments: [],
  submittedAt: "2026-07-20T10:00:00.000Z",
  decidedAt: null,
};

describe("canonical Formaglyph contracts", () => {
  it("accepts a complete, versioned icon record", () => {
    expect(validateIconRecord(icon)).toEqual([]);
    expect(starterStyleProfile.variants).toEqual(["regular", "solid"]);
  });

  it("keeps publish rights out of agent defaults", () => {
    expect(roleHasScope("agent", "proposals:write")).toBe(true);
    expect(roleHasScope("agent", "releases:publish")).toBe(false);
  });

  it("records proposal decisions through the shared state machine", () => {
    const now = new Date("2026-07-20T18:00:00.000Z");
    expect(transitionProposal(proposal, "approved", now).decidedAt).toBe(now.toISOString());
  });

  it("keeps rejection terminal and publication admin-gated after approval", () => {
    const approved = transitionProposal(proposal, "approved");
    expect(transitionProposal(approved, "published").status).toBe("published");
    expect(() => transitionProposal({ ...proposal, status: "rejected" }, "in_review")).toThrow();
  });
});
