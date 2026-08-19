import { describe, expect, test, vi } from "vitest";

import type { Database } from "@/lib/db";
import { DrizzleProjectRepository } from "./repo";

function createDatabase() {
  const query = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    all: vi.fn(async () => []),
    get: vi.fn(async () => undefined),
  };
  return { db: query as unknown as Database, query };
}

describe("DrizzleProjectRepository", () => {
  test("lists by owner", async () => {
    const { db, query } = createDatabase();
    await new DrizzleProjectRepository(db).listByOwner({ ownerId: "owner-1" });
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalled();
    expect(query.all).toHaveBeenCalled();
  });

  test("finds by id", async () => {
    const { db, query } = createDatabase();
    await new DrizzleProjectRepository(db).findById({ projectId: "project-1" });
    expect(query.where).toHaveBeenCalled();
    expect(query.get).toHaveBeenCalled();
  });

  test("creates and updates records", async () => {
    const { db, query } = createDatabase();
    const record = { id: "project-1", ownerUserId: "owner-1", name: "Project" } as never;
    await new DrizzleProjectRepository(db).create({ record });
    await new DrizzleProjectRepository(db).update({
      projectId: "project-1",
      values: { name: "Updated" },
    });
    expect(query.values).toHaveBeenCalledWith(record);
    expect(query.set).toHaveBeenCalledWith({ name: "Updated" });
    expect(query.returning).toHaveBeenCalledTimes(2);
  });
});
