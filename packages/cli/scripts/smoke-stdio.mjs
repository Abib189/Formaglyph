import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const executable = resolve(import.meta.dirname, "../dist/formaglyph-mcp.mjs");
const client = new Client({ name: "formaglyph-stdio-smoke", version: "1.0.0" });

try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [executable], stderr: "pipe" }));
  const [tools, search] = await Promise.all([
    client.listTools(),
    client.callTool({ name: "search_icons", arguments: { query: "protected file", limit: 1 } }),
  ]);
  const result = search.structuredContent?.result;
  console.log(JSON.stringify({
    transport: "stdio",
    tools: tools.tools.map((tool) => tool.name),
    firstMatch: result?.data?.[0]?.stableId,
  }, null, 2));
} finally {
  await client.close();
}
