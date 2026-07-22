import { describe, expect, it } from "vitest";
import { handleFormaglyphMcpHttp } from "./http.js";

class ResponseRecorder {
  status = 0;
  headersSent = false;
  headers = new Map<string, string>();
  body = "";
  setHeader(name: string, value: string | number | readonly string[]) { this.headers.set(name.toLowerCase(), String(value)); return this; }
  writeHead(status: number, headers: Record<string, string> = {}) { this.status = status; this.headersSent = true; Object.entries(headers).forEach(([name, value]) => this.setHeader(name, value)); return this; }
  end(chunk?: string | Buffer) { if (chunk) this.body += chunk.toString(); return this; }
}

function request(method: string, headers: Record<string, string> = {}) {
  return { method, headers: { host: "formaglyph.test", "x-forwarded-proto": "https", ...headers } };
}

describe("Formaglyph MCP HTTP boundary", () => {
  it("rejects cross-origin browser requests", async () => {
    const response = new ResponseRecorder();
    await handleFormaglyphMcpHttp(request("POST", { origin: "https://attacker.test" }) as never, response as never);
    expect(response.status).toBe(403);
    expect(JSON.parse(response.body).error.message).toContain("Origin");
  });

  it("advertises only stateless POST and preflight", async () => {
    const getResponse = new ResponseRecorder();
    await handleFormaglyphMcpHttp(request("GET") as never, getResponse as never);
    expect(getResponse.status).toBe(405);
    expect(getResponse.headers.get("allow")).toBe("POST, OPTIONS");

    const optionsResponse = new ResponseRecorder();
    await handleFormaglyphMcpHttp(request("OPTIONS", { origin: "https://formaglyph.test" }) as never, optionsResponse as never);
    expect(optionsResponse.status).toBe(204);
    expect(optionsResponse.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  });
});
