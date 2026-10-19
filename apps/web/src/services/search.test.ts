import { describe, expect, it } from "vitest";
import { iconResults } from "../data/catalog";
import { scoreIcon, searchIcons } from "./search";

describe("catalog search", () => {
  it("ranks an exact canonical name above tag-only matches", () => {
    const exact = iconResults.find((icon) => icon.name === "cloud-upload")!;
    const unrelated = iconResults.find((icon) => icon.name === "check-circle")!;
    expect(scoreIcon("cloud-upload", exact)).toBeGreaterThan(scoreIcon("cloud-upload", unrelated));
  });

  it("finds semantic tags and applies deterministic filters", () => {
    const matches = searchIcons(iconResults, "payment successful", { category: "Payments", variant: "regular" });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((icon) => icon.category === "Payments" && icon.variant === "regular")).toBe(true);
  });

  it("returns no results for an unknown intent", () => {
    expect(searchIcons(iconResults, "xylophone-orbit")).toEqual([]);
  });

  it("browses all original pairs and finds everyday intents", () => {
    expect(searchIcons(iconResults, "")).toHaveLength(96);
    expect(searchIcons(iconResults, "", { variant: "regular" })).toHaveLength(48);
    for (const [query, name] of [["change language", "globe"], ["save for later", "bookmark"], ["take photo", "camera"], ["go back", "arrow-left"], ["api credential", "key"]]) {
      expect(searchIcons(iconResults, query)[0]?.name, query).toBe(name);
    }
    const media = searchIcons(iconResults, "", { category: "Media", variant: "solid" });
    expect(media.map((asset) => asset.name)).toEqual(["camera", "image"]);
  });

  it("tolerates a single-character typo without outranking exact aliases", () => {
    const typoMatches = searchIcons(iconResults, "reciept");
    expect(typoMatches[0]?.name).toBe("receipt-search");
    const exactMatches = searchIcons(iconResults, "payment successful");
    expect(exactMatches[0]?.name).toBe("card-check");
  });
});
