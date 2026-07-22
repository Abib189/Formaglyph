# @formaglyph/schema

Canonical TypeScript contracts shared by the Formaglyph web app, REST API, MCP server, CLI, validators, and generated SDKs.

The package currently defines icon metadata, style profiles, permissions, proposal state, and deterministic proposal transitions. JSON Schema/OpenAPI generation will build from these stable contracts as the API service lands.

```ts
import { canTransitionProposal, type IconRecord } from "@formaglyph/schema";
```

Schema changes are product changes. Keep them backward-compatible or introduce an explicit version and migration.
