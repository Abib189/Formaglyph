import type { IconRecord, IconVariant } from "@formaglyph/schema";
import { formaglyphAssets as catalog } from "./catalog.mjs";

export interface FormaglyphIconAsset extends IconRecord {
  assetPath: string;
  svg: string;
}

export const formaglyphAssets = catalog as readonly FormaglyphIconAsset[];

export function findFormaglyphAsset(stableId: string, variant: IconVariant) {
  return formaglyphAssets.find((asset) => asset.stableId === stableId && asset.variant === variant);
}
