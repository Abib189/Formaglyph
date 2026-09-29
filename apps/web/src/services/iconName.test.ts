import { describe, expect, it } from "vitest";
import { iconNameError, isValidIconName } from "./iconName";

describe("icon name validation", () => {
  it("matches the database's kebab-case constraint", () => {
    expect(isValidIconName("cloud-upload-revision")).toBe(true);
    expect(isValidIconName("cloud-upload revision")).toBe(false);
    expect(isValidIconName("Cloud-Upload")).toBe(false);
    expect(isValidIconName("cloud--upload")).toBe(false);
    expect(isValidIconName(" cloud-upload ")).toBe(false);
  });

  it("offers a valid example without silently renaming the icon", () => {
    expect(iconNameError("cloud-upload revision")).toContain("cloud-upload-revision");
    expect(iconNameError("cloud-upload-revision")).toBeNull();
  });
});
