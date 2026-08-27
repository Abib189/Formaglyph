import { sanitizeAndValidateSvg, SvgValidationError } from "@formaglyph/validators";
import type { Candidate, CandidateProvenance, DraftBrief, GenerationProvider } from "../domain/types";

export const LOCAL_GENERATION_MODEL = "Formaglyph Local Geometry 0.1";

export interface GenerationRequest {
  brief: Pick<DraftBrief, "name" | "description" | "keywords">;
  candidateCount?: number;
  generationJobId?: string | null;
}

export interface GenerationProgress {
  progress: number;
  message: string;
}

export interface GenerationAdapter {
  readonly id: GenerationProvider;
  readonly label: string;
  readonly sendsDataOffDevice: boolean;
  generate(request: GenerationRequest, options?: { signal?: AbortSignal; onProgress?: (progress: GenerationProgress) => void }): Promise<Candidate[]>;
}

type ObjectKey = "cloud" | "file" | "folder" | "card" | "user" | "message" | "box" | "generic";
type ActionKey = "upload" | "download" | "check" | "search" | "lock" | "sync" | "warning" | "plus" | "send" | "spark";

const objectTerms: ReadonlyArray<[ObjectKey, readonly string[]]> = [
  ["cloud", ["cloud", "remote", "backup"]],
  ["folder", ["folder", "collection", "directory"]],
  ["card", ["card", "payment", "checkout", "transaction"]],
  ["file", ["file", "document", "receipt", "invoice"]],
  ["user", ["user", "account", "person", "profile", "identity"]],
  ["message", ["message", "mail", "email", "send", "chat"]],
  ["box", ["archive", "box", "package", "storage"]],
];

const actionTerms: ReadonlyArray<[ActionKey, readonly string[]]> = [
  ["upload", ["upload", "send up", "push"]],
  ["download", ["download", "receive", "save"]],
  ["check", ["check", "success", "complete", "confirm", "approved", "verified"]],
  ["search", ["search", "find", "lookup", "inspect"]],
  ["lock", ["lock", "secure", "private", "protected"]],
  ["sync", ["sync", "refresh", "repeat", "transfer"]],
  ["warning", ["warning", "alert", "risk", "error", "attention"]],
  ["plus", ["add", "create", "new", "plus"]],
  ["send", ["send", "sent", "deliver"]],
  ["spark", ["spark", "featured", "enhanced", "magic"]],
];

const regularObjects: Record<ObjectKey, string> = {
  cloud: '<path d="M6.5 18.5H6a4 4 0 0 1-.7-7.95A6.5 6.5 0 0 1 17.7 9.2 4.7 4.7 0 0 1 18 18.5h-.5"/>',
  file: '<path d="M5 3h8l4 4v14H5V3zM13 3v4h4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/>',
  user: '<circle cx="9" cy="7.5" r="3"/><path d="M3.5 18a5.5 5.5 0 0 1 9.8-3.45"/>',
  message: '<path d="M4 5h16v11H9l-5 4V5z"/>',
  box: '<rect x="3" y="5" width="18" height="4" rx="1"/><path d="M5 9v10.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9"/>',
  generic: '<rect x="4" y="4" width="16" height="16" rx="4"/>',
};

const solidObjects: Record<ObjectKey, string> = {
  cloud: '<path d="M3.6 10.5A5.1 5.1 0 0 1 13 9.9a3.9 3.9 0 0 1-.7 7.2H4.1a3.4 3.4 0 0 1-.5-6.6z"/>',
  file: '<path d="M3 3h7l4 4v13H3V3zm7 0v4h4"/>',
  folder: '<path d="M2 6a2 2 0 0 1 2-2h4l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/>',
  card: '<path d="M2 5h15a2 2 0 0 1 2 2v2H2V5zm0 6h17v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  user: '<path d="M8 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM1.5 20a6.5 6.5 0 0 1 11.7-3.9c-.15.7-.2 1.45-.1 2.2.05.6.2 1.15.4 1.7h-12z"/>',
  message: '<path d="M2 4h16v12H8l-6 5V4z"/>',
  box: '<path d="M2 4h16v5H2V4zm2 7h12v9H4v-9z"/>',
  generic: '<rect x="2" y="3" width="16" height="17" rx="4"/>',
};

