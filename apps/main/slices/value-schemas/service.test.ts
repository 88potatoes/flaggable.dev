import { describe, expect, test, vi } from "vitest";

import { mockProject, mockSchema, mockSchemaRepo, mockSchemaService } from "../../test/mocks";

describe("ValueSchemaService", () => {
  test("lists schemas for an owned project", async () => {
    const repo = mockSchemaRepo();
    await expect(
      mockSchemaService({ repository: repo }).list({
        projectId: mockProject.id,
        ownerId: "owner-1",
      }),
    ).resolves.toEqual([mockSchema]);
    expect(repo.listByProject).toHaveBeenCalledWith({ projectId: mockProject.id });
  });

  test("gets a schema and rejects a missing schema", async () => {
    const repo = mockSchemaRepo();
    await expect(
      mockSchemaService({ repository: repo }).get({ schemaId: mockSchema.id, ownerId: "owner-1" }),
    ).resolves.toEqual(mockSchema);
    const missing = mockSchemaRepo({ findById: vi.fn(async () => undefined) });
    await expect(
      mockSchemaService({ repository: missing }).get({ schemaId: "missing", ownerId: "owner-1" }),
    ).rejects.toThrow("Value schema not found.");
  });

  test("creates a schema with serialized JSON", async () => {
    const repo = mockSchemaRepo();
    await mockSchemaService({ repository: repo }).create({
      projectId: mockProject.id,
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
    const repo = mockSchemaRepo();
    await mockSchemaService({ repository: repo }).update({
      schemaId: mockSchema.id,
      ownerId: "owner-1",
      values: { name: "Updated" },
    });
    expect(repo.update).toHaveBeenCalledWith({
      schemaId: mockSchema.id,
      values: { name: "Updated" },
    });
  });
});
