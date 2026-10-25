const { spawnSync } = require("node:child_process");
const { dirname, join } = require("node:path");
const { verifyRestartPolicy } = require("./restart-policy.ts");

// Read only the two non-secret settings, for the same fixed target as railway.ts.
const query = 'query { serviceInstance(environmentId: "a1fe3272-826c-4288-83e5-11d080bcb2d2", serviceId: "d1cfce73-9e74-4ac5-a479-eb8d30c5fac1") { restartPolicyType restartPolicyMaxRetries } }';

try {
  // Windows cannot exec a .cmd shim without a shell. Run npm's JS entry point
  // with the installed Node executable there; keep all arguments shell-free.
  const args = ["--yes", "--package", "@railway/cli@5.71.0", "railway", "api", query, "--compact"];
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? process.execPath : "npx",
    windows ? [join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js"), ...args] : args,
    { encoding: "utf8", timeout: 120_000, maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error || result.status !== 0) {
    throw new Error("Could not verify Railway settings. Check Railway CLI authentication and network access; no settings were changed.");
  }
  let response;
  try {
    response = JSON.parse(result.stdout);
  } catch {
    throw new Error("Railway returned an invalid settings response; verification failed closed.");
  }
  if (response?.errors?.length) {
    throw new Error("Railway could not read the restart settings; verification failed closed.");
  }
  const policy = verifyRestartPolicy(response?.data?.serviceInstance);
  console.log(`Railway restart policy verified: ${policy.restartPolicyType}, ${policy.restartPolicyMaxRetries} retries. No settings changed.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Railway restart-policy verification failed.");
  process.exitCode = 1;
}
