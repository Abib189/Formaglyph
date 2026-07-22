import { describe, expect, it } from "vitest";
import { iconResults } from "../data/catalog";
import { scoreIcon, searchIcons } from "./search";

describe("catalog search", () => {
  it("ranks an exact canonical name above tag-only matches", () => {
    const exact = iconResults.find((icon) => icon.id === "cloud-upload")!;
    const unrelated = iconResults.find((icon) => icon.id === "circle-check")!;
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
});
