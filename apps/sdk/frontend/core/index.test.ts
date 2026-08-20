import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Flaggable, SdkApiError } from "./index";

describe("Flaggable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("evaluates and returns typed flag values", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        projectId: "project-1",
        evaluations: [
          { flagId: "flag-1", name: "checkout", value: true, matchedConditionId: null },
        ],
      }),
    );
    const client = new Flaggable({ publicKey: "pk_test", baseUrl: "https://flags.example" });

    await expect(
      client.get({
        flagName: "checkout",
        fallbackValue: false,
        context: { accountId: "acct-1" },
      }),
    ).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://flags.example/api/v1/evaluate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("notifies subscribers when refreshed data changes and maps API errors", async () => {
    let value = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
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
    const client = new Flaggable({ publicKey: "pk_test", baseUrl: "https://flags.example" });
    const listener = vi.fn();
    const unsubscribe = client.on({ event: "change", listener });
    await client.refresh();
    value = true;
    await client.refresh();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({ projectId: "p" }),
      }),
    );
    unsubscribe();

    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({ error: "Invalid key" }, { status: 401 }),
    );
    const failing = new Flaggable({
      publicKey: "pk_test",
      baseUrl: "https://flags.example",
    });
    await expect(failing.refresh()).rejects.toBeInstanceOf(SdkApiError);
  });

  it("updates targeting attributes via setEvaluationContext", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        projectId: "p",
        evaluations: [{ flagId: "f", name: "beta", value: true, matchedConditionId: "c1" }],
      }),
    );

    const client = new Flaggable({ publicKey: "pk_test" });
    client.setEvaluationContext({
      context: { userId: "user-123", role: "admin" },
    });

    expect(client.getEvaluationContext()).toMatchObject({
      userId: "user-123",
      role: "admin",
    });

    await client.refresh();
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://flaggable.dev/api/v1/evaluate",
      expect.objectContaining({
        body: expect.stringContaining('"userId":"user-123"'),
      }),
    );
  });

  it("dispatches events for context changes and errors", async () => {
    const client = new Flaggable({ publicKey: "pk_test" });
    const contextListener = vi.fn();
    const errorListener = vi.fn();

    const unsubContext = client.on({ event: "contextChange", listener: contextListener });
    const unsubError = client.on({ event: "error", listener: errorListener });

    client.setEvaluationContext({ context: { role: "admin" } });
    expect(contextListener).toHaveBeenCalledWith({
      context: expect.objectContaining({ role: "admin" }),
    });

    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("Network offline");
    });

    await expect(client.refresh()).rejects.toThrow();
    expect(errorListener).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );

    unsubContext();
    unsubError();
  });
});
