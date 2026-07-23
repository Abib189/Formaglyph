# Formaglyph CLI and MCP

Formaglyph exposes the original, MIT-licensed Core catalog to people, scripts, and AI agents through the same public read-only boundary.

## Hosted MCP

The production Streamable HTTP endpoint is:

```text
https://formaglyph.com/mcp
```

Use that URL in clients that accept a remote MCP server URL. No key is required for the public Core catalog. The endpoint accepts stateless MCP `POST` requests and rejects writes, unapproved browser origins, and legacy SSE access.

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

Every tool is annotated read-only, non-destructive, and idempotent. The server also exposes the release manifest and agent guide as resources, plus the `choose_formaglyph_icon` prompt.

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

- MCP and CLI can read only the source-controlled public Core release.
- No Supabase session, secret key, private draft, project, review, audit record, or unpublished asset is sent to this server.
- The hosted endpoint validates browser `Origin` headers and uses HTTPS.
- Private project MCP, write tools, OAuth, quotas, and user-issued API keys remain unavailable until a separate authenticated-agent milestone.
