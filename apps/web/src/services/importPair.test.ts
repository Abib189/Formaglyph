import { describe, expect, it } from "vitest";
import { importSvgPair } from "./importPair";
const regular =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4H20V20H4Z"/></svg>';
const solid =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>';
describe("paired import", () => {
  it("keeps distinct geometry in one candidate", () => {
    const result = importSvgPair({ name: "Compact", regular, solid });
    expect(result.name).toBe("Compact");
    expect(result.variants.regular).toContain("path");
    expect(result.variants.solid).toContain("circle");
    expect(result.provenance.adapter).toBe("manual_import");
  });
  it("never invents a missing sibling", () => {
    expect(
      importSvgPair({ name: "Partial", regular, solid: null }).variants.solid,
    ).toBeNull();
  });
  it("rejects empty and unsafe imports", () => {
    expect(() =>
      importSvgPair({ name: "Empty", regular: null, solid: null }),
    ).toThrow();
    expect(() =>
      importSvgPair({
        name: "Unsafe",
        regular: "<svg><script>alert(1)</script></svg>",
        solid,
      }),
    ).toThrow();
  });
});
