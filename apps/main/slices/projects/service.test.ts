import { describe, expect, test, vi } from "vitest";

import { mockProject, mockProjectRepo, mockProjectService, mockSchemaRepo } from "../../test/mocks";

describe("ProjectService", () => {
  test("lists projects for an owner", async () => {
    const repo = mockProjectRepo();
    await expect(mockProjectService(repo).list({ ownerId: "owner-1" })).resolves.toEqual([
      mockProject,
    ]);
    expect(repo.listByOwner).toHaveBeenCalledWith({ ownerId: "owner-1" });
  });

  test("gets an owned active project", async () => {
    const repo = mockProjectRepo();
    await expect(
      mockProjectService(repo).get({ projectId: "project-1", ownerId: "owner-1" }),
    ).resolves.toEqual(mockProject);
    expect(repo.findById).toHaveBeenCalledWith({ projectId: "project-1" });
  });

  test("rejects missing or foreign projects", async () => {
    const missing = mockProjectRepo({ findById: vi.fn(async () => undefined) });
    await expect(
      mockProjectService(missing).get({ projectId: "missing", ownerId: "owner-1" }),
    ).rejects.toMatchObject({ status: 404 });

    const foreign = mockProjectRepo({
      findById: vi.fn(async () => ({ ...mockProject, ownerUserId: "other" })),
    });
    await expect(
      mockProjectService(foreign).get({ projectId: "project-1", ownerId: "owner-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("rejects archived projects", async () => {
    const repo = mockProjectRepo({
      findById: vi.fn(async () => ({ ...mockProject, archivedAt: new Date() })),
    });
    await expect(
      mockProjectService(repo).get({ projectId: "project-1", ownerId: "owner-1" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  test("creates a UUIDv7 project and default Boolean schema", async () => {
    const repo = mockProjectRepo();
    const schemas = mockSchemaRepo({
      create: vi.fn(async ({ record }) => record as never),
    });
    await mockProjectService(repo, schemas).create({ ownerId: "owner-1", name: "New project" });
    const [[{ record }]] = (repo.create as ReturnType<typeof vi.fn>).mock.calls;
    expect(record).toMatchObject({ ownerUserId: "owner-1", name: "New project" });
    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(schemas.create).toHaveBeenCalledWith({
      record: expect.objectContaining({
        projectId: record.id,
        name: "Boolean",
        schemaJson: JSON.stringify({ type: "boolean", enum: [true, false] }),
      }),
    });
  });

  test("updates an owned project", async () => {
    const repo = mockProjectRepo();
    await mockProjectService(repo).update({
      projectId: "project-1",
      ownerId: "owner-1",
      name: "Renamed",
    });
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        values: expect.objectContaining({ name: "Renamed" }),
      }),
    );
  });

  test("archives an owned project", async () => {
    const repo = mockProjectRepo();
    await mockProjectService(repo).archive({ projectId: "project-1", ownerId: "owner-1" });
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        values: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });
});
