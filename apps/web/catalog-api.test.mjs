import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createCatalogApi } from "./catalog-api.mjs";

let handleApi;
const origin = "https://api.formaglyph.test";

class ResponseRecorder {
  status = 0;
  headers = new Map();
  chunks = [];

  setHeader(name, value) {
    this.headers.set(name.toLowerCase(), String(value));
  }

  writeHead(status, headers = {}) {
    this.status = status;
    for (const [name, value] of Object.entries(headers)) this.setHeader(name, value);
  }

  end(chunk) {
    if (chunk) this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  text() {
    return Buffer.concat(this.chunks).toString("utf8");
  }

  json() {
    return JSON.parse(this.text());
  }
}

async function request(path, { method = "GET", headers = {}, baseUrl = origin, body } = {}, handler = handleApi) {
  const response = new ResponseRecorder();
  const incoming = {
    method,
    headers,
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) yield Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    },
  };
  await handler(incoming, response, new URL(path, baseUrl));
  return response;
}

beforeAll(async () => {
  handleApi = await createCatalogApi({ catalogRoot: resolve(process.cwd(), "../../packages/icons/assets") });
});

describe("Formaglyph public API v1", () => {
  it("describes a public, read-only core catalog without authentication", async () => {
    const response = await request("/api/v1");
    const body = response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("x-formaglyph-api-version")).toBe("1");
    expect(body.catalogue).toMatchObject({ concepts: 48, assets: 96, licence: "MIT" });
    expect(body.links.mcp.toString()).toBe("https://api.formaglyph.test/mcp");
  });

  it("ranks intent search and paginates with opaque cursors", async () => {
    const first = (await request("/api/v1/icons?q=payment%20successful&variant=regular&limit=1")).json();
    expect(first.data).toHaveLength(1);
    expect(first.data[0]).toMatchObject({ name: "card-check", variant: "regular" });
    expect(first.page.nextCursor).toEqual(expect.any(String));
    const second = (await request(`/api/v1/icons?q=payment%20successful&variant=regular&limit=1&cursor=${first.page.nextCursor}`)).json();
    expect(second.data[0].stableId).not.toBe(first.data[0].stableId);
  });

  it("returns concept metadata with both immutable variant URLs", async () => {
    const response = await request("/api/v1/icons/ico_fg_004_cloud_upload");
    const body = response.json();
    expect(response.status).toBe(200);
    expect(body.variants.map((variant) => variant.variant)).toEqual(["regular", "solid"]);
    expect(body.variants.every((variant) => variant.assetUrl.includes(`/ico_fg_004_cloud_upload/0.1.0/`))).toBe(true);
  });

  it("uses the public HTTPS protocol supplied by a trusted deployment proxy", async () => {
    const response = await request("/api/v1/icons?q=payment&limit=1", {
      baseUrl: "http://api.formaglyph.test",
      headers: { "x-forwarded-proto": "https" },
    });
    expect(response.json().data[0].assetUrl).toMatch(/^https:\/\/api\.formaglyph\.test\//);
  });

  it("serves immutable SVG with content ETags and conditional requests", async () => {
    const assetUrl = "/api/v1/icons/ico_fg_001_check_circle/0.1.0/regular.svg";
    const response = await request(assetUrl);
    const svg = response.text();
    const etag = response.headers.get("etag");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);
    expect(etag).toBe(`"${createHash("sha256").update(svg).digest("hex")}"`);
    expect(Number(response.headers.get("content-length"))).toBe(Buffer.byteLength(svg));
    const unchanged = await request(assetUrl, { headers: { "if-none-match": etag } });
    expect(unchanged.status).toBe(304);
  });

  it("publishes the release manifest and OpenAPI contract", async () => {
    const [manifest, specification] = await Promise.all([
      request("/api/v1/manifest").then((response) => response.json()),
      request("/api/v1/openapi.json").then((response) => response.json()),
    ]);
    expect(manifest).toMatchObject({ schemaVersion: 2, conceptCount: 48, assetCount: 96 });
    expect(manifest.assets).toHaveLength(96);
    expect(specification).toMatchObject({ openapi: "3.1.0", info: { title: "Formaglyph API" } });
    expect(specification.paths["/agent/drafts"].post.security).toEqual([{ projectToken: [] }]);
  });

  it("searches new original concepts and serves their versioned SVG pairs", async () => {
    const result = (await request("/api/v1/icons?q=change%20language&variant=solid")).json();
    expect(result.data[0]).toMatchObject({ name: "globe", version: "0.2.0", variant: "solid" });
    const concept = (await request("/api/v1/icons/ico_fg_048_globe")).json();
    expect(concept.variants.map((asset) => asset.variant)).toEqual(["regular", "solid"]);
    for (const asset of concept.variants) {
      const response = await request(new URL(asset.assetUrl).pathname);
      expect(response.status).toBe(200);
      expect(response.headers.get("etag")).toBe(`"${asset.sha256}"`);
      expect(response.text()).toContain('viewBox="0 0 24 24"');
    }
  });

  it("rejects invalid inputs and every write method", async () => {
    const [badLimit, badCursor, badVariant, write] = await Promise.all([
      request("/api/v1/icons?limit=101"),
      request("/api/v1/icons?cursor=not-a-cursor"),
      request("/api/v1/icons?variant=duotone"),
      request("/api/v1/icons", { method: "POST" }),
    ]);
    expect([badLimit.status, badCursor.status, badVariant.status, write.status]).toEqual([400, 400, 400, 405]);
  });

  it("serves only paired live public releases through the private bucket and stops on visibility revocation", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';
    const sha256 = createHash("sha256").update(svg).digest("hex");
    const asset = {
      stable_id: "ico_live_cloud_upload", canonical_name: "cloud-upload", label: "Cloud upload",
      category: "Files", description: "Upload a file to cloud storage.", directionality: "neutral",
      licence: "MIT", version: "1.0.0", is_current: true,
      byte_size: Buffer.byteLength(svg), sha256, storage_path: "org/project/release/regular.svg",
      tags: ["cloud", "upload"], aliases: [{ locale: "en", value: "upload", reviewed: true }],
    };
    let rows = [{ ...asset, variant: "regular" }, { ...asset, variant: "solid", storage_path: "org/project/release/solid.svg" }];
    let tamperAsset = false;
    let upstreamFails = false;
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/rest/v1/rpc/list_public_catalog_assets")) return new Response(JSON.stringify(rows), { status: upstreamFails ? 500 : 200 });
      if (String(url).includes("/storage/v1/object/authenticated/published-assets/")) return new Response(tamperAsset ? `${svg} ` : svg, { status: 200 });
      throw new Error(`unexpected URL ${url}`);
    });
    try {
      const liveApi = await createCatalogApi({
        catalogRoot: resolve(process.cwd(), "../../packages/icons/assets"),
        publicCatalog: { supabaseUrl: "https://project.supabase.co", publishableKey: "sb_publishable_test" },
      });
      const listed = await request("/api/v1/icons?q=cloud%20upload&variant=regular", {}, liveApi);
      expect(listed.status).toBe(200);
      expect(listed.headers.get("cache-control")).toBe("no-store");
      expect(listed.json().data.some((item) => item.stableId === asset.stable_id)).toBe(true);
      const detail = await request(`/api/v1/icons/${asset.stable_id}`, {}, liveApi);
      expect(detail.json().variants.map((item) => item.variant)).toEqual(["regular", "solid"]);
      expect(detail.text()).not.toContain("storagePath");
      const delivered = await request(`/api/v1/icons/${asset.stable_id}/1.0.0/regular.svg`, {}, liveApi);
      expect(delivered.status).toBe(200);
      expect(delivered.text()).toBe(svg);
      expect(delivered.headers.get("cache-control")).toBe("no-store");
      expect(fetcher.mock.calls.some(([url]) => String(url).includes("/object/public/"))).toBe(false);

      tamperAsset = true;
      const tampered = await request(`/api/v1/icons/${asset.stable_id}/1.0.0/regular.svg`, {}, liveApi);
      expect(tampered.status).toBe(502);
      tamperAsset = false;

      rows = [{ ...asset, variant: "regular" }];
      const incomplete = await request("/api/v1/icons?q=cloud%20upload", {}, liveApi);
      expect(incomplete.json().data.some((item) => item.stableId === asset.stable_id)).toBe(false);
      rows = [];
      const revoked = await request(`/api/v1/icons/${asset.stable_id}/1.0.0/regular.svg`, {}, liveApi);
      expect(revoked.status).toBe(404);
      upstreamFails = true;
      const unavailable = await request("/api/v1/icons", {}, liveApi);
      expect(unavailable.status).toBe(503);
    } finally {
      fetcher.mockRestore();
    }
  });

  it("requires a project token and returns a deterministic human handoff URL", async () => {
    const protectedApi = await createCatalogApi({
      catalogRoot: resolve(process.cwd(), "../../packages/icons/assets"),
      agentDraft: { supabaseUrl: "https://project.supabase.co", publishableKey: "sb_publishable_test" },
    });
    const missing = await request("/api/v1/agent/drafts", {
      method: "POST",
      body: { name: "payment-retry", description: "Retry a recoverable payment." },
    }, protectedApi);
    expect(missing.status).toBe(401);

    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify([{
      draft_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      project_slug: "core",
      draft_name: "payment-retry",
      status: "draft",
      create_path: "/projects/core/create?draft=dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    }]), { status: 200, headers: { "content-type": "application/json" } }));
    const created = await request("/api/v1/agent/drafts", {
      method: "POST",
      headers: { authorization: `Bearer fgp_${"a".repeat(48)}` },
      body: { name: "payment-retry", description: "Retry a recoverable payment.", keywords: ["payment"] },
    }, protectedApi);
    expect(created.status).toBe(201);
    expect(created.json().data).toMatchObject({
      status: "draft",
      handoffUrl: "https://api.formaglyph.test/projects/core/create?draft=dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
    expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty("authorization");
    fetcher.mockRestore();
  });
});
