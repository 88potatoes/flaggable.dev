import { and, asc, eq } from "drizzle-orm";

import { getDb } from "./db";
import {
  conditionTable,
  flagTable,
  projectTable,
  valueSchemaTable,
} from "./db/schema";

export type Db = ReturnType<typeof getDb>;

export function createProjectRepository(db: Db) {
  return {
    listByOwner: (ownerUserId: string) =>
      db
        .select()
        .from(projectTable)
        .where(eq(projectTable.ownerUserId, ownerUserId))
        .orderBy(asc(projectTable.createdAt))
        .all(),
    findById: (id: string) =>
      db.select().from(projectTable).where(eq(projectTable.id, id)).get(),
    create: (record: typeof projectTable.$inferInsert) =>
      db.insert(projectTable).values(record).returning().get(),
    update: (id: string, values: Partial<typeof projectTable.$inferInsert>) =>
      db
        .update(projectTable)
        .set(values)
        .where(eq(projectTable.id, id))
        .returning()
        .get(),
  };
}

export function createValueSchemaRepository(db: Db) {
  return {
    listByProject: (projectId: string) =>
      db
        .select()
        .from(valueSchemaTable)
        .where(eq(valueSchemaTable.projectId, projectId))
        .orderBy(asc(valueSchemaTable.createdAt))
        .all(),
    findById: (id: string) =>
      db.select().from(valueSchemaTable).where(eq(valueSchemaTable.id, id)).get(),
    create: (record: typeof valueSchemaTable.$inferInsert) =>
      db.insert(valueSchemaTable).values(record).returning().get(),
    update: (
      id: string,
      values: Partial<typeof valueSchemaTable.$inferInsert>,
    ) =>
      db
        .update(valueSchemaTable)
        .set(values)
        .where(eq(valueSchemaTable.id, id))
        .returning()
        .get(),
  };
}

export function createFlagRepository(db: Db) {
  return {
    listByProject: (projectId: string) =>
      db
        .select()
        .from(flagTable)
        .where(eq(flagTable.projectId, projectId))
        .orderBy(asc(flagTable.createdAt))
        .all(),
    findById: (id: string) =>
      db.select().from(flagTable).where(eq(flagTable.id, id)).get(),
    create: (record: typeof flagTable.$inferInsert) =>
      db.insert(flagTable).values(record).returning().get(),
    update: (id: string, values: Partial<typeof flagTable.$inferInsert>) =>
      db
        .update(flagTable)
        .set(values)
        .where(eq(flagTable.id, id))
        .returning()
        .get(),
  };
}

export function createConditionRepository(db: Db) {
  return {
    listByFlag: (flagId: string) =>
      db
        .select()
        .from(conditionTable)
        .where(eq(conditionTable.flagId, flagId))
        .orderBy(asc(conditionTable.position))
        .all(),
    findById: (id: string) =>
      db.select().from(conditionTable).where(eq(conditionTable.id, id)).get(),
    create: (record: typeof conditionTable.$inferInsert) =>
      db.insert(conditionTable).values(record).returning().get(),
    update: (
      id: string,
      values: Partial<typeof conditionTable.$inferInsert>,
    ) =>
      db
        .update(conditionTable)
        .set(values)
        .where(eq(conditionTable.id, id))
        .returning()
        .get(),
  };
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /unique constraint/i.test(error.message);
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return error instanceof Error && /foreign key constraint/i.test(error.message);
}

export function isOwnedProjectCondition(projectId: string, ownerUserId: string) {
  return and(
    eq(projectTable.id, projectId),
    eq(projectTable.ownerUserId, ownerUserId),
  );
}
