import { describe, expect, it } from "vitest";
import { LocalRepository } from "./local";

describe("local repository contract", () => {
  const repository = new LocalRepository();

  it("returns the development catalog without network access", async () => {
    const icons = await repository.listPublishedIcons();
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every((icon) => icon.provenance.kind === "third-party")).toBe(true);
  });

  it("loads the default project and its durable workspace records", async () => {
    const workspace = await repository.loadWorkspace("core");
    expect(workspace?.project.role).toBe("admin");
    expect(workspace?.icons.length).toBeGreaterThan(0);
    await expect(repository.loadWorkspace("missing")).resolves.toBeNull();
  });

  it("implements the same draft and onboarding surface as Supabase mode", async () => {
    await expect(repository.saveDraft("core", { workspaceIconId: "draft-1" } as never, { id: "candidate-1", name: "Candidate", description: "", svg: "<svg />", issue: null })).resolves.toEqual({ draftId: "draft-1", candidateId: "candidate-1" });
    await expect(repository.bootstrapWorkspace()).resolves.toMatchObject({ slug: "core", role: "admin" });
  });
});
