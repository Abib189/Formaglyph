import { defineRailway, project, service } from "railway/iac";
import { expectedRestartPolicy } from "./restart-policy.ts";

// This repository owns only this service, not the entire environment.
export const partial = "formaglyph-web";

export default defineRailway((ctx) => {
  if (
    ctx.projectId !== "7d28f580-dff3-4779-b51d-322a484adb96" ||
    ctx.environmentId !== "a1fe3272-826c-4288-83e5-11d080bcb2d2"
  ) {
    throw new Error("Formaglyph IaC must target the existing production project and environment.");
  }

  const web = service("formaglyph-web", {
    // Intentionally omit source: deployments continue through the existing CLI workflow.
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: [
        "/apps/web/**",
        "/packages/cli/**",
        "/packages/icons/**",
        "/packages/schema/**",
        "/packages/validators/**",
        "/package.json",
        "/pnpm-lock.yaml",
        "/pnpm-workspace.yaml",
        "/Dockerfile",
        "/.railway/**",
      ],
    },
    deploy: {
      healthcheckPath: "/health",
      healthcheckTimeout: 120,
      // ON_FAILURE is Railway's omitted default. Explicitly spelling it here
      // causes perpetual null -> ON_FAILURE drift in CLI 5.64.1 and 5.71.0.
      // pnpm iac:verify checks the actual policy independently of the planner.
      restartPolicyMaxRetries: expectedRestartPolicy.restartPolicyMaxRetries,
      overlapSeconds: 20,
      drainingSeconds: 10,
    },
    replicas: { "europe-west4-drams3a": 1 },
    // Existing implicit ports normalize to 8080; the live plan must show no networking diff.
    domains: ["formaglyph.com", "www.formaglyph.com"],
  });

  return {
    ...project("Formaglyph", { resources: [web] }),
    // Native CLI metadata (not yet declared in railway@3.16.0's ProjectDefinition).
    // Never export, manage, or remove the existing dashboard variables here.
    variables: { managed: false },
  };
});
