import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { FormaglyphCatalogClient, type IconVariant } from "./catalog.js";
import { FormaglyphDraftClient } from "./drafts.js";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const draftAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

function jsonResult(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: { result },
  };
}

function toolError(error: unknown) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: error instanceof Error ? error.message : "The Formaglyph request failed." }],
  };
}

export function createFormaglyphMcpServer(client = new FormaglyphCatalogClient(), drafts = new FormaglyphDraftClient(client.apiUrl)) {
  const server = new McpServer({ name: "formaglyph", version: "0.2.0" });

  server.registerTool("search_icons", {
    title: "Search Formaglyph icons",
    description: "Search the public Formaglyph Core catalog by intent, alias, tag, name, category, or variant. Use this before choosing an icon.",
    inputSchema: {
      query: z.string().max(200).default("").describe("Natural-language intent such as payment successful or protected file."),
      category: z.string().optional().describe("Optional exact category filter."),
      variant: z.enum(["regular", "solid"]).optional(),
      limit: z.number().int().min(1).max(50).default(12),
      cursor: z.string().optional().describe("Opaque nextCursor from a previous response."),
    },
    outputSchema: { result: z.unknown() },
    annotations: readOnlyAnnotations,
  }, async (input) => {
    try {
      return jsonResult(await client.search(input));
    } catch (error) {
      return toolError(error);
    }
  });

  server.registerTool("get_icon", {
    title: "Get Formaglyph icon metadata",
    description: "Get complete metadata and immutable variant URLs for one stable Formaglyph icon ID.",
    inputSchema: { stableId: z.string().regex(/^ico_[a-z0-9_]+$/).describe("Stable ID returned by search_icons.") },
    outputSchema: { result: z.unknown() },
    annotations: readOnlyAnnotations,
  }, async ({ stableId }) => {
    try {
      return jsonResult(await client.getIcon(stableId));
    } catch (error) {
      return toolError(error);
    }
  });

  server.registerTool("get_icon_svg", {
    title: "Get immutable Formaglyph SVG",
    description: "Fetch an original, MIT-licensed SVG variant for a stable icon ID. Returns the SVG as an embedded MCP resource.",
    inputSchema: {
      stableId: z.string().regex(/^ico_[a-z0-9_]+$/),
      variant: z.enum(["regular", "solid"]).default("regular"),
      version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
    },
    annotations: readOnlyAnnotations,
  }, async ({ stableId, variant, version }) => {
    try {
      const { asset, svg } = await client.getSvg(stableId, variant as IconVariant, version);
      return {
        content: [{ type: "resource" as const, resource: { uri: asset.assetUrl, mimeType: "image/svg+xml", text: svg } }],
      };
    } catch (error) {
      return toolError(error);
    }
  });

  server.registerTool("list_categories", {
    title: "List Formaglyph categories",
    description: "List the available categories in the current public Formaglyph release.",
    inputSchema: {},
    outputSchema: { result: z.unknown() },
    annotations: readOnlyAnnotations,
  }, async () => {
    try {
      return jsonResult(await client.listCategories());
    } catch (error) {
      return toolError(error);
    }
  });

  server.registerTool("propose_icon_draft", {
    title: "Propose a Formaglyph icon draft",
    description: "Create a text-only draft in the token's project after public search finds no suitable icon. This does not upload SVG, submit for review, approve, or publish. Return the handoff URL so a human can finish the icon.",
    inputSchema: {
      name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).describe("Lowercase kebab-case canonical name."),
      description: z.string().min(3).max(500).describe("Concrete semantic brief for the missing icon."),
      keywords: z.array(z.string().min(1).max(40)).max(12).default([]).describe("Search aliases and semantic terms."),
    },
    outputSchema: { result: z.unknown() },
    annotations: draftAnnotations,
  }, async (input) => {
    try {
      return jsonResult(await drafts.createDraft(input));
    } catch (error) {
      return toolError(error);
    }
  });

  server.registerResource("formaglyph-manifest", "formaglyph://catalog/manifest", {
    title: "Formaglyph Core release manifest",
    description: "The complete public release manifest with provenance, licence, hashes, and immutable asset URLs.",
    mimeType: "application/json",
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(await client.getManifest(), null, 2) }],
  }));

  server.registerResource("formaglyph-agent-guide", "formaglyph://catalog/agent-guide", {
    title: "Formaglyph agent usage guide",
    description: "A short guide for selecting and retrieving icons safely.",
    mimeType: "text/markdown",
  }, async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/markdown",
      text: "# Formaglyph agent guide\n\n1. Call `search_icons` with the user's intent.\n2. Compare semantic fit, category, directionality, and variant.\n3. Call `get_icon` to inspect provenance and licence.\n4. Call `get_icon_svg` only after selecting the stable ID.\n5. If no suitable icon exists and the user wants a new concept, call `propose_icon_draft` with a scoped project token.\n6. Return the handoff URL. A human must create or import geometry, submit, review, approve, and publish.\n\nPublic catalog access is keyless and read-only. Project tokens can create text-only drafts and cannot publish.",
    }],
  }));

  server.registerPrompt("choose_formaglyph_icon", {
    title: "Choose a Formaglyph icon",
    description: "Guide an agent through choosing a semantically correct Formaglyph icon.",
    argsSchema: {
      intent: z.string().describe("What the interface action, object, or status should communicate."),
      context: z.string().optional().describe("Optional product or interface context."),
    },
  }, async ({ intent, context }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Find the best Formaglyph icon for: ${intent}.${context ? ` Context: ${context}.` : ""} Search first, explain the semantic match, check directionality and licence, then return the stable ID and recommended variant.`,
      },
    }],
  }));

  return server;
}
