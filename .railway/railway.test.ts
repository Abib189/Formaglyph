import assert from "node:assert/strict";
import test from "node:test";
import { createRailwayContext, project } from "railway/iac";
import railway, { partial } from "./railway";

const target = {
  projectId: "7d28f580-dff3-4779-b51d-322a484adb96",
  environmentId: "a1fe3272-826c-4288-83e5-11d080bcb2d2",
  environmentName: "production",
};

async function definition() {
  return await railway(createRailwayContext(target), project);
}

test("owns only the existing web service and leaves variables and source unmanaged", async () => {
  const config = await definition();
  assert.equal(partial, "formaglyph-web");
  assert.equal(config.name, "Formaglyph");
  assert.deepEqual(config.variables, { managed: false });
  assert.equal(config.resources.length, 1);
  const web = config.resources[0];
  assert.equal(web.address, "service.formaglyph-web");
  assert.equal(web.type, "service");
  for (const key of ["source", "variables", "configFile", "volumeMounts"]) {
    assert.equal(Object.hasOwn(web, key), false, `${key} must stay unmanaged`);
  }
});

test("carries every effective legacy build and rollout setting into active SDK output", async () => {
  const web = (await definition()).resources[0];
  assert.deepEqual(web.build, {
    builder: "DOCKERFILE",
    dockerfilePath: "Dockerfile",
    watchPatterns: [
      "/apps/web/**", "/packages/cli/**", "/packages/icons/**", "/packages/schema/**",
      "/packages/validators/**", "/package.json", "/pnpm-lock.yaml",
      "/pnpm-workspace.yaml", "/Dockerfile", "/.railway/**",
    ],
  });
  assert.deepEqual(web.deploy, {
    healthcheckPath: "/health",
    healthcheckTimeout: 120,
    restartPolicyType: "ON_FAILURE",
    restartPolicyMaxRetries: 3,
    overlapSeconds: 20,
    drainingSeconds: 10,
    multiRegionConfig: { "europe-west4-drams3a": { numReplicas: 1 } },
  });
  assert.deepEqual(web.networking.customDomains, {
    "formaglyph.com": { port: 8080 }, "www.formaglyph.com": { port: 8080 },
  });
});

test("fails closed for a different or missing project/environment", async () => {
  for (const input of [
    {},
    { ...target, projectId: "another-project" },
    { ...target, environmentId: "another-environment" },
  ]) {
    await assert.rejects(async () => railway(createRailwayContext(input), project), /must target/);
  }
});
