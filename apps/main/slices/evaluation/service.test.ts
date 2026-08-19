import { describe, expect, test, vi } from "vitest";

import { mockCondition, mockFlag, mockProject } from "../../test/mocks";
import type { PublicKeyRepository } from "../public-keys/repo";
import { PublicKeyService } from "../public-keys/service";
import type { ConditionRepository } from "../conditions/repo";
import type { FlagRepository } from "../flags/repo";
import type { ProjectRepository } from "../projects/repo";
import { EvaluationService } from "./service";

function keyService() {
  const keys: PublicKeyRepository = {
    listByProject: vi.fn(async () => []),
    findActiveByHash: vi.fn(async () => ({
      id: "key-1",
      projectId: mockProject.id,
      keyHash: "hash",
      createdAt: new Date(),
      revokedAt: null,
    })),
    create: vi.fn(),
    revoke: vi.fn(),
  };
  return new PublicKeyService(keys);
}

test("evaluates active flags and returns null when conditions do not match", async () => {
  const flags: FlagRepository = {
    listByProject: vi.fn(async () => ({ items: [mockFlag], hasMore: false })),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const conditions: ConditionRepository = {
    listByFlag: vi.fn(async () => [mockCondition]),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const projects: ProjectRepository = {
    findById: vi.fn(async () => mockProject),
    listByOwner: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const result = await new EvaluationService(flags, conditions, projects, keyService()).evaluate({
    publicKey: "pk_test_key_123456789012345",
    context: { country: "CA" },
  });
  expect(result.evaluations[0]).toMatchObject({
    flagId: mockFlag.id,
    value: null,
    matchedConditionId: null,
  });
});
