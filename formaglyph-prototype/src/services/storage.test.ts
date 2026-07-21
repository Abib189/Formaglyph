import { describe, expect, it } from "vitest";
import { initialAppState } from "../data/catalog";
import { loadAppState, saveAppState, STORAGE_KEY } from "./storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), values };
}

describe("versioned local persistence", () => {
  it("falls back safely when persisted state is malformed", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "not-json" });
    expect(loadAppState(storage).schemaVersion).toBe(1);
  });

  it("round-trips application state", () => {
    const storage = memoryStorage();
    saveAppState(initialAppState, storage);
    expect(loadAppState(storage).proposal.id).toBe("PRP-028");
  });
});
