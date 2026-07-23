import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const API_VERSION = "1";
const JSON_CACHE = "public, max-age=60, stale-while-revalidate=300";
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

function normalize(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreAsset(query, asset) {
  const phrase = normalize(query);
  if (!phrase) return 1;
  const terms = phrase.split(/\s+/).filter(Boolean);
  const name = normalize(asset.name);
  const label = normalize(asset.label);
  const aliases = asset.aliases.map((alias) => normalize(alias.value));
  const tags = asset.tags.map(normalize);
  const description = normalize(asset.description);
  let score = name === phrase ? 120 : label === phrase ? 90 : aliases.includes(phrase) ? 80 : 0;
  for (const term of terms) {
    if (name.includes(term)) score += 30;
    else if (aliases.some((alias) => alias.includes(term))) score += 22;
    else if (tags.some((tag) => tag === term)) score += 18;
    else if ([name, label, ...aliases, ...tags].some((value) => value.startsWith(term) || term.startsWith(value))) score += 12;
    else if (description.includes(term)) score += 6;
  }
  return score;
}

function encodeCursor(offset) {
  return Buffer.from(`v1:${offset}`).toString("base64url");
}

function decodeCursor(cursor) {
  if (!cursor) return 0;
  try {
    const value = Buffer.from(cursor, "base64url").toString("utf8");
    if (!/^v1:\d+$/.test(value)) return null;
    const offset = Number.parseInt(value.slice(3), 10);
    return Number.isSafeInteger(offset) && offset >= 0 ? offset : null;
  } catch {
    return null;
  }
}

function apiHeaders(cacheControl = "no-store") {
  return {
    "access-control-allow-origin": "*",
    "access-control-expose-headers": "etag, x-formaglyph-api-version",
    "cache-control": cacheControl,
    "cross-origin-resource-policy": "cross-origin",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-formaglyph-api-version": API_VERSION,
  };
}

function sendJson(request, response, status, body, cacheControl = "no-store", extraHeaders = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    ...apiHeaders(cacheControl),
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    ...extraHeaders,
  });
  if (request.method === "HEAD") response.end();
  else response.end(payload);
}

function sendError(request, response, status, code, message) {
  sendJson(request, response, status, { error: { code, message } });
}

async function readJsonBody(request, maxBytes = 32_768) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid_json");
  }
}

function assetPath(asset) {
  return `/api/v1/icons/${asset.stableId}/${asset.version}/${asset.variant}.svg`;
}

function publicOrigin(request, url) {
  const forwarded = Array.isArray(request.headers["x-forwarded-proto"])
    ? request.headers["x-forwarded-proto"][0]
    : request.headers["x-forwarded-proto"];
  const protocol = typeof forwarded === "string" ? forwarded.split(",", 1)[0].trim().toLowerCase() : "";
  if (protocol !== "http" && protocol !== "https") return url.origin;
  const origin = new URL(url.origin);
  origin.protocol = `${protocol}:`;
  return origin.origin;
}

function serializeAsset(asset, origin) {
  const { path: _path, ...metadata } = asset;
  return { ...metadata, assetUrl: new URL(assetPath(asset), origin).toString() };
}

function openApi(origin) {
  return {
    openapi: "3.1.0",
    info: { title: "Formaglyph API", version: "1.1.0", description: "Public access to the MIT-licensed Formaglyph Core catalog plus scoped project draft handoff." },
    servers: [{ url: new URL("/api/v1", origin).toString().replace(/\/$/, "") }],
    components: {
      securitySchemes: {
        projectToken: { type: "http", scheme: "bearer", bearerFormat: "Formaglyph project token" },
      },
    },
    paths: {
      "/icons": {
        get: {
          summary: "Search and list icon assets",
          parameters: ["q", "category", "variant", "limit", "cursor"].map((name) => ({ name, in: "query", schema: { type: name === "limit" ? "integer" : "string" } })),
          responses: { "200": { description: "A paginated icon asset list" } },
        },
      },
      "/icons/{stableId}": { get: { summary: "Get one icon concept and its variants", parameters: [{ name: "stableId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Icon concept" }, "404": { description: "Unknown stable ID" } } } },
      "/icons/{stableId}/{version}/{variant}.svg": { get: { summary: "Get an immutable SVG asset", parameters: ["stableId", "version", "variant"].map((name) => ({ name, in: "path", required: true, schema: { type: "string" } })), responses: { "200": { description: "SVG asset" }, "404": { description: "Unknown asset" } } } },
      "/manifest": { get: { summary: "Get the complete release manifest", responses: { "200": { description: "Content-hashed release manifest" } } } },
      "/agent/drafts": {
        post: {
          summary: "Create a text-only project draft handoff",
          security: [{ projectToken: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "description"],
                  properties: {
                    name: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
                    description: { type: "string", minLength: 3, maxLength: 500 },
                    keywords: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 40 } },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Draft created with a human handoff URL" },
            "401": { description: "Missing, invalid, expired, or revoked project token" },
          },
        },
      },
    },
  };
}

