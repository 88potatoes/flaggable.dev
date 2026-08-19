import { describe, expect, test, vi } from "vitest";

import { mockProjectRepo } from "../../test/mocks";
import type { PublicKeyRepository } from "./repo";
import { PublicKeyService } from "./service";

function repository(): PublicKeyRepository {
  return {
    listByProject: vi.fn(async () => []),
    findActiveByHash: vi.fn(async () => undefined),
    create: vi.fn(async ({ record }) => record as never),
    revoke: vi.fn(async () => undefined),
  };
}

describe("PublicKeyService", () => {
  test("generates a plaintext key but stores only its hash", async () => {
    const repo = repository();
    const result = await new PublicKeyService(repo, mockProjectRepo()).create({
      projectId: "project-1",
      ownerId: "owner-1",
    });
    expect(result.publicKey).toMatch(/^pk_/);
    expect(repo.create).toHaveBeenCalledWith({
      record: expect.objectContaining({
        projectId: "project-1",
        keyHash: expect.not.stringContaining(result.publicKey),
      }),
    });
  });

  test("does not resolve revoked or unknown keys", async () => {
    const repo = repository();
    await expect(
      new PublicKeyService(repo, mockProjectRepo()).resolve({ publicKey: "bad" }),
    ).resolves.toBeUndefined();
    expect(repo.findActiveByHash).not.toHaveBeenCalled();
  });
});
