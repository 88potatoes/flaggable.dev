import { describe, expect, test, vi } from "vitest";

import type {
  ConditionRecord,
  FlagRecord,
  ProjectRecord,
  ValueSchemaRecord,
} from "@/lib/db/schema";
import type { ProjectRepository } from "@/slices/projects/repo";
import type { FlagRepository } from "@/slices/flags/repo";
import type { ValueSchemaRepository } from "@/slices/value-schemas/repo";
import type { ConditionRepository } from "./repo";
import { ConditionService } from "./service";

const project: ProjectRecord = {
  id: "project-1",
  ownerUserId: "owner-1",
  name: "Platform",
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const schema: ValueSchemaRecord = {
  id: "schema-1",
  projectId: project.id,
  name: "Text",
  schemaJson: JSON.stringify({ type: "string" }),
  createdAt: new Date(),
};
const flag: FlagRecord = {
  id: "flag-1",
  projectId: project.id,
  valueSchemaId: schema.id,
  key: "flag",
  name: "Flag",
  description: null,
  enabled: true,
  fallbackValue: JSON.stringify("off"),
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const condition: ConditionRecord = {
  id: "condition-1",
  flagId: flag.id,
  position: 1,
  enabled: true,
  property: "country",
  operator: "equals",
  predicateValue: JSON.stringify("US"),
  resultValue: JSON.stringify("on"),
  createdAt: new Date(),
  updatedAt: new Date(),
};
const projects = (): ProjectRepository =>
  ({ findById: vi.fn(async () => project) }) as unknown as ProjectRepository;
const flags = (): FlagRepository =>
  ({ findById: vi.fn(async () => flag) }) as unknown as FlagRepository;
const schemas = (): ValueSchemaRepository =>
  ({ findById: vi.fn(async () => schema) }) as unknown as ValueSchemaRepository;
function repository(): ConditionRepository {
  const records = [condition];
  return {
    listByFlag: vi.fn(async ({ flagId }) => records.filter((item) => item.flagId === flagId)),
    findById: vi.fn(async ({ conditionId }) => records.find((item) => item.id === conditionId)),
    create: vi.fn(
      async ({ record }) => (records.push(record as ConditionRecord), record as ConditionRecord),
    ),
    update: vi.fn(async ({ conditionId, values }) => ({
      ...records.find((item) => item.id === conditionId)!,
      ...values,
    })),
  } as unknown as ConditionRepository;
}

describe("ConditionService", () => {
  test("lists and gets conditions", async () => {
    const repo = repository();
    const service = new ConditionService(repo, flags(), schemas(), projects());
    await expect(service.list({ flagId: flag.id, ownerId: "owner-1" })).resolves.toEqual([
      condition,
    ]);
    await expect(service.get({ conditionId: condition.id, ownerId: "owner-1" })).resolves.toEqual(
      condition,
    );
  });
  test("creates a valid condition", async () => {
    const repo = repository();
    await new ConditionService(repo, flags(), schemas(), projects()).create({
      flagId: flag.id,
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
    const repo = repository();
    await new ConditionService(repo, flags(), schemas(), projects()).update({
      conditionId: condition.id,
      ownerId: "owner-1",
      values: { property: "region" },
    });
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        conditionId: condition.id,
        values: expect.objectContaining({ property: "region" }),
      }),
    );
  });
});
