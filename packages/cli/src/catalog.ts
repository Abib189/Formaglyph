export const DEFAULT_API_URL = "https://formaglyph-web-production.up.railway.app/api/v1";

export type IconVariant = "regular" | "solid";

export interface IconAlias {
  locale: string;
  value: string;
  reviewed: boolean;
}

export interface IconAsset {
  stableId: string;
  name: string;
  label: string;
  category: string;
  description: string;
  tags: string[];
  aliases: IconAlias[];
  directionality: "neutral" | "ltr-specific" | "rtl-specific" | "mirrored-safe";
  licence: "MIT";
  provenance: { kind: "original"; source: string; sourceRevision?: string; disclosed: true };
  variant: IconVariant;
  version: string;
  bytes: number;
  sha256: string;
  assetUrl: string;
  relevance?: number;
}

export interface IconConcept extends Omit<IconAsset, "variant" | "version" | "bytes" | "sha256" | "assetUrl" | "relevance" | "provenance"> {
  variants: IconAsset[];
}

export interface SearchOptions {
  query?: string;
  category?: string;
  variant?: IconVariant;
  limit?: number;
  cursor?: string;
}

export interface SearchResult {
  data: IconAsset[];
  page: { total: number; limit: number; nextCursor: string | null };
  query: { q: string; category: string | null; variant: string | null };
}

export interface CatalogManifest {
  schemaVersion: number;
  name: string;
  version: string;
  grid: number;
  licence: "MIT";
  conceptCount: number;
  assetCount: number;
  assets: IconAsset[];
}

type Fetch = typeof globalThis.fetch;

export class FormaglyphApiError extends Error {
  constructor(message: string, readonly status: number, readonly code = "api_error") {
    super(message);
    this.name = "FormaglyphApiError";
  }
}

function normalizeApiUrl(value: string) {
  const url = new URL(value);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new TypeError("The Formaglyph API URL must use HTTPS, except on localhost.");
  }
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

async function errorFromResponse(response: Response) {
  try {
    const body = await response.json() as { error?: { code?: string; message?: string } };
    return new FormaglyphApiError(body.error?.message ?? `Formaglyph API returned ${response.status}.`, response.status, body.error?.code);
  } catch {
    return new FormaglyphApiError(`Formaglyph API returned ${response.status}.`, response.status);
  }
}

export class FormaglyphCatalogClient {
  readonly apiUrl: string;

  constructor(apiUrl = DEFAULT_API_URL, private readonly fetcher: Fetch = globalThis.fetch) {
    this.apiUrl = normalizeApiUrl(apiUrl);
  }

  private async fetch(path: string, init: RequestInit = {}) {
    const response = await this.fetcher(`${this.apiUrl}${path}`, {
      ...init,
      headers: { accept: "application/json", "user-agent": "formaglyph-cli/0.1.0", ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw await errorFromResponse(response);
    return response;
  }

  async search(options: SearchOptions = {}): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (options.query) params.set("q", options.query);
    if (options.category) params.set("category", options.category);
    if (options.variant) params.set("variant", options.variant);
    if (options.limit !== undefined) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);
    return this.fetch(`/icons?${params}`).then((response) => response.json()) as Promise<SearchResult>;
  }

  async getIcon(stableId: string): Promise<IconConcept> {
    return this.fetch(`/icons/${encodeURIComponent(stableId)}`).then((response) => response.json()) as Promise<IconConcept>;
  }

  async getManifest(): Promise<CatalogManifest> {
    return this.fetch("/manifest").then((response) => response.json()) as Promise<CatalogManifest>;
  }

  async getSvg(stableId: string, variant: IconVariant = "regular", version?: string) {
    const icon = await this.getIcon(stableId);
    const asset = icon.variants.find((item) => item.variant === variant && (!version || item.version === version));
    if (!asset) throw new FormaglyphApiError(`No ${variant} asset${version ? ` at version ${version}` : ""} exists for ${stableId}.`, 404, "asset_not_found");
    const response = await this.fetcher(asset.assetUrl, {
      headers: { accept: "image/svg+xml", "user-agent": "formaglyph-cli/0.1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw await errorFromResponse(response);
    return { asset, svg: await response.text() };
  }

  async listCategories() {
    const manifest = await this.getManifest();
    return [...new Set(manifest.assets.map((asset) => asset.category))].sort((left, right) => left.localeCompare(right));
  }
}
