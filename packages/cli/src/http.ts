import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { FormaglyphCatalogClient, DEFAULT_API_URL } from "./catalog.js";
import { FormaglyphDraftClient } from "./drafts.js";
import { createFormaglyphMcpServer } from "./mcp.js";

export const FORMAGLYPH_MCP_PATH = "/mcp";

export interface McpHttpOptions {
  apiUrl?: string;
  allowedOrigins?: string[];
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function requestOrigin(request: IncomingMessage) {
  const protocolHeader = firstHeader(request.headers["x-forwarded-proto"]);
  const protocol = protocolHeader?.split(",", 1)[0].trim().toLowerCase() === "https" ? "https" : "http";
  const host = firstHeader(request.headers["x-forwarded-host"])?.split(",", 1)[0].trim() || request.headers.host;
  if (!host) return null;
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

function allowedOrigin(request: IncomingMessage, configured: string[]) {
  const value = firstHeader(request.headers.origin);
  if (!value) return null;
  let origin: string;
  try {
    origin = new URL(value).origin;
  } catch {
    return false;
  }
  const sameOrigin = requestOrigin(request);
  const defaults = ["http://localhost:4173", "http://127.0.0.1:4173"];
  return origin === sameOrigin || [...defaults, ...configured].some((candidate) => {
    try {
      return new URL(candidate).origin === origin;
    } catch {
      return false;
    }
  }) ? origin : false;
}

function jsonRpcError(response: ServerResponse, status: number, code: number, message: string) {
  const body = JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null });
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

export async function handleFormaglyphMcpHttp(request: IncomingMessage, response: ServerResponse, options: McpHttpOptions = {}) {
  const origin = allowedOrigin(request, options.allowedOrigins ?? []);
  if (origin === false) {
    jsonRpcError(response, 403, -32000, "Origin is not allowed for this MCP endpoint.");
    return;
  }

  if (origin) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "origin");
  }
  response.setHeader("access-control-expose-headers", "mcp-session-id, mcp-protocol-version");

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "authorization, content-type, mcp-protocol-version, mcp-session-id",
      "access-control-max-age": "86400",
      allow: "POST, OPTIONS",
    });
    response.end();
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("allow", "POST, OPTIONS");
    jsonRpcError(response, 405, -32000, "The public Formaglyph MCP server uses stateless POST requests.");
    return;
  }

  const apiUrl = options.apiUrl ?? process.env.FORMAGLYPH_API_URL ?? DEFAULT_API_URL;
  const authorization = firstHeader(request.headers.authorization);
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const server = createFormaglyphMcpServer(
    new FormaglyphCatalogClient(apiUrl),
    new FormaglyphDraftClient(apiUrl, token),
  );
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response);
  } catch (error) {
    if (!response.headersSent) {
      jsonRpcError(response, 500, -32603, error instanceof Error ? error.message : "Internal MCP server error.");
    }
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}
