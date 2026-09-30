import { describe, expect, it } from "vitest";
import { emptyCreateSession } from "./createSession";

describe("new icon session", () => {
  it("does not reuse an existing draft or approved proposal", () => {
    const session = emptyCreateSession("2026-09-29T20:00:00.000Z");
    expect(session.draft.workspaceIconId).toBe("");
    expect(session.draft.name).toBe("");
    expect(session.proposal.status).toBe("draft");
    expect(session.proposal.targetVersion).toBe("1.0.0");
  });
});
