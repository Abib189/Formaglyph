import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormaglyphCatalogClient } from "./catalog.js";
import type { FormaglyphDraftClient } from "./drafts.js";
import { createFormaglyphMcpServer } from "./mcp.js";

const asset = {
  stableId: "ico_fg_002_card_check",
  name: "card-check",
  label: "Card check",
  category: "Payments",
  description: "Accepted payment.",
  licence: "MIT",
  variant: "regular",
  version: "0.1.0",
  assetUrl: "https://api.formaglyph.test/icon.svg",
};

let client: Client;
let server: ReturnType<typeof createFormaglyphMcpServer>;

beforeEach(async () => {
  const catalog = {
    search: vi.fn(async () => ({ data: [asset], page: { total: 1, limit: 12, nextCursor: null }, query: { q: "payment", category: null, variant: null } })),
    getIcon: vi.fn(async () => ({ ...asset, variants: [asset] })),
    getSvg: vi.fn(async () => ({ asset, svg: '<svg viewBox="0 0 24 24"/>' })),
    listCategories: vi.fn(async () => ["Files", "Payments"]),
    getManifest: vi.fn(async () => ({ name: "Formaglyph Core", version: "0.1.0", assets: [asset] })),
  } as unknown as FormaglyphCatalogClient;
  const drafts = {
    createDraft: vi.fn(async () => ({
      draftId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      name: "payment-retry",
      projectSlug: "core",
      status: "draft",
      handoffUrl: "https://formaglyph.test/projects/core/create?draft=dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    })),
  } as unknown as FormaglyphDraftClient;
  server = createFormaglyphMcpServer(catalog, drafts);
  client = new Client({ name: "formaglyph-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
});

afterEach(async () => {
  await client.close();
  await server.close();
});

describe("Formaglyph MCP server", () => {
  it("advertises public reads plus one non-destructive draft handoff", async () => {
    const [tools, resources, prompts] = await Promise.all([client.listTools(), client.listResources(), client.listPrompts()]);
    expect(tools.tools.map((tool) => tool.name)).toEqual(["search_icons", "get_icon", "get_icon_svg", "list_categories", "propose_icon_draft"]);
    expect(tools.tools.filter((tool) => tool.name !== "propose_icon_draft").every((tool) => tool.annotations?.readOnlyHint === true && tool.annotations?.destructiveHint === false)).toBe(true);
    expect(tools.tools.find((tool) => tool.name === "propose_icon_draft")?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false, idempotentHint: false });
    expect(resources.resources.map((resource) => resource.uri)).toEqual(["formaglyph://catalog/manifest", "formaglyph://catalog/agent-guide"]);
    expect(prompts.prompts.map((prompt) => prompt.name)).toContain("choose_formaglyph_icon");
  });

  it("creates a text-only draft and returns the human handoff URL", async () => {
    const result = await client.callTool({
      name: "propose_icon_draft",
      arguments: {
        name: "payment-retry",
        description: "Retry a card payment after a recoverable failure.",
        keywords: ["payment", "retry"],
      },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      result: {
        status: "draft",
        handoffUrl: expect.stringContaining("/projects/core/create?draft="),
      },
    });
  });

  it("returns structured search data and embedded SVG resources", async () => {
    const search = await client.callTool({ name: "search_icons", arguments: { query: "payment successful" } });
    expect(search.isError).not.toBe(true);
    expect(search.structuredContent).toMatchObject({ result: { data: [{ stableId: asset.stableId }] } });
    const svg = await client.callTool({ name: "get_icon_svg", arguments: { stableId: asset.stableId, variant: "regular" } });
    const content = svg.content as Array<{ type: string; resource?: { mimeType?: string; text?: string } }>;
    expect(content[0]).toMatchObject({ type: "resource", resource: { mimeType: "image/svg+xml", text: expect.stringContaining("<svg") } });
  });

  it("serves manifest resources and a contextual prompt", async () => {
    const resource = await client.readResource({ uri: "formaglyph://catalog/manifest" });
    expect(resource.contents[0]).toMatchObject({ mimeType: "application/json", text: expect.stringContaining("Formaglyph Core") });
    const prompt = await client.getPrompt({ name: "choose_formaglyph_icon", arguments: { intent: "payment succeeded", context: "checkout" } });
    expect(prompt.messages[0].content).toMatchObject({ type: "text", text: expect.stringContaining("checkout") });
  });
});
