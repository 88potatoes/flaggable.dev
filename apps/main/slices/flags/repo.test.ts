import { describe, expect, test, vi } from "vitest";

import type { Database } from "@/lib/db";
import { DrizzleFlagRepository } from "./repo";

function createDatabase() {
  const query = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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

describe("DrizzleFlagRepository", () => {
  test("lists by project", async () => {
    const { db, query } = createDatabase();
    await new DrizzleFlagRepository(db).listByProject({ projectId: "project-1", limit: 25 });
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalled();
    expect(query.all).toHaveBeenCalled();
  });

  test("finds by id", async () => {
    const { db, query } = createDatabase();
    await new DrizzleFlagRepository(db).findById({ flagId: "flag-1" });
    expect(query.where).toHaveBeenCalled();
    expect(query.get).toHaveBeenCalled();
  });

  test("creates and updates records", async () => {
    const { db, query } = createDatabase();
    const record = { id: "flag-1", projectId: "project-1", name: "Flag" } as never;
    await new DrizzleFlagRepository(db).create({ record });
    await new DrizzleFlagRepository(db).update({ flagId: "flag-1", values: { name: "Updated" } });
    expect(query.values).toHaveBeenCalledWith(record);
    expect(query.set).toHaveBeenCalledWith({ name: "Updated" });
    expect(query.returning).toHaveBeenCalledTimes(2);
  });
});
