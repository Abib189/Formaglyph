import { describe, expect, it } from "vitest";
import { sanitizeAndValidateSvg } from "./svg";
import { sanitizeAndValidateCatalogSvg } from "./catalogSvg";

const mask = '<mask id="LocalMask" fill="currentColor"><path d="M1 1h13v13H1z"/></mask>';
const svg = (body: string) => `<svg viewBox="0 0 15 15" aria-hidden="true">${body}</svg>`;
const path = '<path fill="currentColor" d="M1 1h13v13H1z" mask="url(#LocalMask)"/>';
describe("hash-verified catalogue local masks", () => {
  it("retains Health Icons' root-level empty-paint masks with multiple rule-bearing paths", () => {
    const definition = '<mask id="HealthMask" fill="none"><path d="M1 1h13v13H1z"/><path d="M2 2h10v10H2z" fill-rule="evenodd" clip-rule="evenodd"/></mask>';
    const source = svg(definition + path.replace("LocalMask", "HealthMask"));
    const result = sanitizeAndValidateCatalogSvg(source, { targetViewBox: [0, 0, 15, 15] });
    expect(result.status).toBe("passed");
    expect(result.normalizedSvg).toContain('<mask id="HealthMask" fill="none">');
    expect(result.normalizedSvg).toContain('clip-rule="evenodd"');
    expect(result.normalizedSvg).toContain('fill-rule="evenodd"');
    expect(result.measurements.paths).toBe(3);
    expect(sanitizeAndValidateCatalogSvg(result.normalizedSvg!, { targetViewBox: [0, 0, 15, 15] }).normalizedSvg).toBe(result.normalizedSvg);
    expect(sanitizeAndValidateSvg(source).safe).toBe(false);
    expect(sanitizeAndValidateCatalogSvg(source.replace('fill-rule="evenodd"', 'onclick="alert(1)"')).safe).toBe(false);
  });
  it("preserves path masks deterministically while normal uploads reject them", () => {
    const source = svg(mask + path);
    expect(sanitizeAndValidateSvg(source).safe).toBe(false);
    const result = sanitizeAndValidateCatalogSvg(source, { targetViewBox: [0, 0, 15, 15] });
    expect(result.status).toBe("passed");
    expect(result.normalizedSvg).toContain(mask);
    expect(result.normalizedSvg).toContain('mask="url(#LocalMask)"');
    expect(sanitizeAndValidateCatalogSvg(result.normalizedSvg!, { targetViewBox: [0, 0, 15, 15] }).normalizedSvg).toBe(result.normalizedSvg);
  });
  it.each([
    mask + path.replace("#LocalMask", "https://example.com/mask"),
    mask + path.replace("#LocalMask", "#Unknown"),
    mask + mask + path,
    mask.replace('fill="currentColor"', 'fill="red"') + path,
    mask.replace('<path d=', '<path onload="alert(1)" d=') + path,
    mask + path.replace('d="M1 1h13v13H1z"', 'd="javascript:alert(1)"'),
    `<g>${mask}</g>${path}`,
    mask + path + '<script>alert(1)</script>',
    mask + '<g mask="url(#LocalMask)"><path d="M0 0h1"/></g>',
    mask + path + '<use href="https://example.com/shape.svg"/>',
  ])("rejects unsupported or unsafe references", body => {
    const result = sanitizeAndValidateCatalogSvg(svg(body));
    expect(result.safe).toBe(false);
    expect(result.normalizedSvg).toBeNull();
  });
  it("keeps complexity and byte limits", () => {
    expect(sanitizeAndValidateCatalogSvg(svg(mask + path), { maxBytes: 10 }).status).toBe("failed");
    expect(sanitizeAndValidateCatalogSvg(svg(mask + path), { maxElements: 3 }).status).toBe("failed");
    expect(sanitizeAndValidateCatalogSvg(svg(mask + path), { maxDepth: 2 }).status).toBe("failed");
  });
  it("retains fixed white source details only in catalogue mode, never user uploads", () => {
    const artwork = svg('<g fill="none"><path d="M0 0h15v15H0z" fill="currentColor"/><path fill="#fff" stroke="#fff" d="M2 2h1"/></g>');
    const result = sanitizeAndValidateCatalogSvg(artwork);
    expect(result.status).toBe("passed");
    expect(result.normalizedSvg).toContain('fill="#fff"');
    expect(result.normalizedSvg).toContain('stroke="#fff"');
    expect(sanitizeAndValidateCatalogSvg(result.normalizedSvg!).normalizedSvg).toBe(result.normalizedSvg);
    expect(sanitizeAndValidateSvg(artwork).status).toBe("failed");
    expect(sanitizeAndValidateCatalogSvg(artwork.replaceAll("#fff", "url(https://example.com/paint)")).safe).toBe(false);
    expect(sanitizeAndValidateCatalogSvg(artwork.replaceAll("#fff", "red")).status).toBe("failed");
  });
});
