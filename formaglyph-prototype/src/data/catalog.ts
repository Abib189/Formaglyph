import {
  CheckCircle,
  CloudArrowUp,
  CloudCheck,
  CreditCard,
  CurrencyCircleDollar,
  DownloadSimple,
  PaperPlaneTilt,
  Receipt,
  SealCheck,
  ShieldCheck,
  UploadSimple,
} from "@phosphor-icons/react";
import type { Candidate, CatalogIcon, PersistedAppState } from "../domain/types";

export const iconResults: CatalogIcon[] = [
  { id: "circle-check", stableId: "ico_demo_001", name: "circle-check", label: "Circle check", category: "Status", description: "Indicates a completed or successful state.", Icon: CheckCircle, tags: ["payment", "successful", "complete", "confirm", "done"], aliases: ["success", "complete"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "circle-check-filled", stableId: "ico_demo_002", name: "circle-check-filled", label: "Circle check filled", category: "Status", description: "A higher-emphasis successful or completed state.", Icon: CheckCircle, tags: ["payment", "successful", "complete", "confirm", "solid"], aliases: ["success-filled"], version: "1.0.0", weight: "fill", directionality: "neutral", licence: "MIT" },
  { id: "receipt-check", stableId: "ico_demo_003", name: "receipt-check", label: "Receipt check", category: "Payments", description: "Confirms that a receipt or transaction is valid.", Icon: Receipt, tags: ["payment", "receipt", "successful", "transaction"], aliases: ["transaction-complete"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "card-check", stableId: "ico_demo_004", name: "card-check", label: "Card check", category: "Payments", description: "Represents a successful card payment.", Icon: CreditCard, tags: ["payment", "card", "successful", "checkout"], aliases: ["payment-card-success"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "shield-check", stableId: "ico_demo_005", name: "shield-check", label: "Shield check", category: "Security", description: "Communicates protection, verification, or trust.", Icon: ShieldCheck, tags: ["secure", "successful", "verified", "protected"], aliases: ["verified-shield"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "seal-check", stableId: "ico_demo_006", name: "seal-check", label: "Seal check", category: "Feedback", description: "Marks an approved or verified outcome.", Icon: SealCheck, tags: ["approved", "successful", "verified", "badge"], aliases: ["approved-badge"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "paper-plane-check", stableId: "ico_demo_007", name: "paper-plane-check", label: "Sent successfully", category: "Communication", description: "Represents a message or action sent successfully.", Icon: PaperPlaneTilt, tags: ["send", "successful", "message", "paper plane"], aliases: ["message-sent"], version: "1.0.0", weight: "regular", directionality: "ltr-specific", licence: "MIT" },
  { id: "cloud-upload", stableId: "ico_demo_008", name: "cloud-upload", label: "Cloud upload", category: "Files", description: "Uploads a file or dataset to cloud storage.", Icon: CloudArrowUp, tags: ["cloud", "upload", "file", "storage"], aliases: ["upload-cloud", "cloud-arrow-up"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "currency-check", stableId: "ico_demo_009", name: "currency-circle-check", label: "Payment complete", category: "Payments", description: "Represents money received or payment completed.", Icon: CurrencyCircleDollar, tags: ["payment", "successful", "money", "currency"], aliases: ["paid"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
  { id: "download-complete", stableId: "ico_demo_010", name: "download-complete", label: "Download complete", category: "Files", description: "Indicates that a file download has completed.", Icon: DownloadSimple, tags: ["download", "complete", "file", "successful"], aliases: ["downloaded"], version: "1.0.0", weight: "regular", directionality: "neutral", licence: "MIT" },
];

export const candidates: Candidate[] = [
  { id: "candidate-01", name: "Balanced", description: "Rounded cloud, centred arrow, and consistent live-area padding.", Icon: CloudArrowUp, issue: null },
  { id: "candidate-02", name: "Open base", description: "A wider base aperture gives the upload action more lift.", Icon: UploadSimple, issue: "Base opening breaks the family’s optical balance at 16px." },
  { id: "candidate-03", name: "Confirmed upload", description: "Adds a completion cue for verified transfer states.", Icon: CloudCheck, issue: null },
];

export const initialAppState: PersistedAppState = {
  schemaVersion: 1,
  draft: {
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
};
