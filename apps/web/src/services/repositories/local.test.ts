import { describe, expect, it } from "vitest";
import { LocalRepository } from "./local";

describe("local repository contract", () => {
  const repository = new LocalRepository();

  it("returns the development catalog without network access", async () => {
    const icons = await repository.listPublishedIcons();
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every((icon) => icon.provenance.kind === "original" && Boolean(icon.svg))).toBe(true);
  });

  it("loads the default project and its durable workspace records", async () => {
    const workspace = await repository.loadWorkspace("core");
    expect(workspace?.project.role).toBe("admin");
    expect(workspace?.icons.length).toBeGreaterThan(0);
    expect(workspace?.candidates?.length).toBeGreaterThan(0);
    await expect(repository.loadWorkspace("missing")).resolves.toBeNull();
  });

  it("implements the same draft and onboarding surface as Supabase mode", async () => {
    await expect(repository.saveDraft("core", { workspaceIconId: "draft-1" } as never, { id: "candidate-1", name: "Candidate", description: "", svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0"/></svg>', issue: null })).resolves.toMatchObject({ draftId: "draft-1", candidateId: "candidate-1", validation: { status: "passed", safe: true } });
    await expect(repository.bootstrapWorkspace()).resolves.toMatchObject({ slug: "core", role: "admin" });
  });

  it("persists the local generation lifecycle through the repository contract", async () => {
    const job = await repository.startGenerationJob("core", { adapter: "local_geometry", prompt: "private brief", promptHash: "a".repeat(64), retainPrompt: false, candidateCount: 3 });
    expect(job).toMatchObject({ status: "running", promptRetained: false, candidateCount: 3 });
    await expect(repository.completeGenerationJob(job.id, { candidateCount: 3, passedCount: 3 })).resolves.toMatchObject({ status: "completed", progress: 100, promptHash: "a".repeat(64) });
  });

  it("implements the review and governance contract without network access", async () => {
    const workspace = await repository.loadWorkspace("core");
    expect(workspace?.auditEvents.length).toBeGreaterThan(0);
    expect(workspace?.releaseEntries.length).toBeGreaterThan(0);

    const comment = await repository.commentProposal("local-proposal", "Geometry", "Align the shoulder to the keyline.");
    await expect(repository.resolveReview(comment.id, true)).resolves.toMatchObject({ id: comment.id, resolved: true });
    await expect(repository.deprecateIcon("local-icon", "Replaced by the reviewed sibling.")).resolves.toBeUndefined();
  });
});
