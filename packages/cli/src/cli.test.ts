import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "./cli.js";
import type { FormaglyphCatalogClient, IconAsset } from "./catalog.js";

const asset = {
  stableId: "ico_fg_002_card_check",
  name: "card-check",
  label: "Card check",
  category: "Payments",
  description: "Accepted payment.",
  tags: ["payment"],
  aliases: [],
  directionality: "neutral",
  licence: "MIT",
  provenance: { kind: "original", source: "Formaglyph", disclosed: true },
  variant: "regular",
  version: "0.1.0",
  bytes: 42,
  sha256: "a".repeat(64),
  assetUrl: "https://api.formaglyph.test/icon.svg",
} satisfies IconAsset;

const temporaryDirectories: string[] = [];
afterEach(async () => Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

function harness(client: Partial<FormaglyphCatalogClient>) {
  let stdout = "";
  let stderr = "";
  return {
    io: { stdout: (value: string) => { stdout += value; }, stderr: (value: string) => { stderr += value; } },
    dependencies: { createClient: () => client as FormaglyphCatalogClient },
    output: () => ({ stdout, stderr }),
  };
}

describe("Formaglyph CLI", () => {
  it("prints concise intent search results", async () => {
    const search = vi.fn(async () => ({ data: [asset], page: { total: 1, limit: 12, nextCursor: null }, query: {} }));
    const test = harness({ search } as unknown as Partial<FormaglyphCatalogClient>);
    expect(await runCli(["search", "payment", "successful", "--variant", "regular"], test.io, test.dependencies)).toBe(0);
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ query: "payment successful", variant: "regular" }));
    expect(test.output().stdout).toContain("ico_fg_002_card_check");
  });

  it("exports SVG without overwriting unless force is explicit", async () => {
    const directory = await mkdtemp(join(tmpdir(), "formaglyph-cli-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "icon.svg");
    const getSvg = vi.fn(async () => ({ asset, svg: "<svg/>" }));
    const test = harness({ getSvg } as unknown as Partial<FormaglyphCatalogClient>);
    await runCli(["svg", asset.stableId, "--output", output], test.io, test.dependencies);
    expect(await readFile(output, "utf8")).toBe("<svg/>");
    await expect(runCli(["svg", asset.stableId, "--output", output], test.io, test.dependencies)).rejects.toMatchObject({ code: "EEXIST" });
    await writeFile(output, "old", "utf8");
    await runCli(["svg", asset.stableId, "--output", output, "--force"], test.io, test.dependencies);
    expect(await readFile(output, "utf8")).toBe("<svg/>");
  });

  it("validates commands before contacting the API", async () => {
    const test = harness({});
    await expect(runCli(["search", "status", "--limit", "0"], test.io, test.dependencies)).rejects.toThrow(/--limit/);
    await expect(runCli(["svg"], test.io, test.dependencies)).rejects.toThrow(/stable icon ID/);
    await expect(runCli(["unknown"], test.io, test.dependencies)).rejects.toThrow(/Unknown command/);
  });
});
