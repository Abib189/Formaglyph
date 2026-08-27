# Review and governance

Formaglyph treats review decisions and published icon versions as durable product records. A generated or imported candidate remains a draft until a non-author reviewer approves its proposal and an administrator publishes it.

## Lifecycle

The database enforces these transitions:

```text
draft -> in_review -> approved -> published -> deprecated
                   -> changes_requested -> in_review
                   -> rejected
```

Rejected proposals and deprecated icons are terminal. A deprecated icon leaves the anonymous public catalog, but its immutable version, asset path, content hash, provenance, reviews, and audit history remain stored.

## Permissions

| Action | Contributor | Reviewer | Administrator |
| --- | --- | --- | --- |
| Create and edit own draft | Yes | Yes | Yes |
| Submit own proposal | Yes | Yes | Yes |
| Comment on another author's proposal | No | Yes | Yes |
| Resolve own review comment | No | Yes | Yes |
| Resolve another reviewer's comment | No | No | Yes |
| Approve, request changes, or reject | No | Yes | Yes |
| Publish an approved proposal | No | No | Yes |
| Deprecate a published icon | No | No | Yes |
| Inspect project audit history | No | Yes | Yes |

Authors cannot review their own proposal, regardless of their project role. Change requests, rejection, and deprecation require an explanatory note. PostgreSQL checks every role and state transition rather than trusting a hidden or disabled interface control.

## Transactional records

Review comments, comment resolution, decisions, publication, and deprecation are authenticated database functions. Each function validates `auth.uid()`, locks the affected record where necessary, changes state, and writes its audit event in the same transaction.

The Workspace governance panel exposes two related views to reviewers and administrators:

- The release changelog lists immutable version IDs, variants, hashes, status, dates, and any deprecation reason.
- The audit trail lists privileged actions, actors, targets, sources, and timestamps.

Audit rows cannot be updated or deleted. Anonymous catalog policies expose only icons whose current status is `published` in a public project. Authenticated members can inspect the lifecycle states in projects they belong to.

## Local verification

Reset and test the database entirely from committed migrations:

```bash
pnpm supabase:start
pnpm db:reset
pnpm test:db
```

The pgTAP suite covers anonymous access, organization isolation, non-author review, decision-note requirements, comment resolution, administrator-only publication and deprecation, immutable audit events, and removal of deprecated icons from the public catalog.
