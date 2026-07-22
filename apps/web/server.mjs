import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const root = resolve(fileURLToPath(new URL("./dist", import.meta.url)));
const configuredPort = Number.parseInt(process.env.PORT ?? "3000", 10);
const port = Number.isFinite(configuredPort) ? configuredPort : 3000;
const host = "0.0.0.0";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function safePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const candidate = resolve(root, `.${decoded}`);
  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : null;
}

async function existingFile(pathname) {
  const candidate = safePath(pathname);
  if (!candidate) return null;
  try {
    const details = await stat(candidate);
    if (details.isFile()) return { path: candidate, details };
    if (details.isDirectory()) {
      const indexPath = resolve(candidate, "index.html");
      const indexDetails = await stat(indexPath);
      if (indexDetails.isFile()) return { path: indexPath, details: indexDetails };
    }
  } catch {
    return null;
  }
  return null;
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (url.pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("allow", "GET, HEAD");
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  const requested = await existingFile(url.pathname);
  if (!requested && url.pathname.startsWith("/assets/")) {
    sendJson(response, 404, { error: "asset_not_found" });
    return;
  }
  const fallback = requested ?? await existingFile("/index.html");
  if (!fallback) {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  const extension = extname(fallback.path).toLowerCase();
  const etag = `W/\"${fallback.details.size.toString(16)}-${Math.floor(fallback.details.mtimeMs).toString(16)}\"`;
  if (request.headers["if-none-match"] === etag) {
    response.writeHead(304);
    response.end();
    return;
  }

  const compressible = new Set([".css", ".html", ".js", ".json", ".map", ".svg"]);
  const gzip = compressible.has(extension) && /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers["accept-encoding"] ?? "");
  const headers = {
    "content-type": contentTypes.get(extension) ?? "application/octet-stream",
    "cache-control": url.pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
    "etag": etag,
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  };
  if (gzip) headers["content-encoding"] = "gzip";
  else headers["content-length"] = fallback.details.size;
  response.writeHead(200, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(fallback.path);
  stream.on("error", () => response.destroy());
  if (gzip) stream.pipe(createGzip()).pipe(response);
  else stream.pipe(response);
});

server.listen(port, host, () => {
  console.log(`Formaglyph listening on ${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
