# Formaglyph generation boundary

Formaglyph's first creation adapter is Local Geometry. It is a deterministic, browser-local geometry synthesizer that implements the same candidate contract intended for future model workers. It is useful for testing the complete product workflow without disguising procedural output as AI generation or sending a private brief to a third party.

## Live workflow

1. A contributor writes a name, description, and keywords.
2. The repository starts a `local_geometry` generation job and records an audit event.
3. The adapter derives a structured brief and creates three Regular/Solid SVG pairs.
4. Every SVG is rebuilt through the shared sanitizer before it can be previewed or saved.
5. The repository completes the job with pass counts and provenance.
6. The selected variant is saved as a draft and remains subject to review and admin-only publication.

Contributors can also import an SVG. Imported markup crosses the same sanitizer boundary and cannot bypass deterministic validation or human review.

## Privacy and provenance

- Local Geometry performs no model-provider or generation-network request.
- Prompt retention is off by default. In that mode the browser sends only a SHA-256 prompt hash to Supabase; the raw brief does not leave the browser through the generation RPC.
- When an administrator or contributor explicitly enables retention, the full brief is stored with the job for project history.
- Generated candidates are linked to a completed job from the same project and author. PostgreSQL rejects forged, mismatched, or unfinished provenance.
- Start, completion, failure, and cancellation are transactionally audited.

## Adapter contract

Adapters accept a structured prompt, style profile, target count, abort signal, and progress callback. They return sanitized candidate pairs plus disclosed provider, model, prompt hash, and generation-job identifiers. The UI depends on this contract instead of a model-specific response shape.

## Deliberate limits

OmniSVG and StarVector require separately deployed GPU workers and are not silently substituted for Local Geometry. Hosted generation remains disabled until a project administrator opts in to a disclosed provider. No adapter can publish an icon directly.

The next worker milestone should add queue-backed execution, idempotency keys, timeouts, cost metadata, isolated credentials, and one explicit open-model deployment while retaining this local adapter as the offline and test path.
