import { describe, expect, it } from "vitest";
import { hydratePersistedCandidate, sha256Text, type PersistedCandidateAsset } from "./candidateAsset";

const svg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18"/></svg>';
const persisted: PersistedCandidateAsset = {
  id: "candidate-live",
  name: "Balanced",
  description: "The submitted proposal geometry.",
  variant: "regular",
  issue: null,
  provenance: {
    kind: "generated",
    adapter: "local_geometry",
    model: "Formaglyph Local Geometry 0.1",
    promptHash: "a".repeat(64),
    generationJobId: "job-live",
    disclosed: true,
  },
  generationJobId: "job-live",
  promptSha256: "a".repeat(64),
  createdAt: "2026-07-23T23:17:42.000Z",
};

describe("persisted candidate hydration", () => {
  it("returns every exact stored variant with its persisted provenance", async () => {
    const solidSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12h18"/></svg>';
    const candidate = await hydratePersistedCandidate(persisted, [
      { variant: "regular", svg, expectedSha256: await sha256Text(svg) },
      { variant: "solid", svg: solidSvg, expectedSha256: await sha256Text(solidSvg) },
    ]);

    expect(candidate).toMatchObject({
      id: "candidate-live",
      name: "Balanced",
      provenance: {
        kind: "generated",
        adapter: "local_geometry",
        model: "Formaglyph Local Geometry 0.1",
        generationJobId: "job-live",
      },
    });
    expect(candidate.variants.regular).toContain('viewBox="0 0 24 24"');
    expect(candidate.variants.solid).toContain('fill="currentColor"');
  });

  it("rejects content that does not match the immutable asset hash", async () => {
    await expect(hydratePersistedCandidate(persisted, [
      { variant: "regular", svg, expectedSha256: "0".repeat(64) },
    ])).rejects.toThrow(/integrity check/i);
  });

  it("normalizes legacy import provenance without trusting missing fields", async () => {
    const candidate = await hydratePersistedCandidate({
      ...persisted,
      provenance: { kind: "import", disclosed: true },
      generationJobId: null,
      promptSha256: null,
    }, [{ variant: "regular", svg, expectedSha256: await sha256Text(svg) }]);

    expect(candidate.provenance).toEqual({
      kind: "imported",
      adapter: "manual_import",
      model: "Manual SVG import",
      promptHash: null,
      generationJobId: null,
      disclosed: true,
    });
  });
});
