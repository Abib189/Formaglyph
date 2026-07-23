import { describe, expect, it } from "vitest";
import { prepareDesignSvg } from "./svg";

describe("design handoff SVG", () => {
  it("adds stable version metadata and accessible naming without duplicating sizing", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" aria-hidden="true" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';
    const result = prepareDesignSvg(svg, {
      stableId: "ico_fg_002_card_check",
      name: "card-check",
      label: "Card check",
      version: "1.2.0",
      variant: "regular",
      licence: "MIT",
      contentHash: "a".repeat(64),
    }, "figma");
    expect(result).toContain("<title>Card check</title>");
    expect(result).toContain('data-formaglyph-id="ico_fg_002_card_check"');
    expect(result).toContain('data-formaglyph-version="1.2.0"');
    expect(result).toContain('data-formaglyph-target="figma"');
    expect(result.match(/\bwidth=/g)).toHaveLength(1);
    expect(result).not.toContain('aria-hidden="true"');
  });
});
