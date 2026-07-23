import { CloudArrowUp, CurrencyCircleDollar, DownloadSimple, FolderSimple, LockKey, MagnifyingGlass } from "@phosphor-icons/react";
import { formaglyphAssets } from "@formaglyph/icons";
import type { Candidate, CatalogIcon, PersistedAppState } from "../domain/types";

export const iconResults: CatalogIcon[] = formaglyphAssets.map((asset) => ({
  ...asset,
  previewWeight: asset.variant === "solid" ? "fill" : "regular",
}));

function referenceCandidate(id: string, stableId: string, name: string, description: string): Candidate {
  const regular = formaglyphAssets.find((asset) => asset.stableId === stableId && asset.variant === "regular");
  const solid = formaglyphAssets.find((asset) => asset.stableId === stableId && asset.variant === "solid");
  if (!regular || !solid) throw new Error(`Missing Formaglyph reference pair: ${stableId}`);
  return {
    id,
    name,
    description,
    variants: { regular: regular.svg, solid: solid.svg },
    issue: null,
    provenance: {
      kind: "reference",
      adapter: "local_geometry",
      model: "Formaglyph Core reference geometry",
      promptHash: null,
      generationJobId: null,
      disclosed: true,
    },
    createdAt: "2026-07-20T14:47:00.000Z",
  };
}

export const candidates: Candidate[] = [
  referenceCandidate("candidate-01", "ico_fg_004_cloud_upload", "Balanced", "Rounded cloud, centred arrow, and consistent live-area padding."),
  referenceCandidate("candidate-02", "ico_fg_005_cloud_sync", "Synchronous", "Keeps the cloud profile while testing a compact bidirectional action."),
  referenceCandidate("candidate-03", "ico_fg_006_download_tray", "Transfer", "Tests the same transfer intent against the tray construction family."),
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
  schemaVersion: 4,
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
  candidates,
  generationJob: null,
  auditEvents: [
    { id: "evt-local-3", action: "proposal.submitted", actorId: "local-contributor", targetType: "proposal", targetId: "PRP-028", source: "local", occurredAt: "2026-07-20T14:48:00.000Z", metadata: { candidate: "candidate-01" } },
    { id: "evt-local-2", action: "icon.published", actorId: "local-admin", targetType: "icon_version", targetId: "rel-secure-file-101", source: "local", occurredAt: "2026-07-19T16:10:00.000Z", metadata: { version: "1.0.1" } },
    { id: "evt-local-1", action: "review.comment_added", actorId: "local-reviewer", targetType: "review", targetId: "R2", source: "local", occurredAt: "2026-07-19T09:42:00.000Z", metadata: { title: "Shoulder balance" } },
  ],
  releaseEntries: [
    { id: "rel-secure-file-101", iconId: "wrk-secure-file", iconName: "secure-file", version: "1.0.1", variant: "regular", status: "published", contentHash: "5ee61b90d2a0d4f4b3107756ee7c26f4399a895f25f7bfcf152f4a947aae64d1", occurredAt: "2026-07-19T16:10:00.000Z", reason: null },
  ],
};
