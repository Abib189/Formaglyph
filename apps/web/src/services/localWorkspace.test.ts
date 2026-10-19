import { describe, expect, it } from "vitest";
import { initialAppState } from "../data/catalog";
import { persistLocalWorkspace, readLocalWorkspace } from "./localWorkspace";
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("local workspace snapshots", () => {
  it("keeps the submitted pair immutable when the draft changes", () => {
    const port = storage();
    const state = structuredClone(initialAppState);
    persistLocalWorkspace(state, port);
    const old =
      readLocalWorkspace(port).proposals[0].revisions[0].candidate.variants
        .regular;
    state.candidates[0].variants.regular = "changed unsent draft";
    persistLocalWorkspace(state, port);
    expect(
      readLocalWorkspace(port).proposals[0].revisions[0].candidate.variants
        .regular,
    ).toBe(old);
  });
  it("adds one snapshot per new submission, preserving old candidates", () => {
    const port = storage();
    const state = structuredClone(initialAppState);
    persistLocalWorkspace(state, port);
    state.proposal.candidateId = state.candidates[1].id;
    state.proposal.submittedAt = "2026-10-19T09:00:00Z";
    persistLocalWorkspace(state, port);
    persistLocalWorkspace(state, port);
    expect(readLocalWorkspace(port).proposals[0].revisions).toHaveLength(2);
    expect(
      readLocalWorkspace(port).proposals[0].revisions[1].candidate.id,
    ).toBe(state.candidates[1].id);
  });
  it("retains earlier proposals when a new draft begins", () => {
    const port = storage();
    const state = structuredClone(initialAppState);
    persistLocalWorkspace(state, port);
    state.draft.workspaceIconId = "next";
    state.proposal = {
      ...state.proposal,
      id: "next-proposal",
      status: "draft",
    };
    persistLocalWorkspace(state, port);
    expect(Object.keys(readLocalWorkspace(port).drafts)).toHaveLength(2);
    expect(readLocalWorkspace(port).proposals).toHaveLength(1);
  });
  it("does not rename or repoint a submission while its returned draft is edited", () => {
    const port = storage();
    const state = structuredClone(initialAppState);
    persistLocalWorkspace(state, port);
    const original = readLocalWorkspace(port).proposals[0];
    state.proposal.status = "changes_requested";
    state.draft.name = "unsent-new-name";
    state.proposal.candidateId = state.candidates[1].id;
    persistLocalWorkspace(state, port);
    const stored = readLocalWorkspace(port).proposals[0];
    expect(stored.draft.name).toBe(original.draft.name);
    expect(stored.proposal.candidateId).toBe(original.proposal.candidateId);
    expect(stored.revisions).toHaveLength(1);
  });
});
