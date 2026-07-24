import type { Candidate, CandidateProvenance } from "../domain/types";
import { validateCandidateAsset } from "./candidateValidation";

export interface PersistedCandidateAsset {
  id: string;
  name: string;
  description: string;
  variant: string;
  issue: string | null;
  provenance: unknown;
  generationJobId: string | null;
  promptSha256: string | null;
  createdAt: string;
}

export interface PersistedCandidateVariant {
  variant: "regular" | "solid";
  svg: string;
  expectedSha256: string;
}

const adapters = new Set<CandidateProvenance["adapter"]>([
  "local_geometry",
  "omnisvg",
  "starvector",
  "hosted",
  "manual_import",
]);

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function persistedProvenance(candidate: PersistedCandidateAsset): CandidateProvenance {
  const value = objectValue(candidate.provenance);
  const rawKind = typeof value.kind === "string" ? value.kind : "";
  const kind: CandidateProvenance["kind"] = rawKind === "generated"
    ? "generated"
    : rawKind === "reference"
      ? "reference"
      : "imported";
  const rawAdapter = typeof value.adapter === "string" ? value.adapter : "";
  const adapter = adapters.has(rawAdapter as CandidateProvenance["adapter"])
    ? rawAdapter as CandidateProvenance["adapter"]
    : kind === "imported"
      ? "manual_import"
      : "local_geometry";
  const model = typeof value.model === "string" && value.model.trim()
    ? value.model
    : kind === "imported"
      ? "Manual SVG import"
      : "Formaglyph candidate";
  const promptHash = typeof value.promptHash === "string"
    ? value.promptHash
    : candidate.promptSha256;
  const generationJobId = typeof value.generationJobId === "string"
    ? value.generationJobId
    : candidate.generationJobId;

  return {
    kind,
    adapter,
    model,
    promptHash,
    generationJobId,
    disclosed: true,
  };
}

export async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hydratePersistedCandidate(
  candidate: PersistedCandidateAsset,
  assets: PersistedCandidateVariant[],
): Promise<Candidate> {
  const variants: Candidate["variants"] = { regular: null, solid: null };
  for (const asset of assets) {
    const actualSha256 = await sha256Text(asset.svg);
    if (actualSha256 !== asset.expectedSha256) {
      throw new Error(`The submitted ${asset.variant} candidate failed its content integrity check.`);
    }
    const validation = validateCandidateAsset({
      id: candidate.id,
      name: candidate.name,
      description: candidate.description,
      svg: asset.svg,
      issue: candidate.issue,
      variant: asset.variant,
    });
    if (!validation.normalizedSvg) {
      throw new Error(`The submitted ${asset.variant} candidate does not contain safe SVG geometry.`);
    }
    variants[asset.variant] = validation.normalizedSvg;
  }
  if (!variants.regular && !variants.solid) {
    throw new Error("The submitted candidate does not contain a stored SVG variant.");
  }

  return {
    id: candidate.id,
    name: candidate.name,
    description: candidate.description,
    variants,
    issue: candidate.issue,
    provenance: persistedProvenance(candidate),
    createdAt: candidate.createdAt,
  };
}
