import { describe, expect, it } from "vitest";
import { errorMessage } from "./errorMessage";

describe("repository error messages", () => {
  it("shows a message returned by Supabase instead of a generic fallback", () => {
    expect(errorMessage({ code: "23514", message: "drafts_name_check failed" }, "Could not submit proposal.")).toBe("drafts_name_check failed");
    expect(errorMessage(new Error("Sign in again."), "Could not submit proposal.")).toBe("Sign in again.");
    expect(errorMessage(null, "Could not submit proposal.")).toBe("Could not submit proposal.");
  });
});