const regularActions: Record<ActionKey, string> = {
  upload: '<path d="M16.5 21v-8M13.5 16l3-3 3 3"/>',
  download: '<path d="M16.5 12v8M13.5 17l3 3 3-3"/>',
  check: '<path d="M14 17l2 2 4-5"/>',
  search: '<circle cx="17" cy="16" r="3.5"/><path d="M19.6 18.6 22 21"/>',
  lock: '<rect x="13" y="14" width="8" height="7" rx="1.5"/><path d="M15 14v-1.5a2 2 0 0 1 4 0V14"/>',
  sync: '<path d="M13.5 15a4 4 0 0 1 6.8-1M20.5 11.5V14h-2.5M20.5 18a4 4 0 0 1-6.8 1M13.5 21.5V19H16"/>',
  warning: '<path d="M17 12.5l5 8.5H12l5-8.5zM17 15.5v2.3M17 19.5h.01"/>',
  plus: '<path d="M17 13v8M13 17h8"/>',
  send: '<path d="M12.5 17 22 12.5 19 22l-2.2-3.3-4.3-1.7zM16.8 18.7 22 12.5"/>',
  spark: '<path d="M17 12.5l.8 2.2 2.2.8-2.2.8L17 18.5l-.8-2.2-2.2-.8 2.2-.8.8-2.2zM21 18l.35.95.95.35-.95.35L21 20.6l-.35-.95-.95-.35.95-.35L21 18z"/>',
};

const solidActions: Record<ActionKey, string> = {
  upload: '<path d="M18 12l4 4h-2.5v6h-3v-6H14l4-4z"/>',
  download: '<path d="M16.5 12h3v6H22l-4 4-4-4h2.5v-6z"/>',
  check: '<path d="M14 17.2 16.8 20 22 14.6l-1.7-1.6-3.5 3.7-1.1-1.1-1.7 1.6z"/>',
  search: '<path fill-rule="evenodd" d="M17 12a5 5 0 1 0 2.9 9.1L22 23l1-1.2-2-1.8A5 5 0 0 0 17 12zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>',
  lock: '<path fill-rule="evenodd" d="M15 14v-1a3 3 0 0 1 6 0v1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zm2-1v1h2v-1a1 1 0 0 0-2 0z"/>',
  sync: '<path d="M14 15a5 5 0 0 1 7.5-2V11H23v5h-5v-1.5h2.1A3.5 3.5 0 0 0 15.5 16L14 15zm9 4a5 5 0 0 1-7.5 2v2H14v-5h5v1.5h-2.1a3.5 3.5 0 0 0 4.6-1.5L23 19z"/>',
  warning: '<path d="M18 12 24 23H12l6-11zm-1 4v3h2v-3h-2zm0 4v2h2v-2h-2z"/>',
  plus: '<path d="M16.5 12h3v3.5H23v3h-3.5V22h-3v-3.5H13v-3h3.5V12z"/>',
  send: '<path d="M13 17 23 12l-3.2 11-2.4-3-4.4-3zm4.4 1.5.8 1 1.7-4-2.5 3z"/>',
  spark: '<path d="M17.5 12 19 15.5l3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5 1.5-3.5zM22 19.5l.5 1 .9.5-.9.5-.5 1-.5-1-.9-.5.9-.5.5-1z"/>',
};

const variantNames = ["Balanced", "Compact", "Open field", "Optical", "Reduced", "Offset"] as const;
const variantDescriptions = [
  "Keeps the object and action on the primary 24px keylines.",
  "Reduces the silhouette to protect clarity at 16px.",
  "Creates more negative space between the object and action.",
  "Uses a half-unit optical correction around the action mark.",
  "Removes secondary geometry for small interface sizes.",
  "Tests an asymmetric action placement for directional clarity.",
] as const;

function inferKey<Key extends string>(text: string, entries: ReadonlyArray<[Key, readonly string[]]>, fallback: Key): Key {
  return entries.find(([, terms]) => terms.some((term) => text.includes(term)))?.[0] ?? fallback;
}

