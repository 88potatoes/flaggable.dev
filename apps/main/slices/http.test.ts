import { describe, expect, test } from "vitest";

import { ApiClientError, getApiErrorMessage } from "./http";

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

  test("uses a fallback for unknown errors", () => {
    expect(getApiErrorMessage({}, "Try again.")).toBe("Try again.");
  });
});
