import type { CatalogIcon } from "../domain/types";
import type { IconVariant } from "@formaglyph/schema";

export interface SearchOptions {
  category?: string;
  variant?: "all" | IconVariant;
}

function normalize(value: string) {
  return value.toLocaleLowerCase().trim();
}

export function scoreIcon(query: string, icon: CatalogIcon): number {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const name = normalize(icon.name);
  const aliases = icon.aliases.map((alias) => normalize(alias.value));
  const tags = icon.tags.map(normalize);
  const category = normalize(icon.category);

  return terms.reduce((score, term) => {
    if (name === term) return score + 100;
    if (name.includes(term)) score += 30;
    if (aliases.some((alias) => alias === term)) score += 40;
    if (aliases.some((alias) => alias.includes(term))) score += 20;
    if (tags.some((tag) => tag === term)) score += 16;
    if (tags.some((tag) => tag.includes(term))) score += 8;
    if (category.includes(term)) score += 4;
    return score;
  }, 0);
}

export function searchIcons(catalog: CatalogIcon[], query: string, options: SearchOptions = {}) {
  return catalog
    .filter((icon) => !options.category || options.category === "all" || icon.category === options.category)
    .filter((icon) => !options.variant || options.variant === "all" || icon.variant === options.variant)
    .map((icon) => ({ icon, score: scoreIcon(query, icon) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.icon.name.localeCompare(b.icon.name))
    .map(({ icon, score }) => ({ ...icon, matchScore: score }));
}
