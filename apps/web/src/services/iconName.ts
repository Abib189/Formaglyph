const ICON_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidIconName(name: string): boolean {
  return ICON_NAME_PATTERN.test(name);
}

export function iconNameError(name: string): string | null {
  if (isValidIconName(name)) return null;
  if (!name.trim()) return "Enter an icon name using lowercase letters, numbers, and hyphens.";

  const suggestion = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return suggestion
    ? `Use a kebab-case icon name without spaces, for example “${suggestion}”.`
    : "Use a kebab-case icon name with lowercase letters, numbers, and hyphens.";
}
