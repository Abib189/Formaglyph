export const SCOPES = [
  "icons:read",
  "styles:read",
  "assets:render",
  "drafts:write",
  "proposals:write",
  "reviews:write",
  "releases:publish",
  "projects:audit",
  "admin:*",
] as const;

export type Scope = (typeof SCOPES)[number];
export type Role = "guest" | "member" | "contributor" | "reviewer" | "admin" | "agent";

export const roleScopes: Readonly<Record<Role, readonly Scope[]>> = {
  guest: ["icons:read", "styles:read"],
  member: ["icons:read", "styles:read", "assets:render"],
  contributor: ["icons:read", "styles:read", "assets:render", "drafts:write", "proposals:write"],
  reviewer: ["icons:read", "styles:read", "assets:render", "drafts:write", "proposals:write", "reviews:write"],
  admin: SCOPES,
  agent: ["icons:read", "styles:read", "assets:render", "drafts:write", "proposals:write"],
};

export function roleHasScope(role: Role, scope: Scope): boolean {
  const granted = roleScopes[role];
  return granted.includes("admin:*") || granted.includes(scope);
}

export function isPrivilegedScope(scope: Scope): boolean {
  return scope === "reviews:write" || scope === "releases:publish" || scope === "admin:*";
}
