import { describe, expect, test, vi } from "vitest";

import type { Database } from "@/lib/db";
import { DrizzleConditionRepository } from "./repo";

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

describe("DrizzleConditionRepository", () => {
  test("lists by flag", async () => {
    const { db, query } = createDatabase();
    await new DrizzleConditionRepository(db).listByFlag({ flagId: "flag-1" });
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalled();
    expect(query.all).toHaveBeenCalled();
  });

  test("finds by id", async () => {
    const { db, query } = createDatabase();
    await new DrizzleConditionRepository(db).findById({ conditionId: "condition-1" });
    expect(query.where).toHaveBeenCalled();
    expect(query.get).toHaveBeenCalled();
  });

  test("creates and updates records", async () => {
    const { db, query } = createDatabase();
    const record = { id: "condition-1", flagId: "flag-1", position: 1 } as never;
    await new DrizzleConditionRepository(db).create({ record });
    await new DrizzleConditionRepository(db).update({
      conditionId: "condition-1",
      values: { position: 2 },
    });
    expect(query.values).toHaveBeenCalledWith(record);
    expect(query.set).toHaveBeenCalledWith({ position: 2 });
    expect(query.returning).toHaveBeenCalledTimes(2);
  });
});
