import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { resolve } from "node:path";

const probe = createServer().listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise(done => probe.close(done));
const root = resolve(import.meta.dirname, "..");
const child = spawn(process.execPath, [resolve(root, "server.mjs")], { cwd: root, env: { ...process.env, PORT: String(port), VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
child.stderr.on("data", chunk => { logs += chunk; });
try {
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { ready = (await fetch(`${origin}/health`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* server is starting */ }
    if (ready) break;
    if (child.exitCode !== null) throw new Error(`Static server exited: ${logs}`);
    await delay(100);
  }
  assert.ok(ready, `Static server did not start: ${logs}`);
  const index = await fetch(`${origin}/downloads/react/release.json`);
  assert.equal(index.status, 200); assert.equal(index.headers.get("cache-control"), "no-cache");
  const release = await index.json();
  for (const [path, sha, type] of [[release.package.url, release.package.sha256, "application/gzip"], [release.components[0].sourceUrl, release.components[0].sourceSha256, "text/plain; charset=utf-8"]]) {
    const response = await fetch(origin + path, { headers: { "accept-encoding": "gzip" } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), type);
    assert.match(response.headers.get("cache-control"), /immutable/);
    assert.equal(response.headers.get("content-encoding"), null);
    assert.equal(createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex"), sha);
    const head = await fetch(origin + path, { method: "HEAD" });
    assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await fetch(origin + path, { headers: { "if-none-match": head.headers.get("etag") } })).status, 304);
  }
  const missing = await fetch(`${origin}/downloads/react/not-a-release.tgz`);
  assert.equal(missing.status, 404); assert.match(missing.headers.get("content-type"), /application\/json/);
  console.log("Production static server: React source/archive hashes, MIME, immutable caching, HEAD, 304 and missing-artifact 404 passed.");
} finally {
  const exit = once(child, "exit");
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), 12_000); timer.unref();
  await exit; clearTimeout(timer);
}
