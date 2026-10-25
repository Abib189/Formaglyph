# Railway configuration

The service-scoped [`.railway/railway.ts`](../.railway/railway.ts) replaces the deprecated root `railway.json`. It manages only `formaglyph-web` in the existing Formaglyph production environment. Runtime and build variables remain managed in Railway; neither values nor encrypted exports belong in Git. Source is deliberately omitted so CLI uploads continue working.

## Requirements and scope

- Node 22 or newer and pnpm 11.9.0. `pnpm railway` uses the pinned Railway CLI 5.71.0 through npm exec; no global CLI upgrade is required. The canonical restart-policy representation was also verified with CLI 5.64.1.
- `pnpm install --frozen-lockfile`; the Railway SDK and TypeScript are pinned in the root package.
- Authenticate with Railway, then explicitly link the checkout:

```sh
pnpm railway link --project 7d28f580-dff3-4779-b51d-322a484adb96 --environment a1fe3272-826c-4288-83e5-11d080bcb2d2 --service d1cfce73-9e74-4ac5-a479-eb8d30c5fac1
pnpm iac:typecheck
pnpm iac:test
pnpm iac:verify
pnpm iac:plan
```

The file refuses to evaluate against another project/environment. It preserves the Dockerfile build, `/health` with a 120-second timeout, three on-failure retries, 20-second overlap, 10-second drain, one existing Europe West replica, and both custom domains. Watch paths now include `/.railway/**` instead of `/railway.json`. Existing Railway-generated domains and service variables must not be removed by a plan.

## Apply and deploy

`railway up` does **not** evaluate or apply IaC. After committing and verifying a configuration change, review a plan explicitly; do not set up unattended apply or use destructive confirmation flags.

```sh
pnpm railway config plan --environment a1fe3272-826c-4288-83e5-11d080bcb2d2 --out /absolute/private/path/formaglyph-plan.json
pnpm railway config apply --environment a1fe3272-826c-4288-83e5-11d080bcb2d2 --plan /absolute/private/path/formaglyph-plan.json --yes
pnpm iac:verify
pnpm iac:plan
```

Keep plan artifacts outside the repository. A saved plan pins its source tree and configuration ETag; if either changes, discard it and review a fresh plan. Expected migration changes are build/watch/health/restart/rollout settings and the partial ownership claim, **not** new services or resource/domain/variable deletions. Subsequent plans should have zero changes. `pnpm iac:plan` returns exit code 0 for a clean plan and 2 for pending changes, without filtering the native planner's output. Do not apply an empty plan. Do not use variable export/decrypt/show-values flags.

After green CI, upload a clean checkout of that exact commit with the established `railway up` workflow. Verify the resulting deployment, `/health`, Explore, and public catalog assets. No GitHub source integration or additional infrastructure is introduced by this migration.

### Restart-policy default and live verification

Railway serializes its default restart policy as an omitted value. Explicitly authoring `restartPolicyType: "ON_FAILURE"` produced perpetual `null → "ON_FAILURE"` drift in both CLI 5.64.1 and 5.71.0, even though the live service settings API and effective deployment manifest already reported On Failure. An upgrade alone did not resolve it.

The configuration now uses Railway's canonical omitted-default representation for the policy, and keeps `restartPolicyMaxRetries: 3` explicit. The intended runtime contract is declared in `.railway/restart-policy.ts`. `pnpm iac:verify` performs the following narrowly scoped, read-only query and fails unless the actual policy is `ON_FAILURE` with exactly three retries. It also fails closed on authentication, transport, GraphQL, malformed-response and missing-field errors. It does not read variables, mutate settings, or suppress planner changes; it is a separate authenticated operational check, not part of offline CI tests.

```sh
pnpm railway api 'query { serviceInstance(environmentId: "a1fe3272-826c-4288-83e5-11d080bcb2d2", serviceId: "d1cfce73-9e74-4ac5-a479-eb8d30c5fac1") { restartPolicyType restartPolicyMaxRetries } }' --compact
```

If that value differs, treat it as real drift and investigate. Regression tests reject `ALWAYS`, `NEVER`, changed retry limits and incomplete responses. Also inspect `meta.serviceManifest.deploy` after a new deployment. The [documented platform default](https://docs.railway.com/deployments/restart-policy) is On Failure; the authored retry limit remains three, not the platform's default ten. The default-representation fix itself yields a genuinely empty native production plan, so it requires no configuration apply or restart.

## One-time migration and rollback

Railway CLI 5.64.1 separates local file generation (`config migrate --apply`) from switching an explicitly configured Config-as-Code path off (`config migrate cutover --service formaglyph-web --yes`). Review `config migrate status` first. This project originally auto-discovered root `railway.json` despite having no explicit dashboard config-file path; the old deployment's **effective** file manifest, not just dashboard defaults, is the migration baseline. The generator leaves some effective settings as comments, so generated output alone is insufficient.

Retain a private pre-change graph from `config pull --json --variables unmanaged` and the current successful deployment ID before applying. Never commit snapshots containing environment state. If an explicit path is cut over, keep the CLI's local migration snapshot; `config migrate undo --yes` restores those paths. An auto-discovered file may have no path to cut over: removing `railway.json` from the new deployment is then the discovery cutover.

For a normal rollback, restore the previous reviewed `.railway` source in a new commit, inspect/apply its plan, and deploy that commit. For an emergency return to Config as Code, the legacy file remains recoverable from Git at `149cde0052bc4a1a1ee6b379f3a4e2147419f394:railway.json`; restoring it and redeploying re-enables auto-discovery. Rolling back only an application deployment does not undo environment-level IaC settings. Re-check partial ownership and a fresh plan before any subsequent migration attempt.

References: [Railway IaC](https://docs.railway.com/infrastructure-as-code), [CLI config](https://docs.railway.com/cli/config). Installed CLI help takes precedence when migration flags differ from documentation.
