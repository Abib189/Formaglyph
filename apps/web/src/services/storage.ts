import { initialAppState } from "../data/catalog";
import type { LegacyPersistedAppState, PersistedAppState } from "../domain/types";

export const STORAGE_KEY = "formaglyph-app-state:v2";
export const LEGACY_STORAGE_KEY = "formaglyph-app-state:v1";

function cloneInitialState(): PersistedAppState {
  return structuredClone(initialAppState);
}

export function loadAppState(storage: Pick<Storage, "getItem"> = window.localStorage): PersistedAppState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) return cloneInitialState();
      const legacy = JSON.parse(legacyRaw) as Partial<LegacyPersistedAppState>;
      if (legacy.schemaVersion !== 1 || !legacy.draft || !legacy.proposal) return cloneInitialState();
      return {
        ...cloneInitialState(),
        draft: { ...legacy.draft, workspaceIconId: "wrk-cloud-upload" },
        proposal: legacy.proposal,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    if (parsed.schemaVersion !== 2 || !parsed.draft || !parsed.proposal || !parsed.workspace || !parsed.settings) return cloneInitialState();
    return parsed as PersistedAppState;
  } catch {
    return cloneInitialState();
  }
}

export function saveAppState(state: PersistedAppState, storage: Pick<Storage, "setItem"> = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
