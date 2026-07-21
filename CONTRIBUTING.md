# Contributing to Formaglyph

Thanks for helping build Formaglyph. The project is early, so proposals that preserve the approved product baseline and keep the workflow safe are especially valuable.

## Before opening a pull request

1. Open an issue for substantial product, architecture, or icon-family changes.
2. Keep AI-created assets draft-only; no contribution may bypass human review.
3. Preserve stable IDs, provenance, licence, directionality, and version metadata.
4. Keep the visual palette limited to white, black, and the restrained `#A10232` accent.
5. Run the frontend verification suite.

```bash
cd formaglyph-prototype
pnpm install
pnpm check
```

## Pull requests

Keep each pull request focused. Explain the problem, the chosen solution, verification performed, and any product or licence implications. Include screenshots for visible interface changes.

By contributing code, you agree that it may be distributed under Apache-2.0. By contributing original Formaglyph icon assets or generated framework-package assets, you agree that they may be distributed under the MIT licence in `LICENSE-ASSETS`. Do not contribute material you do not have permission to license.
