import { describe, expect, it, vi } from "vitest";
import { FormaglyphApiError, FormaglyphCatalogClient } from "./catalog.js";

const asset = {
  stableId: "ico_fg_002_card_check",
  name: "card-check",
  label: "Card check",
  category: "Payments",
  description: "Accepted payment.",
  tags: ["payment"],
  aliases: [],
  directionality: "neutral",
  licence: "MIT",
  provenance: { kind: "original", source: "Formaglyph", disclosed: true },
  variant: "regular",
  version: "0.1.0",
  bytes: 42,
  sha256: "a".repeat(64),
  assetUrl: "https://api.formaglyph.test/api/v1/icons/ico_fg_002_card_check/0.1.0/regular.svg",
} as const;

describe("FormaglyphCatalogClient", () => {
  it("encodes deterministic search filters", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request) => Response.json({ data: [asset], page: { total: 1, limit: 5, nextCursor: null }, query: {} }));
    const client = new FormaglyphCatalogClient("https://api.formaglyph.test/api/v1/", fetcher as typeof fetch);
    const result = await client.search({ query: "payment successful", variant: "regular", category: "Payments", limit: 5 });
    expect(result.data[0].stableId).toBe(asset.stableId);
    expect(String(fetcher.mock.calls[0][0])).toBe("https://api.formaglyph.test/api/v1/icons?q=payment+successful&category=Payments&variant=regular&limit=5");
  });

  it("resolves an immutable variant before fetching SVG", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => String(url).endsWith(".svg")
      ? new Response('<svg viewBox="0 0 24 24"/>', { headers: { "content-type": "image/svg+xml" } })
      : Response.json({ ...asset, variants: [asset] }));
    const client = new FormaglyphCatalogClient("https://api.formaglyph.test/api/v1", fetcher as typeof fetch);
    const result = await client.getSvg(asset.stableId, "regular");
    expect(result.asset.sha256).toBe(asset.sha256);
    expect(result.svg).toContain("<svg");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("rejects insecure remote endpoints and preserves API errors", async () => {
    expect(() => new FormaglyphCatalogClient("http://example.com/api/v1")).toThrow(/HTTPS/);
    expect(() => new FormaglyphCatalogClient("http://localhost:3000/api/v1")).not.toThrow();
    const client = new FormaglyphCatalogClient("https://api.formaglyph.test/api/v1", vi.fn(async () => Response.json({ error: { code: "icon_not_found", message: "Unknown icon." } }, { status: 404 })) as typeof fetch);
    await expect(client.getIcon("ico_missing")).rejects.toMatchObject({ status: 404, code: "icon_not_found", message: "Unknown icon." } satisfies Partial<FormaglyphApiError>);
  });
});
