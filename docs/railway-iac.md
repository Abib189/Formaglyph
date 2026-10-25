# Railway configuration

The service-scoped [`.railway/railway.ts`](../.railway/railway.ts) replaces the deprecated root `railway.json`. It manages only `formaglyph-web` in the existing Formaglyph production environment. Runtime and build variables remain managed in Railway; neither values nor encrypted exports belong in Git. Source is deliberately omitted so CLI uploads continue working.

## Requirements and scope

- Node 22 or newer, pnpm 11.9.0, and Railway CLI 5.64.1 (the migration was verified with this version).
- `pnpm install --frozen-lockfile`; the Railway SDK and TypeScript are pinned in the root package.
- Authenticate with Railway, then explicitly link the checkout:

```sh
railway link --project 7d28f580-dff3-4779-b51d-322a484adb96 --environment a1fe3272-826c-4288-83e5-11d080bcb2d2 --service d1cfce73-9e74-4ac5-a479-eb8d30c5fac1
pnpm iac:typecheck
pnpm iac:test
railway config plan --environment a1fe3272-826c-4288-83e5-11d080bcb2d2
```

The file refuses to evaluate against another project/environment. It preserves the Dockerfile build, `/health` with a 120-second timeout, three on-failure retries, 20-second overlap, 10-second drain, one existing Europe West replica, and both custom domains. Watch paths now include `/.railway/**` instead of `/railway.json`. Existing Railway-generated domains and service variables must not be removed by a plan.

## Apply and deploy

`railway up` does **not** evaluate or apply IaC. After committing and verifying a configuration change, review a plan explicitly; do not set up unattended apply or use destructive confirmation flags.

```sh
railway config plan --environment a1fe3272-826c-4288-83e5-11d080bcb2d2 --out /absolute/private/path/formaglyph-plan.json
railway config apply --environment a1fe3272-826c-4288-83e5-11d080bcb2d2 --plan /absolute/private/path/formaglyph-plan.json --yes
railway config plan --environment a1fe3272-826c-4288-83e5-11d080bcb2d2
```

Keep plan artifacts outside the repository. A saved plan pins its source tree and configuration ETag; if either changes, discard it and review a fresh plan. Expected migration changes are build/watch/health/restart/rollout settings and the partial ownership claim, **not** new services or resource/domain/variable deletions. Subsequent plans should have no effective changes; see the planner caveat below. Do not use variable export/decrypt/show-values flags.

After green CI, upload a clean checkout of that exact commit with the established `railway up` workflow. Verify the resulting deployment, `/health`, Explore, and public catalog assets. No GitHub source integration or additional infrastructure is introduced by this migration.

### CLI 5.64.1 default-value caveat

After a successful apply, this CLI can still report only `deploy.restartPolicyType (null → "ON_FAILURE")`. Its current graph omits the default while its desired graph retains the explicitly authored value. During this migration, the read-only service settings API and the new deployment's effective manifest independently returned `ON_FAILURE` with three retries, including after the legacy file was removed. Keep the policy explicit in source; do not repeatedly apply this isolated false positive just to clear the plan, and do not suppress any other changes.

Verify the actual value with this narrowly scoped read-only query and the deployment's `meta.serviceManifest.deploy`:

```sh
railway api 'query { serviceInstance(environmentId: "a1fe3272-826c-4288-83e5-11d080bcb2d2", serviceId: "d1cfce73-9e74-4ac5-a479-eb8d30c5fac1") { restartPolicyType restartPolicyMaxRetries } }' --compact
```

If that value differs, treat the plan as real drift and investigate. The [documented platform default](https://docs.railway.com/deployments/restart-policy) is On Failure; the authored retry limit remains three, not the platform's default ten.

## One-time migration and rollback

Railway CLI 5.64.1 separates local file generation (`config migrate --apply`) from switching an explicitly configured Config-as-Code path off (`config migrate cutover --service formaglyph-web --yes`). Review `config migrate status` first. This project originally auto-discovered root `railway.json` despite having no explicit dashboard config-file path; the old deployment's **effective** file manifest, not just dashboard defaults, is the migration baseline. The generator leaves some effective settings as comments, so generated output alone is insufficient.

Retain a private pre-change graph from `config pull --json --variables unmanaged` and the current successful deployment ID before applying. Never commit snapshots containing environment state. If an explicit path is cut over, keep the CLI's local migration snapshot; `config migrate undo --yes` restores those paths. An auto-discovered file may have no path to cut over: removing `railway.json` from the new deployment is then the discovery cutover.

For a normal rollback, restore the previous reviewed `.railway` source in a new commit, inspect/apply its plan, and deploy that commit. For an emergency return to Config as Code, the legacy file remains recoverable from Git at `149cde0052bc4a1a1ee6b379f3a4e2147419f394:railway.json`; restoring it and redeploying re-enables auto-discovery. Rolling back only an application deployment does not undo environment-level IaC settings. Re-check partial ownership and a fresh plan before any subsequent migration attempt.

References: [Railway IaC](https://docs.railway.com/infrastructure-as-code), [CLI config](https://docs.railway.com/cli/config). Installed CLI help takes precedence when migration flags differ from documentation.
