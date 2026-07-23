# Formaglyph API v1

Public routes provide read-only access to the MIT-licensed Formaglyph Core release. One protected route accepts a scoped Formaglyph project token and creates a text-only draft handoff.

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
| `POST` | `/api/v1/agent/drafts` | Create a text-only draft and human handoff URL |

`/icons` accepts `q`, `category`, `variant=regular|solid`, `limit=1..100`, and an opaque `cursor`. Search uses canonical names, reviewed aliases, tags, and descriptions. Responses expose permissive CORS headers. Immutable SVG responses use their SHA-256 content hash as the ETag and a one-year immutable cache policy.

Example:

```bash
curl "https://formaglyph.com/api/v1/icons?q=payment%20successful&variant=regular&limit=5"
```

All other write methods return `405`. The draft route requires `Authorization: Bearer fgp_...` and the token's `drafts:write` scope:

```bash
curl "https://formaglyph.com/api/v1/agent/drafts" \
  -H "Authorization: Bearer fgp_..." \
  -H "Content-Type: application/json" \
  -d '{"name":"payment-retry","description":"Retry a recoverable payment.","keywords":["payment","retry"]}'
```

The response contains a `/projects/:projectSlug/create?draft=:draftId` handoff URL. The route cannot upload geometry or advance the draft into review.
