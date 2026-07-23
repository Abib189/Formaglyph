# Formaglyph CLI and MCP

Formaglyph exposes the original, MIT-licensed Core catalog to people, scripts, and AI agents. Public catalog reads stay keyless. A separate scoped token can create a text-only project draft for human completion.

## Hosted MCP

The production Streamable HTTP endpoint is:

```text
https://formaglyph.com/mcp
```

Use that URL in clients that accept a remote MCP server URL. No key is required for the public Core catalog. The endpoint accepts stateless MCP `POST` requests, rejects unapproved browser origins, and does not support legacy SSE access.

Generic remote client configuration:

```json
{
  "mcpServers": {
    "formaglyph": {
      "url": "https://formaglyph.com/mcp"
    }
  }
}
```

### Tools

- `search_icons`: intent, alias, tag, category, and variant search with cursor pagination.
- `get_icon`: provenance, licence, directionality, variants, hashes, and immutable URLs for one stable ID.
- `get_icon_svg`: retrieves a selected SVG as an embedded MCP resource.
- `list_categories`: lists categories in the current release.
- `propose_icon_draft`: creates a text-only draft and returns a deep link for a human to create or import geometry.

The four catalog tools are annotated read-only, non-destructive, and idempotent. `propose_icon_draft` is non-destructive and non-idempotent. It requires the `drafts:write` project scope and cannot attach SVG, submit, review, approve, publish, or read private project records. The server also exposes the release manifest and agent guide as resources, plus the `choose_formaglyph_icon` prompt.

### Project draft authorization

An administrator can issue a 30-day project token in `/projects/:projectSlug/settings#agents`. The secret is shown once and stored only as a SHA-256 hash. Send it on every protected MCP request:

```json
{
  "mcpServers": {
    "formaglyph": {
      "url": "https://formaglyph.com/mcp",
      "headers": {
        "Authorization": "Bearer fgp_..."
      }
    }
  }
}
```

This beta uses a pre-issued bearer token strategy. Public MCP reads remain available without it. OAuth 2.1 discovery and delegated consent are planned before broader third-party MCP distribution.

## Local stdio MCP

Build the package from this repository:

```bash
pnpm --filter @formaglyph/cli build
```

Then configure a local MCP client to spawn the bundled command:

```json
{
  "mcpServers": {
    "formaglyph": {
      "command": "node",
      "args": ["/absolute/path/to/Formaglyph/packages/cli/dist/formaglyph-mcp.mjs"]
    }
  }
}
```

After the package is published to npm, the intended portable command is `npx -y @formaglyph/cli mcp` or the `formaglyph-mcp` binary. npm publication is deliberately separate from this milestone.

Set `FORMAGLYPH_API_URL` to point the CLI or stdio server at another compatible HTTPS API. Plain HTTP is accepted only for localhost development.
Set `FORMAGLYPH_PROJECT_TOKEN` to enable the draft handoff tool in a local stdio server.

## CLI

Run the built CLI:

```bash
node packages/cli/dist/formaglyph.mjs search "payment successful" --variant regular
node packages/cli/dist/formaglyph.mjs get ico_fg_002_card_check --json
node packages/cli/dist/formaglyph.mjs svg ico_fg_002_card_check --output card-check.svg
node packages/cli/dist/formaglyph.mjs manifest
```

SVG export refuses to overwrite an existing file unless `--force` is explicit. Use `--json` for automation and `--api-url` to override the endpoint.

## Security boundary

- MCP and CLI catalog tools read only the source-controlled public Core release.
- A project token authorizes only a new text brief in its single project. It does not expose existing drafts, reviews, audit records, or unpublished assets.
- Project tokens are stored hashed, expire in 1-90 days, can be revoked immediately, and write a transactional audit event when issued, used, or revoked.
- The hosted endpoint validates browser `Origin` headers and uses HTTPS.
- Private project reads, SVG upload, proposal submission, review, publication, OAuth, and quotas remain unavailable to agents.
