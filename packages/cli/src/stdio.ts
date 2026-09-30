import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FormaglyphCatalogClient } from "./catalog.js";
import { createFormaglyphMcpServer } from "./mcp.js";

export async function startStdioServer(apiUrl = process.env.FORMAGLYPH_API_URL) {
  const server = createFormaglyphMcpServer(new FormaglyphCatalogClient(apiUrl));
  await server.connect(new StdioServerTransport());
  return server;
}

function isDirectInvocation() {
  return Boolean(process.argv[1]) && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
}

if (isDirectInvocation()) {
  startStdioServer().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
