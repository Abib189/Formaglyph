import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formaglyphAssets } from "@formaglyph/icons";
import {
  colourIconSvg,
  iconProofBackground,
  normalizeIconColour,
} from "./iconColour";
import { prepareDesignSvg } from "./svg";

describe("icon colour", () => {
  it("normalizes full and short hex without accepting arbitrary CSS or markup", () => {
    expect(normalizeIconColour(" #a10232 ")).toBe("#A10232");
    expect(normalizeIconColour("fff")).toBe("#FFFFFF");
    expect(normalizeIconColour("#0aF")).toBe("#00AAFF");
    for (const value of [
      null,
      "",
      "red",
      "currentColor",
      "#12345",
      "#12345678",
      "url(https://x)",
      '\" onload=\"alert(1)',
      "#GGGGGG",
    ])
      expect(normalizeIconColour(value)).toBeNull();
    expect(() => colourIconSvg("<svg/>", "red")).toThrow();
  });

  it("leaves Auto exports exactly equal to their original source", () => {
    for (const asset of formaglyphAssets)
      expect(colourIconSvg(asset.svg, null)).toBe(asset.svg);
  });

  it("colours stroke and fill while retaining holes, opacity, viewBox, geometry and comments", () => {
    const notice =
      '<!-- MIT: retain fill="currentColor" and <svg> examples -->';
    const svg = `${notice}<svg viewBox="0 0 256 256" fill="none" color="currentColor"><g opacity="0.2"><path fill="currentColor" d="M1 2h3z"/></g><path stroke='currentColor' fill="none" stroke-width="2" d="M4 5h6"/></svg>`;
    const result = colourIconSvg(svg, "#a10232");
    expect(result).toContain(notice);
    expect(result).toContain('viewBox="0 0 256 256"');
    expect(result).toContain('opacity="0.2"');
    expect(result).toContain('fill="none"');
    expect(result).toContain('stroke-width="2" d="M4 5h6"');
    expect(result).toContain('fill="#A10232" d="M1 2h3z"');
    expect(result).toContain('stroke="#A10232"');
    expect(result).not.toContain("background");
    expect(result).not.toContain("<rect");
    expect(svg).toContain('color="currentColor"');
  });

  it("covers implicit SVG fill and keeps self-closing roots well-formed", () => {
    expect(
      colourIconSvg(
        '<svg viewBox="0 0 24 24"><path d="M1 2h3z"/></svg>',
        "#fff",
      ),
    ).toContain('fill="#FFFFFF" color="#FFFFFF"');
    expect(colourIconSvg('<svg viewBox="0 0 24 24"/>', "#000")).toBe(
      '<svg viewBox="0 0 24 24" fill="#000000" color="#000000"/>',
    );
  });

  it("applies fixed colours to every original Regular/Solid pair without changing path geometry", () => {
    for (const asset of formaglyphAssets) {
      const result = colourIconSvg(asset.svg, "#123ABC");
      expect(result).toContain("#123ABC");
      expect(result.match(/\sd="[^"]*"/g)).toEqual(
        asset.svg.match(/\sd="[^"]*"/g),
      );
      expect(result.match(/viewBox="[^"]*"/g)).toEqual(
        asset.svg.match(/viewBox="[^"]*"/g),
      );
    }
  });

  it("retains each upstream licence, duotone opacity and native grid in coloured exports", () => {
    for (const library of ["phosphor", "lucide", "tabler", "heroicons"]) {
      const manifest = JSON.parse(
        readFileSync(
          new URL(
            `../../public/libraries/${library}/catalog.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
      for (const asset of manifest.concepts[0].assets) {
        const source = readFileSync(
          new URL(`../../public${asset.url}`, import.meta.url),
          "utf8",
        );
        const result = colourIconSvg(source, "#123ABC");
        expect(result.match(/<!--[\s\S]*?-->/g)).toEqual(
          source.match(/<!--[\s\S]*?-->/g),
        );
        expect(
          result.match(
            /\s(?:d|viewBox|opacity|fill-opacity|stroke-opacity)="[^"]*"/g,
          ),
        ).toEqual(
          source.match(
            /\s(?:d|viewBox|opacity|fill-opacity|stroke-opacity)="[^"]*"/g,
          ),
        );
      }
    }
  });

  it("labels derivative and original source hashes separately during design handoff", () => {
    const source = formaglyphAssets[0];
    const svg = colourIconSvg(source.svg, "#123ABC");
    const hash = createHash("sha256").update(svg).digest("hex");
    const sourceHash = createHash("sha256").update(source.svg).digest("hex");
    const result = prepareDesignSvg(
      svg,
      {
        ...source,
        contentHash: hash,
        sourceContentHash: sourceHash,
        exportColour: "#123ABC",
      },
      "figma",
    );
    expect(result).toContain(`data-formaglyph-sha256="${hash}"`);
    expect(result).toContain(`data-formaglyph-source-sha256="${sourceHash}"`);
    expect(result).toContain('data-formaglyph-colour="#123ABC"');
    expect(result).toContain('stroke="#123ABC"');
  });

  it("selects a high-contrast proof background for white, yellow, black and burgundy", () => {
    for (const colour of ["#FFFFFF", "#FFFF00"])
      expect(iconProofBackground(colour)).toBe("#000000");
    for (const colour of ["#000000", "#A10232"])
      expect(iconProofBackground(colour)).toBe("#FFFFFF");
  });
});
