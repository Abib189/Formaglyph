# @formaglyph/validators

Deterministic, backend-independent SVG sanitization and validation used by the Formaglyph web app and future API, CLI, and MCP surfaces.

The sanitizer parses SVG as XML and rebuilds a new document from an explicit element and attribute allow-list. Unsafe source never becomes the normalized output. Automatic changes are returned in the report so callers can show a reversible before/after diff.
