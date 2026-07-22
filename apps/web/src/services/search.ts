import type { CatalogIcon } from "../domain/types";
import type { IconVariant } from "@formaglyph/schema";

export interface SearchOptions {
  category?: string;
  variant?: "all" | IconVariant;
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(value: string) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function isOneEditAway(left: string, right: string) {
  if (left === right || Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const differences = [...left].flatMap((character, index) => character === right[index] ? [] : [index]);
    if (differences.length === 2 && differences[1] === differences[0] + 1 && left[differences[0]] === right[differences[1]] && left[differences[1]] === right[differences[0]]) return true;
  }
  let edits = 0;
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) leftIndex += 1;
    else if (right.length > left.length) rightIndex += 1;
    else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }
  return edits + Number(leftIndex < left.length || rightIndex < right.length) === 1;
}

export function scoreIcon(query: string, icon: CatalogIcon): number {
  const normalizedQuery = normalize(query);
  const terms = words(query);
  if (!terms.length) return 1;
  const name = normalize(icon.name);
  const label = normalize(icon.label);
  const aliases = icon.aliases.map((alias) => normalize(alias.value));
  const tags = icon.tags.map(normalize);
  const category = normalize(icon.category);
  const description = normalize(icon.description);
  const searchableWords = new Set([name, label, category, ...aliases, ...tags, ...words(icon.name), ...words(icon.label), ...words(icon.description), ...icon.aliases.flatMap((alias) => words(alias.value)), ...icon.tags.flatMap(words)]);

  let score = 0;
  if (name === normalizedQuery) score += 120;
  if (label === normalizedQuery) score += 90;
  if (aliases.some((alias) => alias === normalizedQuery)) score += 80;
  if (name.includes(normalizedQuery) || label.includes(normalizedQuery)) score += 35;
  if (aliases.some((alias) => alias.includes(normalizedQuery))) score += 30;

  let matchedTerms = 0;
  for (const term of terms) {
    let termScore = 0;
    if (name === term || label === term) termScore = Math.max(termScore, 45);
    if (name.includes(term)) termScore = Math.max(termScore, 30);
    if (aliases.some((alias) => alias === term)) termScore = Math.max(termScore, 40);
    if (aliases.some((alias) => alias.includes(term))) termScore = Math.max(termScore, 22);
    if (tags.some((tag) => tag === term)) termScore = Math.max(termScore, 18);
    if ([name, label, ...aliases, ...tags].some((value) => value.startsWith(term) || term.startsWith(value))) termScore = Math.max(termScore, 12);
    if (description.includes(term)) termScore = Math.max(termScore, 6);
    if (category.includes(term)) termScore = Math.max(termScore, 4);
    if (term.length >= 5 && [...searchableWords].some((value) => isOneEditAway(term, value))) termScore = Math.max(termScore, 3);
    if (termScore > 0) matchedTerms += 1;
    score += termScore;
  }
  if (matchedTerms === terms.length) score += 25;
  return score;
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
