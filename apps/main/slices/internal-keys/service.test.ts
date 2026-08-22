import { describe, expect, test, vi } from "vitest";

import { mockProjectRepo } from "../../test/mocks";
import type { InternalKeyRepository } from "./repo";
import { InternalKeyService } from "./service";

function repository(): InternalKeyRepository {
  return {
    listByProject: vi.fn(async () => []),
    findActiveByPlaintext: vi.fn(async () => undefined),
    create: vi.fn(async ({ record }) => record as never),
    revoke: vi.fn(async () => undefined),
  };
}

describe("InternalKeyService", () => {
  test("generates a plaintext internal key with ik_ prefix", async () => {
    const repo = repository();
    const result = await new InternalKeyService(repo, mockProjectRepo()).create({
      projectId: "project-1",
      ownerId: "owner-1",
      name: "CLI Token",
    });
    expect(result.internalKey).toMatch(/^ik_/);
    expect(result.name).toBe("CLI Token");
    expect(repo.create).toHaveBeenCalledWith({
      record: expect.objectContaining({
        projectId: "project-1",
        name: "CLI Token",
        keyPlaintext: result.internalKey,
      }),
    });
  });

  test("does not resolve malformed internal keys", async () => {
    const repo = repository();
    await expect(
      new InternalKeyService(repo, mockProjectRepo()).resolve({ internalKey: "not_valid" }),
    ).resolves.toBeUndefined();
    expect(repo.findActiveByPlaintext).not.toHaveBeenCalled();
  });
});
