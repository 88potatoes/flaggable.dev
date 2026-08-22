import { describe, expect, test, vi } from "vitest";

import { FlagError } from "@/slices/flags/errors";
import { handleApiError } from "./api";

describe("handleApiError", () => {
  test("maps flag errors to the stable API envelope", async () => {
    const response = handleApiError(
      new FlagError("flag_name_conflict", "A flag already exists.", { field: "name" }),
    );
    const body = (await response.json()) as {
      error: { code: string; message: string; details: unknown; requestId: string };
    };

    expect(response.status).toBe(409);
    expect(response.headers.get("x-request-id")).toBe(body.error.requestId);
    expect(body).toEqual({
      error: {
        code: "flag_name_conflict",
        message: "A flag already exists.",
        details: { field: "name" },
        requestId: expect.any(String),
      },
    });
  });

  test("does not expose unexpected error details", async () => {
    const error = new Error("database connection string");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = handleApiError(error);
    const body = (await response.json()) as { error: { code: string; message: string } };

    expect(response.status).toBe(500);
    expect(body.error).toMatchObject({ code: "internal_error", message: "Internal server error." });
    expect(JSON.stringify(body)).not.toContain("database connection string");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
