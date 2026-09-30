import { describe, expect, it } from "vitest";
import type { Candidate } from "../domain/types";
import { selectReviewAssets } from "./reviewAssets";

function candidate(id: string, kind: Candidate["provenance"]["kind"]): Candidate {
  return {
    id,
    name: id,
    description: "",
    variants: { regular: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0"/></svg>`, solid: null },
    issue: null,
    provenance: {
      kind,
      adapter: kind === "imported" ? "manual_import" : "local_geometry",
      model: "test",
      promptHash: null,
      generationJobId: null,
      disclosed: true,
    },
    createdAt: "2026-07-24T00:00:00.000Z",
  };
}

describe("review asset selection", () => {
  it("selects the proposal candidate by immutable candidate ID", () => {
    const submitted = candidate("submitted", "generated");
    const unrelated = candidate("fixture", "reference");

    expect(selectReviewAssets([unrelated, submitted], "submitted")).toEqual({
      proposed: submitted,
      current: unrelated,
    });
  });

  it("does not substitute an unrelated candidate when the submitted ID is absent", () => {
    expect(selectReviewAssets([candidate("fixture", "reference")], "missing")).toEqual({
      proposed: undefined,
      current: undefined,
    });
  });

  it("leaves the baseline empty for a brand-new icon", () => {
    const submitted = candidate("submitted", "generated");

    expect(selectReviewAssets([submitted], "submitted")).toEqual({
      proposed: submitted,
      current: undefined,
    });
  });
});
