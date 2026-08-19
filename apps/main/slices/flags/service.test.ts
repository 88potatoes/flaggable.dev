import { describe, expect, test, vi } from "vitest";

import type { FlagRecord, ProjectRecord, ValueSchemaRecord } from "@/lib/db/schema";
import type { ProjectRepository } from "@/slices/projects/repo";
import type { FlagRepository } from "./repo";
import { FlagService } from "./service";
import type { ValueSchemaRepository } from "@/slices/value-schemas/repo";

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

const projects = (): ProjectRepository =>
  ({ findById: vi.fn(async () => project) }) as unknown as ProjectRepository;
const schemas = (): ValueSchemaRepository =>
  ({ findById: vi.fn(async () => schema) }) as unknown as ValueSchemaRepository;
function repository(): FlagRepository {
  const records = [flag];
  return {
    listByProject: vi.fn(async ({ projectId }) =>
      records.filter((item) => item.projectId === projectId),
    ),
    findById: vi.fn(async ({ flagId }) => records.find((item) => item.id === flagId)),
    create: vi.fn(async ({ record }) => (records.push(record as FlagRecord), record as FlagRecord)),
    update: vi.fn(async ({ flagId, values }) => ({
      ...records.find((item) => item.id === flagId)!,
      ...values,
    })),
  } as unknown as FlagRepository;
}

describe("FlagService", () => {
  test("lists and gets flags", async () => {
    const repo = repository();
    const service = new FlagService(repo, projects(), schemas());
    await expect(service.list({ projectId: project.id, ownerId: "owner-1" })).resolves.toEqual([
      flag,
    ]);
    await expect(service.get({ flagId: flag.id, ownerId: "owner-1" })).resolves.toEqual(flag);
  });
  test("creates a valid flag", async () => {
    const repo = repository();
    await new FlagService(repo, projects(), schemas()).create({
      projectId: project.id,
      ownerId: "owner-1",
      values: { valueSchemaId: schema.id, key: "new", name: "New", fallbackValue: "off" },
    });
    expect(repo.create).toHaveBeenCalledWith({
      record: expect.objectContaining({ key: "new", fallbackValue: JSON.stringify("off") }),
    });
  });
  test("updates and archives a flag", async () => {
    const repo = repository();
    const service = new FlagService(repo, projects(), schemas());
    await service.update({ flagId: flag.id, ownerId: "owner-1", values: { name: "Updated" } });
    await service.archive({ flagId: flag.id, ownerId: "owner-1" });
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ flagId: flag.id }));
  });
});
