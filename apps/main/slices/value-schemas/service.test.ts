import { describe, expect, test, vi } from "vitest";

import type { ProjectRecord, ValueSchemaRecord } from "@/lib/db/schema";
import type { ProjectRepository } from "@/slices/projects/repo";
import type { ValueSchemaRepository } from "./repo";
import { ValueSchemaService } from "./service";

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

function projects(): ProjectRepository {
  return { findById: vi.fn(async () => project) } as unknown as ProjectRepository;
}

function repository(): ValueSchemaRepository {
  const records = [schema];
  return {
    listByProject: vi.fn(async ({ projectId }) =>
      records.filter((item) => item.projectId === projectId),
    ),
    findById: vi.fn(async ({ schemaId }) => records.find((item) => item.id === schemaId)),
    create: vi.fn(
      async ({ record }) => (
        records.push(record as ValueSchemaRecord),
        record as ValueSchemaRecord
      ),
    ),
    update: vi.fn(async ({ schemaId, values }) => ({
      ...records.find((item) => item.id === schemaId)!,
      ...values,
    })),
  } as unknown as ValueSchemaRepository;
}

describe("ValueSchemaService", () => {
  test("lists schemas for an owned project", async () => {
    const repo = repository();
    await expect(
      new ValueSchemaService(repo, projects()).list({ projectId: project.id, ownerId: "owner-1" }),
    ).resolves.toEqual([schema]);
    expect(repo.listByProject).toHaveBeenCalledWith({ projectId: project.id });
  });

  test("gets a schema and rejects a missing schema", async () => {
    const repo = repository();
    await expect(
      new ValueSchemaService(repo, projects()).get({ schemaId: schema.id, ownerId: "owner-1" }),
    ).resolves.toEqual(schema);
    const missing = { ...repo, findById: vi.fn(async () => undefined) } as ValueSchemaRepository;
    await expect(
      new ValueSchemaService(missing, projects()).get({ schemaId: "missing", ownerId: "owner-1" }),
    ).rejects.toThrow("Value schema not found.");
  });

  test("creates a schema with serialized JSON", async () => {
    const repo = repository();
    await new ValueSchemaService(repo, projects()).create({
      projectId: project.id,
      ownerId: "owner-1",
      name: "Number",
      schemaJson: { type: "number" },
    });
    expect(repo.create).toHaveBeenCalledWith({
      record: expect.objectContaining({
        name: "Number",
        schemaJson: JSON.stringify({ type: "number" }),
      }),
    });
  });

  test("updates a schema", async () => {
    const repo = repository();
    await new ValueSchemaService(repo, projects()).update({
      schemaId: schema.id,
      ownerId: "owner-1",
      values: { name: "Updated" },
    });
    expect(repo.update).toHaveBeenCalledWith({ schemaId: schema.id, values: { name: "Updated" } });
  });
});
