# Formaglyph Public API v1

The public API provides read-only access to the MIT-licensed Formaglyph Core release. It does not accept secret keys, expose private projects, or proxy privileged Supabase access.

Production base URL:

```text
https://formaglyph.com/api/v1
```

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` / `HEAD` | `/api/v1` | Service and release discovery |
| `GET` / `HEAD` | `/api/v1/icons` | Search, filter, and paginate assets |
| `GET` / `HEAD` | `/api/v1/icons/{stableId}` | Read concept metadata and variants |
| `GET` / `HEAD` | `/api/v1/icons/{stableId}/{version}/{variant}.svg` | Fetch an immutable SVG |
| `GET` / `HEAD` | `/api/v1/manifest` | Fetch the content-hashed release manifest |
| `GET` / `HEAD` | `/api/v1/openapi.json` | Fetch the OpenAPI 3.1 description |

`/icons` accepts `q`, `category`, `variant=regular|solid`, `limit=1..100`, and an opaque `cursor`. Search uses canonical names, reviewed aliases, tags, and descriptions. Responses expose permissive CORS headers. Immutable SVG responses use their SHA-256 content hash as the ETag and a one-year immutable cache policy.

Example:

```bash
curl "https://formaglyph.com/api/v1/icons?q=payment%20successful&variant=regular&limit=5"
```

All write methods return `405`. Private/team catalog access, personal access tokens, write scopes, quotas, and API-key rotation remain unavailable until the authenticated API milestone.