function regularSvg(object: ObjectKey, action: ActionKey, index: number) {
  const transform = index % 3 === 1 ? ' transform="translate(1.2 1.2) scale(.9)"' : index % 3 === 2 ? ' transform="translate(.5 0)"' : "";
  const strokeWidth = index % 3 === 2 ? "1.65" : "1.75";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g${transform}>${regularObjects[object]}${regularActions[action]}</g></svg>`;
}

function solidSvg(object: ObjectKey, action: ActionKey, index: number) {
  const transform = index % 3 === 1 ? ' transform="translate(1 1) scale(.92)"' : index % 3 === 2 ? ' transform="translate(.5 0)"' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" fill-rule="evenodd" aria-hidden="true" focusable="false"><g${transform}>${solidObjects[object]}${solidActions[action]}</g></svg>`;
}

function normalizeVariant(svg: string) {
  const result = sanitizeAndValidateSvg(svg);
  if (!result.safe || !result.normalizedSvg) throw new SvgValidationError(result);
  return result.normalizedSvg;
}

function aborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Generation was cancelled.", "AbortError");
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export function generationPrompt(brief: Pick<DraftBrief, "name" | "description" | "keywords">) {
  return [
    `Icon: ${brief.name.trim()}`,
    `Intent: ${brief.description.trim()}`,
    `Keywords: ${brief.keywords.trim() || "none"}`,
    "Style: 24px grid, rounded joins, currentColor only, Regular and Solid variants.",
  ].join("\n");
}

export async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class LocalGeometryAdapter implements GenerationAdapter {
  readonly id = "local_geometry" as const;
  readonly label = "Local geometry";
  readonly sendsDataOffDevice = false;

  async generate(request: GenerationRequest, options: { signal?: AbortSignal; onProgress?: (progress: GenerationProgress) => void } = {}) {
    const candidateCount = Math.min(6, Math.max(1, request.candidateCount ?? 3));
    const prompt = generationPrompt(request.brief);
    const promptHash = await sha256Text(prompt);
    const text = `${request.brief.name} ${request.brief.description} ${request.brief.keywords}`.toLowerCase();
    const object = inferKey(text, objectTerms, "generic");
    const action = inferKey(text, actionTerms, object === "message" ? "send" : "plus");
    const createdAt = new Date().toISOString();

    aborted(options.signal);
    options.onProgress?.({ progress: 20, message: "Reading the brief" });
    await yieldToBrowser();
    aborted(options.signal);
    options.onProgress?.({ progress: 55, message: "Composing system geometry" });

    const provenance: CandidateProvenance = {
      kind: "generated",
      adapter: this.id,
      model: LOCAL_GENERATION_MODEL,
      promptHash,
      generationJobId: request.generationJobId ?? null,
      disclosed: true,
    };
    const candidates = Array.from({ length: candidateCount }, (_, index): Candidate => ({
      id: `candidate-${crypto.randomUUID()}`,
      name: variantNames[index] ?? `Candidate ${index + 1}`,
      description: variantDescriptions[index] ?? "A deterministic local geometry variation.",
      variants: {
        regular: normalizeVariant(regularSvg(object, action, index)),
        solid: normalizeVariant(solidSvg(object, action, index)),
      },
      issue: null,
      provenance,
      createdAt,
    }));

    await yieldToBrowser();
    aborted(options.signal);
    options.onProgress?.({ progress: 90, message: "Validating SVG output" });
    await yieldToBrowser();
    aborted(options.signal);
    options.onProgress?.({ progress: 100, message: "Candidates ready" });
    return candidates;
  }
}

export function importSvgCandidate(svg: string, variant: "regular" | "solid", filename: string): Candidate {
  const result = sanitizeAndValidateSvg(svg);
  if (!result.safe || !result.normalizedSvg) throw new SvgValidationError(result);
  const name = filename.replace(/\.svg$/i, "").replace(/[^a-z0-9]+/gi, " ").trim() || "Imported SVG";
  return {
    id: `candidate-${crypto.randomUUID()}`,
    name: `Imported ${variant}`,
    description: `${name} was imported and normalized locally.`,
    variants: { regular: variant === "regular" ? result.normalizedSvg : null, solid: variant === "solid" ? result.normalizedSvg : null },
    issue: result.status === "failed" ? result.issues.find((issue) => issue.severity === "blocker" || issue.severity === "error")?.message ?? "Imported SVG needs review." : null,
    provenance: { kind: "imported", adapter: "manual_import", model: "Manual SVG import", promptHash: null, generationJobId: null, disclosed: true },
    createdAt: new Date().toISOString(),
  };
}
