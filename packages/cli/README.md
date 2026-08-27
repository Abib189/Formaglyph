# `@formaglyph/cli`

Command-line and Model Context Protocol access to the public, MIT-licensed Formaglyph Core catalog, with an optional scoped project draft handoff.

The package is prepared for publication but is not yet published to npm. It requires Node.js 20 or newer.

```bash
formaglyph search "payment successful"
formaglyph get ico_fg_002_card_check --json
formaglyph svg ico_fg_002_card_check --variant regular --output card-check.svg
formaglyph manifest
```

Use `--json` for machine-readable CLI output and `--api-url` to target another compatible HTTPS endpoint. SVG export will not overwrite a file unless `--force` is explicit.

Use `formaglyph-mcp` or `formaglyph mcp` as a local stdio MCP command. The hosted Streamable HTTP endpoint and complete client configuration are documented in [`docs/mcp-cli.md`](../../docs/mcp-cli.md).

Public search and retrieval need no token. To enable `propose_icon_draft` over stdio, create a project token in Formaglyph Settings and set it outside source control:

```bash
FORMAGLYPH_PROJECT_TOKEN=fgp_... formaglyph-mcp
```
