import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { runCli } from "./cli";
import * as fs from "node:fs";

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => false),
  };
});

describe("Flaggable CLI", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("fails when FLAGGABLE_INTERNAL_API_KEY is missing", async () => {
    delete process.env.FLAGGABLE_INTERNAL_API_KEY;
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(runCli(["typegen"])).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("FLAGGABLE_INTERNAL_API_KEY is missing"),
    );
  });

  it("fetches schemas and writes generated types", async () => {
    process.env.FLAGGABLE_INTERNAL_API_KEY = "ik_test_12345678901234567890";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        projectId: "proj_abc",
        projectName: "Test Project",
        flags: [
          {
            id: "flag-1",
            name: "beta-flow",
            enabled: true,
            schema: { type: "boolean" },
          },
        ],
      }),
    );
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCli(["typegen", "--out", "./test-flags.d.ts"]);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://flaggable.dev/api/v1/devtool/typegen",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-flaggable-internal-api-key": "ik_test_12345678901234567890",
        }),
      }),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("test-flags.d.ts"),
      expect.stringContaining('"beta-flow": boolean;'),
      "utf8",
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Successfully generated types for 1 flag(s)"),
    );
  });
});
