const regular = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
const solid = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" fill-rule="evenodd" aria-hidden="true" focusable="false">${body}</svg>`;

const concepts = [
  {
    stableId: "ico_fg_001_check_circle", name: "check-circle", label: "Check circle", category: "Status",
    description: "Confirms that an action or process completed successfully.", tags: ["success", "complete", "confirm", "payment", "done"], aliases: ["success", "complete", "confirmed"], directionality: "neutral",
    regular: regular('<circle cx="12" cy="12" r="9"/><path d="M7.75 12.1l2.7 2.7 5.85-6"/>'),
    solid: solid('<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM6.9 12.2l3.55 3.55 6.7-6.85-1.45-1.4-5.25 5.4-2.1-2.1-1.45 1.4z"/>'),
  },
  {
    stableId: "ico_fg_002_card_check", name: "card-check", label: "Card check", category: "Payments",
    description: "Represents a card payment that has been accepted.", tags: ["payment", "card", "checkout", "success", "transaction"], aliases: ["payment successful", "approved card", "checkout complete"], directionality: "neutral",
    regular: regular('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18M13.5 14l1.7 1.7 3.3-3.5M6.5 15.5h3"/>'),
    solid: solid('<path d="M5.5 4h13A3.5 3.5 0 0 1 22 7.5V9H2V7.5A3.5 3.5 0 0 1 5.5 4zM2 11h20v5.5a3.5 3.5 0 0 1-3.5 3.5h-13A3.5 3.5 0 0 1 2 16.5V11zm11.2 4.3 2.1 2.1 4-4.2-1.25-1.2-2.75 2.9-.85-.85-1.25 1.25z"/>'),
  },
  {
    stableId: "ico_fg_003_receipt_search", name: "receipt-search", label: "Receipt search", category: "Payments",
    description: "Finds a receipt, invoice, or transaction record.", tags: ["receipt", "search", "invoice", "transaction", "find"], aliases: ["find receipt", "invoice search", "transaction lookup"], directionality: "neutral",
    regular: regular('<path d="M5 3.5v17l2-1.4 2 1.4 2-1.4 2 1.4 1.2-.85M8 8h6M8 11.5h4"/><circle cx="16.5" cy="15" r="3.5"/><path d="M19.1 17.6 21 19.5"/>'),
    solid: solid('<path d="M4 2.5v19l3-2 2.5 1.7 2.5-1.7 1.2.8a5.5 5.5 0 0 1-.7-6.95A5.5 5.5 0 0 1 20 11.8V2.5H4zM8 7h8v2H8V7zm0 4h5v2H8v-2zM16.5 12a4.5 4.5 0 1 0 2.65 8.15L21 22l1-1-1.85-1.85A4.5 4.5 0 0 0 16.5 12zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/>'),
  },
  {
    stableId: "ico_fg_004_cloud_upload", name: "cloud-upload", label: "Cloud upload", category: "Files",
    description: "Uploads a file or dataset to cloud storage.", tags: ["cloud", "upload", "file", "storage", "transfer"], aliases: ["upload cloud", "send file", "cloud transfer"], directionality: "neutral",
    regular: regular('<path d="M7.5 18.5H6a4 4 0 0 1-.7-7.95A6.5 6.5 0 0 1 17.7 9.2 4.7 4.7 0 0 1 18 18.5h-1.5M12 19V10.5M8.8 13.7 12 10.5l3.2 3.2"/>'),
    solid: solid('<path d="M5.3 9.35A7.5 7.5 0 0 1 19 8.45 5.7 5.7 0 0 1 18 19H6A5 5 0 0 1 5.3 9.35zM12 8.8 7.8 13l1.4 1.4 1.8-1.8V21h2v-8.4l1.8 1.8 1.4-1.4L12 8.8z"/>'),
  },
  {
    stableId: "ico_fg_005_cloud_sync", name: "cloud-sync", label: "Cloud sync", category: "Files",
    description: "Synchronises local data with a remote source.", tags: ["cloud", "sync", "refresh", "backup", "storage"], aliases: ["sync cloud", "cloud refresh", "backup sync"], directionality: "neutral",
    regular: regular('<path d="M8 18.5H6a4 4 0 0 1-.7-7.95A6.5 6.5 0 0 1 17.7 9.2 4.7 4.7 0 0 1 18 18.5h-2"/><path d="M8.5 14a4 4 0 0 1 6.7-1.1M15.5 10.5v2.8h-2.8M15.5 16a4 4 0 0 1-6.7 1.1M8.5 19.5v-2.8h2.8"/>'),
    solid: solid('<path d="M5.3 9.35A7.5 7.5 0 0 1 19 8.45 5.7 5.7 0 0 1 18 19H6A5 5 0 0 1 5.3 9.35zM8 14a4.8 4.8 0 0 1 7.65-1.9V10h2v5h-5v-2h1.55A2.8 2.8 0 0 0 10 14H8zm8 2a4.8 4.8 0 0 1-7.65 1.9V20h-2v-5h5v2H9.8A2.8 2.8 0 0 0 14 16h2z"/>'),
  },
  {
    stableId: "ico_fg_006_download_tray", name: "download-tray", label: "Download tray", category: "Files",
    description: "Downloads an asset into a local destination.", tags: ["download", "file", "save", "tray", "transfer"], aliases: ["save file", "download complete", "receive file"], directionality: "neutral",
    regular: regular('<path d="M12 3.5v11M8.5 11l3.5 3.5 3.5-3.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4"/>'),
    solid: solid('<path d="M10.5 2h3v10.15l2.45-2.45 2.1 2.1L12 17.85 5.95 11.8l2.1-2.1 2.45 2.45V2zM3 14h3v4h12v-4h3v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>'),
  },
  {
    stableId: "ico_fg_007_file_lock", name: "file-lock", label: "File lock", category: "Security",
    description: "Marks a document as protected or access restricted.", tags: ["file", "document", "lock", "secure", "private"], aliases: ["secure file", "locked document", "private file"], directionality: "neutral",
    regular: regular('<path d="M5 3h8l4 4v4M13 3v4h4M5 3v18h7"/><rect x="12" y="14" width="8" height="6.5" rx="1.5"/><path d="M14.5 14v-1.2a1.5 1.5 0 0 1 3 0V14"/>'),
    solid: solid('<path d="M4 2h10l5 5v4h-3V8h-4V4H7v16h3v3H4V2zM13 12.5a3.5 3.5 0 0 1 7 0v.5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2v-.5zm2 0v.5h3v-.5a1.5 1.5 0 0 0-3 0z"/>'),
  },
  {
    stableId: "ico_fg_008_folder_spark", name: "folder-spark", label: "Folder spark", category: "Files",
    description: "Highlights a new, featured, or enhanced collection.", tags: ["folder", "new", "featured", "spark", "collection"], aliases: ["new folder", "featured folder", "smart folder"], directionality: "neutral",
    regular: regular('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11zM14.5 10.5l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55.55-1.45zM18 14.5l.35.9.9.35-.9.35-.35.9-.35-.9-.9-.35.9-.35.35-.9z"/>'),
    solid: solid('<path d="M4.5 4H9l2 2h8.5A2.5 2.5 0 0 1 22 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-11A2.5 2.5 0 0 1 4.5 4zm10 5-1 2.5L11 12.5l2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5zm4 5-.55 1.45L16.5 16l1.45.55L18.5 18l.55-1.45L20.5 16l-1.45-.55L18.5 14z"/>'),
  },
  {
    stableId: "ico_fg_009_user_shield", name: "user-shield", label: "User shield", category: "Security",
    description: "Represents a protected account or verified identity.", tags: ["user", "account", "shield", "identity", "secure"], aliases: ["secure account", "protected user", "verified identity"], directionality: "neutral",
    regular: regular('<circle cx="9" cy="7.5" r="3"/><path d="M3.5 18a5.5 5.5 0 0 1 8.8-4.4M17 11.5l4 1.5v3.3c0 2.4-1.65 4.1-4 5.2-2.35-1.1-4-2.8-4-5.2V13l4-1.5zM15.2 16.4l1.15 1.15 2.45-2.5"/>'),
    solid: solid('<path d="M9 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM2 20a7 7 0 0 1 10.1-6.3c-.1.55-.1 1.15-.1 1.8 0 2.85 1.35 5 3.3 6.5H2v-2zM17 10l5 1.9v4.15c0 3.05-2.05 5.2-5 6.55-2.95-1.35-5-3.5-5-6.55V11.9L17 10zm-2.3 6.15 1.5 1.5 3.2-3.3-1.1-1.05-2.1 2.15-.4-.4-1.1 1.1z"/>'),
  },
  {
    stableId: "ico_fg_010_message_sent", name: "message-sent", label: "Message sent", category: "Communication",
    description: "Confirms that a message was sent to its destination.", tags: ["message", "send", "sent", "communication", "success"], aliases: ["send message", "message delivered", "paper plane"], directionality: "ltr-specific",
    regular: regular('<path d="M3 11.5 21 3l-5.5 18-4-6-8.5-3.5zM11.5 15 21 3"/>'),
    solid: solid('<path d="M2 11.7 22.5 2 16.2 22l-5.1-6.05L2 11.7zm9.1 1.8 2 2.4L18.4 7l-7.3 6.5z"/>'),
  },
  {
    stableId: "ico_fg_011_warning_diamond", name: "warning-diamond", label: "Warning diamond", category: "Feedback",
    description: "Signals a condition that needs attention before proceeding.", tags: ["warning", "alert", "attention", "error", "caution"], aliases: ["caution", "attention required", "risk alert"], directionality: "neutral",
    regular: regular('<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="2.2" transform="rotate(45 12 12)"/><path d="M12 7.5v6M12 17h.01"/>'),
    solid: solid('<path d="M10.2 2.75a2.55 2.55 0 0 1 3.6 0l7.45 7.45a2.55 2.55 0 0 1 0 3.6l-7.45 7.45a2.55 2.55 0 0 1-3.6 0L2.75 13.8a2.55 2.55 0 0 1 0-3.6l7.45-7.45zM11 6.5v7h2v-7h-2zm0 9.5v2h2v-2h-2z"/>'),
  },
  {
    stableId: "ico_fg_012_archive_box", name: "archive-box", label: "Archive box", category: "Files",
    description: "Stores an item in a retained archive.", tags: ["archive", "box", "store", "retain", "package"], aliases: ["archive item", "storage box", "retain file"], directionality: "neutral",
    regular: regular('<rect x="3" y="5" width="18" height="4" rx="1"/><path d="M5 9v10.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9M9 13h6"/>'),
    solid: solid('<path d="M3.5 3h17A2.5 2.5 0 0 1 23 5.5v3A2.5 2.5 0 0 1 20.5 11h-17A2.5 2.5 0 0 1 1 8.5v-3A2.5 2.5 0 0 1 3.5 3zM3 12h18v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5V12zm6 3v2h6v-2H9z"/>'),
  },
];

export const formaglyphAssets = concepts.flatMap((concept) => ["regular", "solid"].map((variant) => ({
  id: `${concept.stableId}:${variant}`,
  stableId: concept.stableId,
  name: concept.name,
  label: concept.label,
  category: concept.category,
  description: concept.description,
  tags: concept.tags,
  aliases: concept.aliases.map((value) => ({ locale: "en", value, reviewed: true })),
  version: "0.1.0",
  variant,
  directionality: concept.directionality,
  licence: "MIT",
  status: "published",
  provenance: { kind: "original", source: "Formaglyph geometry source", sourceRevision: "starter-0.1", disclosed: true },
  assetPath: `assets/${concept.name}/${variant}.svg`,
  svg: concept[variant],
})));
