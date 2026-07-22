import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
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

async function request(path, { method = "GET", headers = {} } = {}) {
  const response = new ResponseRecorder();
  await handleApi({ method, headers }, response, new URL(path, origin));
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
    expect(body.catalogue).toMatchObject({ concepts: 12, assets: 24, licence: "MIT" });
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
    expect(manifest).toMatchObject({ schemaVersion: 2, conceptCount: 12, assetCount: 24 });
    expect(manifest.assets).toHaveLength(24);
    expect(specification).toMatchObject({ openapi: "3.1.0", info: { title: "Formaglyph Public API" } });
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
});
