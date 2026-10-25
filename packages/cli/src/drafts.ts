import { DEFAULT_API_URL, FormaglyphApiError } from "./catalog.js";

export interface DraftHandoffInput {
  name: string;
  description: string;
  keywords?: string[];
}

export interface DraftHandoff {
  draftId: string;
  name: string;
  projectSlug: string;
  status: "draft";
  handoffUrl: string;
}

type Fetch = typeof globalThis.fetch;

export class FormaglyphDraftClient {
  private readonly apiUrl: string;

  constructor(
    apiUrl = DEFAULT_API_URL,
    private readonly token = process.env.FORMAGLYPH_PROJECT_TOKEN,
    private readonly fetcher: Fetch = globalThis.fetch,
  ) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
  }

  async createDraft(input: DraftHandoffInput): Promise<DraftHandoff> {
    if (!this.token) {
      throw new FormaglyphApiError(
        "A Formaglyph project token is required. Create one in Project Settings, then send it as a Bearer token or set FORMAGLYPH_PROJECT_TOKEN.",
        401,
        "project_token_required",
      );
    }
    const response = await this.fetcher(`${this.apiUrl}/agent/drafts`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        "user-agent": "formaglyph-cli/0.1.0",
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => null) as { data?: DraftHandoff; error?: { code?: string; message?: string } } | null;
    if (!response.ok || !body?.data) {
      throw new FormaglyphApiError(body?.error?.message ?? `Formaglyph API returned ${response.status}.`, response.status, body?.error?.code);
    }
    return body.data;
  }
}
