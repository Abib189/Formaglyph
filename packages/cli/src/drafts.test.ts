import { describe, expect, it, vi } from "vitest";
import { FormaglyphDraftClient } from "./drafts.js";

describe("Formaglyph draft handoff client", () => {
  it("sends the project token only in the Authorization header", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => new Response(JSON.stringify({
      data: {
        draftId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        name: "payment-retry",
        projectSlug: "core",
        status: "draft",
        handoffUrl: "https://formaglyph.test/projects/core/create?draft=dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      },
    }), { status: 201, headers: { "content-type": "application/json" } }));
    const client = new FormaglyphDraftClient("https://formaglyph.test/api/v1", "fgp_secret", fetcher as typeof globalThis.fetch);
    await client.createDraft({ name: "payment-retry", description: "Retry a recoverable payment.", keywords: ["payment"] });
    expect(fetcher).toHaveBeenCalledWith(
      "https://formaglyph.test/api/v1/agent/drafts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer fgp_secret" }),
      }),
    );
    expect(JSON.stringify(fetcher.mock.calls[0])).not.toContain('"token"');
  });

  it("fails before a network call when no project token is configured", async () => {
    const fetcher = vi.fn();
    const client = new FormaglyphDraftClient("https://formaglyph.test/api/v1", undefined, fetcher as typeof globalThis.fetch);
    await expect(client.createDraft({ name: "payment-retry", description: "Retry a recoverable payment." })).rejects.toMatchObject({ status: 401, code: "project_token_required" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
