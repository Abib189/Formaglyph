import { describe, expect, it } from "vitest";
import { initialAppState } from "../data/catalog";
import { LEGACY_STORAGE_KEY, loadAppState, saveAppState, STORAGE_KEY } from "./storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), values };
}

describe("versioned local persistence", () => {
  it("falls back safely when persisted state is malformed", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "not-json" });
    expect(loadAppState(storage).schemaVersion).toBe(4);
  });

  it("round-trips application state", () => {
    const storage = memoryStorage();
    saveAppState(initialAppState, storage);
    expect(loadAppState(storage).proposal.id).toBe("PRP-028");
  });

  it("migrates version one drafts without losing review data", () => {
    const legacy = {
      schemaVersion: 1,
      draft: { ...initialAppState.draft, name: "legacy-icon" },
      proposal: { ...initialAppState.proposal, id: "PRP-LEGACY" },
    };
    const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) });
    const migrated = loadAppState(storage);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.draft.name).toBe("legacy-icon");
    expect(migrated.proposal.id).toBe("PRP-LEGACY");
    expect(migrated.workspace.length).toBeGreaterThan(0);
    expect(migrated.candidates.length).toBeGreaterThan(0);
    expect(migrated.auditEvents.length).toBeGreaterThan(0);
  });

  it("migrates version three generation data into governance storage", () => {
    const versionThree = {
      ...initialAppState,
      schemaVersion: 3,
      auditEvents: undefined,
      releaseEntries: undefined,
    };
    const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(versionThree) });
    const migrated = loadAppState(storage);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.candidates).toHaveLength(initialAppState.candidates.length);
    expect(migrated.auditEvents.length).toBeGreaterThan(0);
    expect(migrated.releaseEntries.length).toBeGreaterThan(0);
  });
});
