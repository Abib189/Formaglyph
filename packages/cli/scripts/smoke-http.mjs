import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = new URL(process.argv[2] ?? "http://127.0.0.1:4180/mcp");
const client = new Client({ name: "formaglyph-http-smoke", version: "1.0.0" });

try {
  await client.connect(new StreamableHTTPClientTransport(endpoint));
  const [tools, resources, prompts, search] = await Promise.all([
    client.listTools(),
    client.listResources(),
    client.listPrompts(),
    client.callTool({ name: "search_icons", arguments: { query: "payment successful", variant: "regular", limit: 1 } }),
  ]);
  const result = search.structuredContent?.result;
  console.log(JSON.stringify({
    endpoint: endpoint.toString(),
    tools: tools.tools.map((tool) => tool.name),
    resources: resources.resources.map((resource) => resource.uri),
    prompts: prompts.prompts.map((prompt) => prompt.name),
    firstMatch: result?.data?.[0]?.stableId,
  }, null, 2));
} finally {
  await client.close();
}
