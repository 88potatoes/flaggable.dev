import { describe, expect, test, vi } from "vitest";

import { ApiError } from "@/lib/api";
import type { ProjectRecord } from "@/lib/db/schema";
import type { ProjectRepository } from "./repo";
import { ProjectService } from "./service";

const activeProject: ProjectRecord = {
  id: "project-1",
  ownerUserId: "owner-1",
  name: "Platform",
  archivedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function repository(overrides: Partial<ProjectRepository> = {}): ProjectRepository {
  return {
    listByOwner: vi.fn(async () => [activeProject]),
    findById: vi.fn(async () => activeProject),
    create: vi.fn(async ({ record }) => record as ProjectRecord),
    update: vi.fn(async ({ projectId, values }) => ({
      ...activeProject,
      id: projectId,
      ...values,
    })),
    ...overrides,
  };
}

describe("ProjectService", () => {
  test("lists projects for an owner", async () => {
    const repo = repository();
    await expect(new ProjectService(repo).list({ ownerId: "owner-1" })).resolves.toEqual([
      activeProject,
    ]);
    expect(repo.listByOwner).toHaveBeenCalledWith({ ownerId: "owner-1" });
  });

  test("gets an owned active project", async () => {
    const repo = repository();
    await expect(
      new ProjectService(repo).get({ projectId: "project-1", ownerId: "owner-1" }),
    ).resolves.toEqual(activeProject);
    expect(repo.findById).toHaveBeenCalledWith({ projectId: "project-1" });
  });

  test("rejects missing or foreign projects", async () => {
    const missing = repository({ findById: vi.fn(async () => undefined) });
    await expect(
      new ProjectService(missing).get({ projectId: "missing", ownerId: "owner-1" }),
    ).rejects.toMatchObject<ApiError>({ status: 404 });

    const foreign = repository({
      findById: vi.fn(async () => ({ ...activeProject, ownerUserId: "other" })),
    });
    await expect(
      new ProjectService(foreign).get({ projectId: "project-1", ownerId: "owner-1" }),
    ).rejects.toMatchObject<ApiError>({ status: 404 });
  });

  test("rejects archived projects", async () => {
    const repo = repository({
      findById: vi.fn(async () => ({ ...activeProject, archivedAt: new Date() })),
    });
    await expect(
      new ProjectService(repo).get({ projectId: "project-1", ownerId: "owner-1" }),
    ).rejects.toMatchObject<ApiError>({ status: 409 });
  });

  test("creates a UUIDv7 project", async () => {
    const repo = repository();
    await new ProjectService(repo).create({ ownerId: "owner-1", name: "New project" });
    const [[{ record }]] = (repo.create as ReturnType<typeof vi.fn>).mock.calls;
    expect(record).toMatchObject({ ownerUserId: "owner-1", name: "New project" });
    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test("updates an owned project", async () => {
    const repo = repository();
    await new ProjectService(repo).update({
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
    const repo = repository();
    await new ProjectService(repo).archive({ projectId: "project-1", ownerId: "owner-1" });
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        values: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });
});
