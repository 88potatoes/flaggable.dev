import { describe, expect, it, vi } from "vitest";
import { Flaggable, SdkApiError } from "./index";

describe("Flaggable", () => {
  it("evaluates and returns typed flag values", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        projectId: "project-1",
        evaluations: [
          { flagId: "flag-1", name: "checkout", value: true, matchedConditionId: null },
        ],
      }),
    );
    const client = new Flaggable({ publicKey: "pk_test", baseUrl: "https://flags.example", fetch });

    await expect(client.get("checkout", false, { accountId: "acct-1" })).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://flags.example/api/v1/evaluate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("notifies subscribers when refreshed data changes and maps API errors", async () => {
    let value = false;
    const fetch = vi.fn(async () =>
      value
        ? Response.json({
            projectId: "p",
            evaluations: [{ flagId: "f", name: "enabled", value: true, matchedConditionId: null }],
          })
        : Response.json({
            projectId: "p",
            evaluations: [{ flagId: "f", name: "enabled", value: false, matchedConditionId: null }],
          }),
    );
    const client = new Flaggable({ publicKey: "pk_test", baseUrl: "https://flags.example", fetch });
    const listener = vi.fn();
    const unsubscribe = client.subscribe(listener);
    await client.refresh();
    value = true;
    await client.refresh();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();

    const failing = new Flaggable({
      publicKey: "pk_test",
      baseUrl: "https://flags.example",
      fetch: async () => Response.json({ error: "Invalid key" }, { status: 401 }),
    });
    await expect(failing.refresh()).rejects.toBeInstanceOf(SdkApiError);
  });
});