export async function createCatalogApi({ catalogRoot, agentDraft }) {
  const canonicalRoot = resolve(catalogRoot);
  const rawManifest = await readFile(resolve(canonicalRoot, "manifest.json"), "utf8");
  const manifest = JSON.parse(rawManifest);
  const manifestEtag = `"${createHash("sha256").update(rawManifest).digest("hex")}"`;

  return async function handleCatalogApi(request, response, url) {
    if (!url.pathname.startsWith("/api/v1")) return false;

    if (url.pathname === "/api/v1/agent/drafts") {
      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          ...apiHeaders("public, max-age=86400"),
          allow: "POST, OPTIONS",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "authorization, content-type",
        });
        response.end();
        return true;
      }
      if (request.method !== "POST") {
        response.setHeader("allow", "POST, OPTIONS");
        sendError(request, response, 405, "method_not_allowed", "This route accepts POST requests.");
        return true;
      }
      if (!agentDraft?.supabaseUrl || !agentDraft?.publishableKey) {
        sendError(request, response, 503, "agent_handoff_unavailable", "Project draft handoff is not configured.");
        return true;
      }
      const authorization = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
      const token = authorization?.match(/^Bearer\s+(fgp_[a-f0-9]+)$/i)?.[1];
      if (!token) {
        sendError(request, response, 401, "invalid_project_token", "A valid Formaglyph project token is required.");
        return true;
      }

      let body;
      try {
        body = await readJsonBody(request);
      } catch (error) {
        const tooLarge = error instanceof Error && error.message === "request_too_large";
        sendError(request, response, tooLarge ? 413 : 400, tooLarge ? "request_too_large" : "invalid_json", tooLarge ? "The request body cannot exceed 32 KB." : "The request body must be valid JSON.");
        return true;
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendError(request, response, 400, "invalid_request", "A draft name and description are required.");
        return true;
      }

      let upstream;
      try {
        upstream = await fetch(`${agentDraft.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/create_agent_draft`, {
          method: "POST",
          headers: {
            apikey: agentDraft.publishableKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            p_token: token,
            p_name: body.name,
            p_description: body.description,
            p_keywords: Array.isArray(body.keywords) ? body.keywords : [],
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        sendError(request, response, 502, "handoff_service_unavailable", "The project draft handoff service is temporarily unavailable.");
        return true;
      }
      const payload = await upstream.json().catch(() => null);
      if (!upstream.ok) {
        const authorizationFailure = upstream.status === 401 || upstream.status === 403 || payload?.code === "28000";
        sendError(
          request,
          response,
          authorizationFailure ? 401 : 422,
          authorizationFailure ? "invalid_project_token" : "invalid_draft",
          authorizationFailure ? "The project token is invalid, expired, or revoked." : (payload?.message ?? "The draft handoff was rejected."),
        );
        return true;
      }
      const row = Array.isArray(payload) ? payload[0] : payload;
      if (!row?.draft_id || !row?.create_path) {
        sendError(request, response, 502, "invalid_handoff_response", "The draft handoff service returned an invalid response.");
        return true;
      }
      sendJson(request, response, 201, {
        data: {
          draftId: row.draft_id,
          name: row.draft_name,
          projectSlug: row.project_slug,
          status: row.status,
          handoffUrl: new URL(row.create_path, publicOrigin(request, url)).toString(),
        },
      });
      return true;
    }

    if (request.method === "OPTIONS") {
      response.writeHead(204, { ...apiHeaders("public, max-age=86400"), allow: "GET, HEAD, OPTIONS", "access-control-allow-methods": "GET, HEAD, OPTIONS" });
      response.end();
      return true;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("allow", "GET, HEAD, OPTIONS");
      sendError(request, response, 405, "method_not_allowed", "This API is read-only.");
      return true;
    }

    const origin = publicOrigin(request, url);
    if (url.pathname === "/api/v1" || url.pathname === "/api/v1/") {
      sendJson(request, response, 200, {
        name: "Formaglyph API",
        version: API_VERSION,
        access: "public-catalog-with-scoped-draft-handoff",
        catalogue: { name: manifest.name, version: manifest.version, concepts: manifest.conceptCount, assets: manifest.assetCount, licence: manifest.licence },
        links: { icons: new URL("/api/v1/icons", origin), manifest: new URL("/api/v1/manifest", origin), openapi: new URL("/api/v1/openapi.json", origin), mcp: new URL("/mcp", origin), agentDrafts: new URL("/api/v1/agent/drafts", origin) },
      }, JSON_CACHE);
      return true;
    }

    if (url.pathname === "/api/v1/openapi.json") {
      sendJson(request, response, 200, openApi(origin), JSON_CACHE);
      return true;
    }

    if (url.pathname === "/api/v1/manifest") {
      if (request.headers["if-none-match"] === manifestEtag) {
        response.writeHead(304, { ...apiHeaders(JSON_CACHE), etag: manifestEtag });
        response.end();
      } else {
        sendJson(request, response, 200, { ...manifest, assets: manifest.assets.map((asset) => serializeAsset(asset, origin)) }, JSON_CACHE, { etag: manifestEtag });
      }
      return true;
    }

    if (url.pathname === "/api/v1/icons") {
      const query = url.searchParams.get("q") ?? "";
      const category = url.searchParams.get("category");
      const variant = url.searchParams.get("variant");
      const rawLimit = url.searchParams.get("limit") ?? "20";
      const limit = Number.parseInt(rawLimit, 10);
      const offset = decodeCursor(url.searchParams.get("cursor"));
      if (query.length > 200) return sendError(request, response, 400, "invalid_query", "q cannot exceed 200 characters."), true;
      if (!/^\d+$/.test(rawLimit) || !Number.isInteger(limit) || limit < 1 || limit > 100) return sendError(request, response, 400, "invalid_limit", "limit must be an integer from 1 to 100."), true;
      if (offset === null) return sendError(request, response, 400, "invalid_cursor", "cursor is not valid for API v1."), true;
      if (variant && !["regular", "solid"].includes(variant)) return sendError(request, response, 400, "invalid_variant", "variant must be regular or solid."), true;

      const matches = manifest.assets
        .filter((asset) => !category || normalize(asset.category) === normalize(category))
        .filter((asset) => !variant || asset.variant === variant)
        .map((asset) => ({ asset, score: scoreAsset(query, asset) }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score || left.asset.name.localeCompare(right.asset.name) || left.asset.variant.localeCompare(right.asset.variant));
      const page = matches.slice(offset, offset + limit);
      const nextOffset = offset + page.length;
      sendJson(request, response, 200, {
        data: page.map(({ asset, score }) => ({ ...serializeAsset(asset, origin), relevance: score })),
        page: { total: matches.length, limit, nextCursor: nextOffset < matches.length ? encodeCursor(nextOffset) : null },
        query: { q: query, category, variant },
      }, JSON_CACHE);
      return true;
    }

    const svgMatch = url.pathname.match(/^\/api\/v1\/icons\/(ico_[a-z0-9_]+)\/([0-9]+\.[0-9]+\.[0-9]+)\/(regular|solid)\.svg$/);
    if (svgMatch) {
      const [, stableId, version, variant] = svgMatch;
      const asset = manifest.assets.find((item) => item.stableId === stableId && item.version === version && item.variant === variant);
      if (!asset) return sendError(request, response, 404, "asset_not_found", "No published asset matches that stable ID, version, and variant."), true;
      const relativePath = asset.path.replace(/^assets\//, "");
      const filePath = resolve(canonicalRoot, relativePath);
      if (!filePath.startsWith(`${canonicalRoot}${sep}`)) return sendError(request, response, 500, "invalid_manifest_path", "The release manifest contains an invalid asset path."), true;
      const etag = `"${asset.sha256}"`;
      if (request.headers["if-none-match"] === etag) {
        response.writeHead(304, { ...apiHeaders(IMMUTABLE_CACHE), etag });
        response.end();
        return true;
      }
      const svg = await readFile(filePath);
      response.writeHead(200, {
        ...apiHeaders(IMMUTABLE_CACHE),
        "content-type": "image/svg+xml; charset=utf-8",
        "content-length": svg.byteLength,
        "content-security-policy": "default-src 'none'; sandbox",
        etag,
      });
      if (request.method === "HEAD") response.end();
      else response.end(svg);
      return true;
    }

    const detailMatch = url.pathname.match(/^\/api\/v1\/icons\/(ico_[a-z0-9_]+)$/);
    if (detailMatch) {
      const variants = manifest.assets.filter((asset) => asset.stableId === detailMatch[1]);
      if (!variants.length) return sendError(request, response, 404, "icon_not_found", "No published icon uses that stable ID."), true;
      sendJson(request, response, 200, {
        stableId: variants[0].stableId,
        name: variants[0].name,
        label: variants[0].label,
        category: variants[0].category,
        description: variants[0].description,
        tags: variants[0].tags,
        aliases: variants[0].aliases,
        directionality: variants[0].directionality,
        licence: variants[0].licence,
        variants: variants.map((asset) => serializeAsset(asset, origin)),
      }, JSON_CACHE);
      return true;
    }

    sendError(request, response, 404, "route_not_found", "No API v1 route matches this path.");
    return true;
  };
}
