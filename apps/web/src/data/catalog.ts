import {
  CheckCircle,
  CloudArrowUp,
  CloudCheck,
  CreditCard,
  CurrencyCircleDollar,
  DownloadSimple,
  FolderSimple,
  LockKey,
  MagnifyingGlass,
  PaperPlaneTilt,
  Receipt,
  SealCheck,
  ShieldCheck,
  UploadSimple,
} from "@phosphor-icons/react";
import type { Candidate, CatalogIcon, PersistedAppState } from "../domain/types";

const seedAliases = (...values: string[]) => values.map((value) => ({ locale: "en", value, reviewed: true }));
const seedProvenance = {
  kind: "third-party",
  source: "@phosphor-icons/react",
  disclosed: true,
} as const;

export const iconResults: CatalogIcon[] = [
  { id: "circle-check", stableId: "ico_demo_001", name: "circle-check", label: "Circle check", category: "Status", description: "Indicates a completed or successful state.", Icon: CheckCircle, tags: ["payment", "successful", "complete", "confirm", "done"], aliases: seedAliases("success", "complete"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "circle-check-filled", stableId: "ico_demo_002", name: "circle-check-filled", label: "Circle check filled", category: "Status", description: "A higher-emphasis successful or completed state.", Icon: CheckCircle, tags: ["payment", "successful", "complete", "confirm", "solid"], aliases: seedAliases("success-filled"), version: "1.0.0", variant: "solid", previewWeight: "fill", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "receipt-check", stableId: "ico_demo_003", name: "receipt-check", label: "Receipt check", category: "Payments", description: "Confirms that a receipt or transaction is valid.", Icon: Receipt, tags: ["payment", "receipt", "successful", "transaction"], aliases: seedAliases("transaction-complete"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "card-check", stableId: "ico_demo_004", name: "card-check", label: "Card check", category: "Payments", description: "Represents a successful card payment.", Icon: CreditCard, tags: ["payment", "card", "successful", "checkout"], aliases: seedAliases("payment-card-success"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "shield-check", stableId: "ico_demo_005", name: "shield-check", label: "Shield check", category: "Security", description: "Communicates protection, verification, or trust.", Icon: ShieldCheck, tags: ["secure", "successful", "verified", "protected"], aliases: seedAliases("verified-shield"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "seal-check", stableId: "ico_demo_006", name: "seal-check", label: "Seal check", category: "Feedback", description: "Marks an approved or verified outcome.", Icon: SealCheck, tags: ["approved", "successful", "verified", "badge"], aliases: seedAliases("approved-badge"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "paper-plane-check", stableId: "ico_demo_007", name: "paper-plane-check", label: "Sent successfully", category: "Communication", description: "Represents a message or action sent successfully.", Icon: PaperPlaneTilt, tags: ["send", "successful", "message", "paper plane"], aliases: seedAliases("message-sent"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "ltr-specific", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "cloud-upload", stableId: "ico_demo_008", name: "cloud-upload", label: "Cloud upload", category: "Files", description: "Uploads a file or dataset to cloud storage.", Icon: CloudArrowUp, tags: ["cloud", "upload", "file", "storage"], aliases: seedAliases("upload-cloud", "cloud-arrow-up"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "currency-check", stableId: "ico_demo_009", name: "currency-circle-check", label: "Payment complete", category: "Payments", description: "Represents money received or payment completed.", Icon: CurrencyCircleDollar, tags: ["payment", "successful", "money", "currency"], aliases: seedAliases("paid"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
  { id: "download-complete", stableId: "ico_demo_010", name: "download-complete", label: "Download complete", category: "Files", description: "Indicates that a file download has completed.", Icon: DownloadSimple, tags: ["download", "complete", "file", "successful"], aliases: seedAliases("downloaded"), version: "1.0.0", variant: "regular", previewWeight: "regular", directionality: "neutral", licence: "MIT", status: "seed", provenance: seedProvenance },
];

export const candidates: Candidate[] = [
  { id: "candidate-01", name: "Balanced", description: "Rounded cloud, centred arrow, and consistent live-area padding.", Icon: CloudArrowUp, issue: null },
  { id: "candidate-02", name: "Open base", description: "A wider base aperture gives the upload action more lift.", Icon: UploadSimple, issue: "Base opening breaks the family’s optical balance at 16px." },
  { id: "candidate-03", name: "Confirmed upload", description: "Adds a completion cue for verified transfer states.", Icon: CloudCheck, issue: null },
];

export const workspaceIconLibrary = {
  "cloud-upload": CloudArrowUp,
  "payment-confirmed": CurrencyCircleDollar,
  "secure-file": LockKey,
  "folder-organise": FolderSimple,
  "receipt-search": MagnifyingGlass,
  "download-archive": DownloadSimple,
} as const;

export const initialAppState: PersistedAppState = {
  schemaVersion: 2,
  draft: {
    workspaceIconId: "wrk-cloud-upload",
    name: "cloud-upload",
    description: "Cloud outline with an upward arrow centred inside. Represents uploading a file to cloud storage.",
    keywords: "cloud, upload, arrow, file, storage",
    selectedCandidateId: "candidate-01",
    updatedAt: "2026-07-20T14:47:00.000Z",
  },
  proposal: {
    id: "PRP-028",
    draftId: "DRAFT-014",
    status: "in_review",
    candidateId: "candidate-01",
    targetVersion: "1.1.0",
    submittedAt: "2026-07-20T14:48:00.000Z",
    decidedAt: null,
    comments: [
      { id: "R1", title: "Alignment", author: "You", time: "10:14", text: "Arrow stem was offset 1px down. Centred on the vertical keyline.", resolved: true },
      { id: "R2", title: "Shoulder balance", author: "Maya", time: "09:42", text: "Adjusted cloud shoulders for symmetry at 24px.", resolved: false },
      { id: "R3", title: "Tip weight", author: "Theo", time: "09:15", text: "Arrowhead weight now matches the existing Regular stroke.", resolved: false },
    ],
  },
  workspace: [
    { id: "wrk-cloud-upload", stableId: "ico_workspace_cloud_upload", name: "cloud-upload", label: "Cloud upload", description: "Cloud outline with a centred upload arrow for file transfer actions.", category: "Files", tags: ["cloud", "upload", "file", "storage"], project: "Formaglyph core", status: "in_review", variant: "regular", visualKey: "cloud-upload", creator: "You", updatedAt: "2026-07-20T14:48:00.000Z", validation: "passed", version: "1.1.0" },
    { id: "wrk-payment-confirmed", stableId: "ico_workspace_payment_confirmed", name: "payment-confirmed", label: "Payment confirmed", description: "Confirms a completed monetary transaction.", category: "Payments", tags: ["payment", "confirmed", "money"], project: "Commerce kit", status: "approved", variant: "solid", visualKey: "payment-confirmed", creator: "Maya", updatedAt: "2026-07-20T11:25:00.000Z", validation: "passed", version: "1.1.0" },
    { id: "wrk-secure-file", stableId: "ico_workspace_secure_file", name: "secure-file", label: "Secure file", description: "Represents protected documents and private storage.", category: "Security", tags: ["secure", "file", "private", "lock"], project: "Formaglyph core", status: "published", variant: "regular", visualKey: "secure-file", creator: "Theo", updatedAt: "2026-07-19T16:10:00.000Z", validation: "passed", version: "1.0.1" },
    { id: "wrk-folder-organise", stableId: "ico_workspace_folder_organise", name: "folder-organise", label: "Organise folder", description: "Groups files into a managed collection.", category: "Files", tags: ["folder", "organise", "files"], project: "Desktop set", status: "changes_requested", variant: "regular", visualKey: "folder-organise", creator: "You", updatedAt: "2026-07-19T09:05:00.000Z", validation: "issues", version: "1.1.0" },
    { id: "wrk-receipt-search", stableId: "ico_workspace_receipt_search", name: "receipt-search", label: "Search receipt", description: "Finds a transaction record or receipt.", category: "Payments", tags: ["receipt", "search", "transaction"], project: "Commerce kit", status: "draft", variant: "regular", visualKey: "receipt-search", creator: "You", updatedAt: "2026-07-18T13:42:00.000Z", validation: "passed", version: "1.1.0" },
    { id: "wrk-download-archive", stableId: "ico_workspace_download_archive", name: "download-archive", label: "Download archive", description: "Downloads a packaged file archive.", category: "Files", tags: ["download", "archive", "package"], project: "Desktop set", status: "archived", variant: "regular", visualKey: "download-archive", creator: "Maya", updatedAt: "2026-07-17T10:18:00.000Z", validation: "passed", version: "1.0.0" },
  ],
  settings: {
    generationAdapter: "local",
    hostedGeneration: false,
    automaticValidation: true,
    retainPrompts: false,
    mcpEnabled: true,
    apiScope: "read_write",
    projectProfile: "Formaglyph core",
    defaultVariant: "regular",
    integrations: { github: true, figma: false, penpot: false },
    localBackups: true,
    anonymousDiagnostics: false,
    apiKeyCreatedAt: null,
  },
};
