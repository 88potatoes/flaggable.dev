import { describe, expect, test, vi } from "vitest";

import { mockFlag, mockFlagRepo, mockFlagService, mockProject, mockSchema } from "../../test/mocks";

describe("FlagService", () => {
  test("lists and gets flags", async () => {
    const repo = mockFlagRepo();
    const service = mockFlagService({ repository: repo });
    await expect(service.list({ projectId: mockProject.id, ownerId: "owner-1" })).resolves.toEqual({
      items: [mockFlag],
      nextCursor: null,
    });
    await expect(service.get({ flagId: mockFlag.id, ownerId: "owner-1" })).resolves.toEqual(
      mockFlag,
    );
  });

  test("creates a valid flag", async () => {
    const repo = mockFlagRepo();
    await mockFlagService({ repository: repo }).create({
      projectId: mockProject.id,
      ownerId: "owner-1",
      values: { valueSchemaId: mockSchema.id, name: "New" },
    });
    expect(repo.create).toHaveBeenCalledWith({
      record: expect.objectContaining({ name: "New" }),
    });
  });

  test("rejects duplicate active flag names in a project", async () => {
    const repo = mockFlagRepo({
      findByProjectAndName: vi.fn(async () => mockFlag),
    });

    await expect(
      mockFlagService({ repository: repo }).create({
        projectId: mockProject.id,
        ownerId: "owner-1",
        values: { valueSchemaId: mockSchema.id, name: mockFlag.name },
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: `A flag named "${mockFlag.name}" already exists in this project.`,
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  test("updates and archives a flag", async () => {
    const repo = mockFlagRepo();
    const service = mockFlagService({ repository: repo });
    await service.update({ flagId: mockFlag.id, ownerId: "owner-1", values: { name: "Updated" } });
    await service.archive({ flagId: mockFlag.id, ownerId: "owner-1" });
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ flagId: mockFlag.id }));
  });
});
