import { importSvgCandidate } from "./generation";
import type { Candidate } from "../domain/types";

/** Both variants belong to a single candidate; no inferred or fabricated sibling. */
export function importSvgPair(input: {
  name: string;
  regular: string | null;
  solid: string | null;
}): Candidate {
  if (!input.regular && !input.solid)
    throw new Error("Choose at least one SVG file.");
  const regular = input.regular
    ? importSvgCandidate(input.regular, "regular", input.name)
    : null;
  const solid = input.solid
    ? importSvgCandidate(input.solid, "solid", input.name)
    : null;
  const base = regular ?? solid!;
  return {
    ...base,
    name: input.name.trim() || "Imported pair",
    description:
      "Manually imported SVG candidate. Both variants keep their own geometry.",
    variants: {
      regular: regular?.variants.regular ?? null,
      solid: solid?.variants.solid ?? null,
    },
    issue: [regular?.issue, solid?.issue].filter(Boolean).join(" ") || null,
  };
}
