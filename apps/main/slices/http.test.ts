import { describe, expect, test, vi } from "vitest";

import { FlagError } from "@/slices/flags/errors";
import { handleApiError } from "@/lib/api";
import { ApiClientError, api } from "./http";

describe("ApiClientError", () => {
  test("retains stable API error metadata", () => {
    const error = new ApiClientError(
      "A flag already exists.",
      409,
      "flag_name_conflict",
      { field: "name" },
      "req-1",
    );

    expect(error).toMatchObject({
      message: "A flag already exists.",
      status: 409,
      code: "flag_name_conflict",
      details: { field: "name" },
      requestId: "req-1",
    });
  });

  test("parses the API envelope from ky HTTP errors", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        handleApiError(
          new FlagError("flag_name_conflict", "A flag already exists.", { field: "name" }),
        ),
      );

    const testApi = api.extend({ prefix: "http://localhost/api/v1" });
    await expect(testApi.post("projects/project-1/flags")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 409,
      code: "flag_name_conflict",
      message: "A flag already exists.",
    });
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  test("does not throw for unknown errors when formatting", () => {
    expect(new ApiClientError("", 500).message).toBe("");
  });
});
