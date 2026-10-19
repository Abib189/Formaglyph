import { describe, expect, it, vi } from "vitest";
import { SvgValidationError } from "@formaglyph/validators";
import { generationPrompt, importSvgCandidate, LocalGeometryAdapter, sha256Text } from "./generation";

const brief = {
  name: "cloud-approve",
  description: "Cloud outline with a completion check for a successful upload.",
  keywords: "cloud, upload, complete, check",
};

describe("local geometry generation", () => {
  it("creates deterministic, validated Regular and Solid candidates without a network call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const adapter = new LocalGeometryAdapter();
    const first = await adapter.generate({ brief, candidateCount: 3 });
    const second = await adapter.generate({ brief, candidateCount: 3 });
    expect(first).toHaveLength(3);
    expect(first.map((candidate) => candidate.variants)).toEqual(second.map((candidate) => candidate.variants));
    expect(first.every((candidate) => candidate.variants.regular?.includes('viewBox="0 0 24 24"'))).toBe(true);
    expect(first.every((candidate) => candidate.variants.solid?.includes('fill="currentColor"'))).toBe(true);
    expect(first[0].provenance).toMatchObject({ kind: "generated", adapter: "local_geometry", disclosed: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("reports cancellable work through the common adapter contract", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(new LocalGeometryAdapter().generate({ brief }, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
  });

  it("hashes the exact structured prompt used for provenance", async () => {
    const prompt = generationPrompt(brief);
    expect(prompt).toContain("Icon: cloud-approve");
    expect(await sha256Text(prompt)).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("SVG import", () => {
  it("normalizes a safe SVG into the selected variant", () => {
    const candidate = importSvgCandidate('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18"/></svg>', "regular", "line.svg");
    expect(candidate.variants.regular).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(candidate.variants.solid).toBeNull();
    expect(candidate.provenance.kind).toBe("imported");
  });

  it("rejects active SVG content before preview", () => {
    expect(() => importSvgCandidate('<svg viewBox="0 0 24 24" onload="alert(1)"/>', "regular", "unsafe.svg")).toThrow(SvgValidationError);
  });
});
