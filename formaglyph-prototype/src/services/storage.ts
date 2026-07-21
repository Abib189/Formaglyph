import { initialAppState } from "../data/catalog";
import type { PersistedAppState } from "../domain/types";

export const STORAGE_KEY = "formaglyph-app-state:v1";

function cloneInitialState(): PersistedAppState {
  return structuredClone(initialAppState);
}

export function loadAppState(storage: Pick<Storage, "getItem"> = window.localStorage): PersistedAppState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return cloneInitialState();
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    if (parsed.schemaVersion !== 1 || !parsed.draft || !parsed.proposal) return cloneInitialState();
    return parsed as PersistedAppState;
  } catch {
    return cloneInitialState();
  }
}

export function saveAppState(state: PersistedAppState, storage: Pick<Storage, "setItem"> = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
