import { describe, expect, test } from "vitest";

import { mockCondition, mockConditionRepo, mockConditionService, mockFlag } from "../../test/mocks";

describe("ConditionService", () => {
  test("lists and gets conditions", async () => {
    const repo = mockConditionRepo();
    const service = mockConditionService({ repository: repo });
    await expect(service.list({ flagId: mockFlag.id, ownerId: "owner-1" })).resolves.toEqual([
      mockCondition,
    ]);
    await expect(
      service.get({ conditionId: mockCondition.id, ownerId: "owner-1" }),
    ).resolves.toEqual(mockCondition);
  });

  test("creates a valid condition", async () => {
    const repo = mockConditionRepo();
    await mockConditionService({ repository: repo }).create({
      flagId: mockFlag.id,
      ownerId: "owner-1",
      values: {
        position: 2,
        property: "country",
        operator: "equals",
        predicateValue: "CA",
        resultValue: "on",
      },
    });
    expect(repo.create).toHaveBeenCalledWith({
      record: expect.objectContaining({
        position: 2,
        id: expect.stringMatching(/-7[0-9a-f]{3}-/i),
      }),
    });
  });

  test("updates a condition", async () => {
    const repo = mockConditionRepo();
    await mockConditionService({ repository: repo }).update({
      conditionId: mockCondition.id,
      ownerId: "owner-1",
      values: { property: "region" },
    });
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        conditionId: mockCondition.id,
        values: expect.objectContaining({ property: "region" }),
      }),
    );
  });
});
