import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { validateIconRecord } from "@formaglyph/schema";
import { sanitizeAndValidateSvg } from "@formaglyph/validators";
import { findFormaglyphAsset, formaglyphAssets } from "./index";

describe("Formaglyph original catalog", () => {
  it("ships a regular and solid asset for every stable concept", () => {
    const stableIds = new Set(formaglyphAssets.map((asset) => asset.stableId));
    expect(stableIds.size).toBe(48);
    expect(formaglyphAssets).toHaveLength(96);
    for (const stableId of stableIds) {
      expect(findFormaglyphAsset(stableId, "regular")).toBeDefined();
      expect(findFormaglyphAsset(stableId, "solid")).toBeDefined();
    }
  });

  it("preserves every original 0.1.0 record and asset byte", () => {
    const original = formaglyphAssets.filter((asset) => asset.version === "0.1.0");
    expect(original).toHaveLength(24);
    expect(createHash("sha256").update(JSON.stringify(original)).digest("hex"))
      .toBe("3ecd5931dba1f0c26914039226a28ad303c7129a46cdaee472f1fec948ba7ad8");
  });

  it("adds distinct original pairs with searchable metadata and explicit directionality", () => {
    expect(new Set(formaglyphAssets.map((asset) => asset.id)).size).toBe(96);
    expect(new Set(formaglyphAssets.map((asset) => asset.name)).size).toBe(48);
    expect(new Set(formaglyphAssets.map((asset) => asset.svg)).size).toBe(96);
    const additions = formaglyphAssets.filter((asset) => asset.version === "0.2.0");
    expect(additions).toHaveLength(72);
    for (const asset of additions) {
      expect(asset.tags.length, asset.id).toBeGreaterThanOrEqual(4);
      expect(asset.aliases.every((alias) => alias.reviewed), asset.id).toBe(true);
      expect(asset.provenance).toMatchObject({ kind: "original", sourceRevision: "core-0.2", disclosed: true });
    }
    expect(formaglyphAssets.find((asset) => asset.name === "arrow-left")?.directionality).toBe("mirrored-safe");
    expect(formaglyphAssets.find((asset) => asset.name === "arrow-up")?.directionality).toBe("neutral");
  });

  it("passes record and deterministic SVG validation", () => {
    for (const asset of formaglyphAssets) {
      expect(validateIconRecord(asset), asset.id).toEqual([]);
      const validation = sanitizeAndValidateSvg(asset.svg);
      expect(validation.status, asset.id).toBe("passed");
      expect(validation.safe, asset.id).toBe(true);
      expect(validation.measurements.viewBox, asset.id).toEqual([0, 0, 24, 24]);
    }
  });

  it("keeps generated asset files and hashes in sync", async () => {
    const manifest = JSON.parse(await readFile(resolve(process.cwd(), "assets/manifest.json"), "utf8")) as { schemaVersion: number; conceptCount: number; assetCount: number; assets: Array<{ path: string; sha256: string; aliases: unknown[] }> };
    expect(manifest).toMatchObject({ schemaVersion: 2, version: "0.2.0", conceptCount: 48, assetCount: 96 });
    expect(manifest.assets).toHaveLength(formaglyphAssets.length);
    for (const entry of manifest.assets) {
      const svg = await readFile(resolve(process.cwd(), entry.path), "utf8");
      expect(createHash("sha256").update(svg).digest("hex"), entry.path).toBe(entry.sha256);
      expect(entry.aliases.length, entry.path).toBeGreaterThan(0);
    }
  });

  it("builds a self-contained npm-ready release", async () => {
    const packageJson = JSON.parse(await readFile(resolve(process.cwd(), "release/package.json"), "utf8")) as { name: string; version: string; exports: Record<string, unknown> };
    expect(packageJson).toMatchObject({ name: "@formaglyph/icons", version: "0.2.0", exports: { "./manifest.json": "./manifest.json", "./svg/*": "./svg/*" } });
    const release = await import(`${pathToFileURL(resolve(process.cwd(), "release/index.js")).href}?test=${Date.now()}`) as { formaglyphAssets: unknown[]; findFormaglyphAsset: (stableId: string, variant: string) => unknown };
    expect(release.formaglyphAssets).toHaveLength(96);
    expect(release.findFormaglyphAsset("ico_fg_002_card_check", "solid")).toBeDefined();
    const packaged = await readdir(resolve(process.cwd(), "release/svg"), { recursive: true, withFileTypes: true });
    expect(packaged.filter((entry) => entry.isFile())).toHaveLength(96);
    expect(packaged.filter((entry) => entry.isFile()).every((entry) => entry.name.endsWith(".svg"))).toBe(true);
  });
});
