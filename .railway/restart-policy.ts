// Railway's canonical representation omits the ON_FAILURE default. Keep the
// intended runtime contract explicit here, independently of the plan's shape.
export const expectedRestartPolicy = {
  restartPolicyType: "ON_FAILURE",
  restartPolicyMaxRetries: 3,
} as const;

export function verifyRestartPolicy(value: unknown): typeof expectedRestartPolicy {
  if (
    !value ||
    typeof value !== "object" ||
    !("restartPolicyType" in value) ||
    !("restartPolicyMaxRetries" in value) ||
    value.restartPolicyType !== expectedRestartPolicy.restartPolicyType ||
    value.restartPolicyMaxRetries !== expectedRestartPolicy.restartPolicyMaxRetries
  ) {
    throw new Error("Railway restart policy mismatch: expected ON_FAILURE with 3 retries.");
  }
  return expectedRestartPolicy;
}
