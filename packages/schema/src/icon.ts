export const ICON_VARIANTS = ["regular", "solid"] as const;
export type IconVariant = (typeof ICON_VARIANTS)[number];

export const ICON_DIRECTIONALITIES = ["neutral", "ltr-specific", "rtl-specific", "mirrored-safe"] as const;
export type IconDirectionality = (typeof ICON_DIRECTIONALITIES)[number];

export const ICON_STATUSES = ["draft", "in-review", "published", "deprecated", "seed"] as const;
export type IconStatus = (typeof ICON_STATUSES)[number];

export interface LocalizedAlias {
  locale: string;
  value: string;
  reviewed: boolean;
}

export interface IconProvenance {
  kind: "original" | "generated" | "imported" | "third-party";
  source: string;
  sourceRevision?: string;
  adapter?: string;
  disclosed: boolean;
}

export interface IconRecord {
  id: string;
  stableId: string;
  name: string;
  label: string;
  category: string;
  description: string;
  tags: string[];
  aliases: LocalizedAlias[];
  version: string;
  variant: IconVariant;
  directionality: IconDirectionality;
  licence: "MIT";
  status: IconStatus;
  provenance: IconProvenance;
}

export function isStableIconId(value: string): boolean {
  return /^ico_[a-z0-9][a-z0-9_]*$/.test(value);
}

export function isSemver(value: string): boolean {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value);
}

export function validateIconRecord(icon: IconRecord): string[] {
  const issues: string[] = [];
  if (!isStableIconId(icon.stableId)) issues.push("stableId must use the ico_* stable identifier format");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon.name)) issues.push("name must be kebab-case");
  if (!isSemver(icon.version)) issues.push("version must be semantic versioning");
  if (!icon.aliases.some((alias) => alias.locale === "en" && alias.reviewed)) issues.push("at least one reviewed English alias is required");
  if (!icon.provenance.source.trim()) issues.push("provenance source is required");
  return issues;
}
