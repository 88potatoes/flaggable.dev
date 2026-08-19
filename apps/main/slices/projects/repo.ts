import { asc, eq } from "drizzle-orm";

import { getDb, type Database } from "@/lib/db";
import { projectTable, type NewProjectRecord, type ProjectRecord } from "@/lib/db/schema";

/** Persistence boundary for projects. Services depend on this interface in tests. */
export interface ProjectRepository {
  listByOwner({ ownerId }: { ownerId: string }): Promise<ProjectRecord[]>;
  findById({ projectId }: { projectId: string }): Promise<ProjectRecord | undefined>;
  create({ record }: { record: NewProjectRecord }): Promise<ProjectRecord>;
  update({
    projectId,
    values,
  }: {
    projectId: string;
    values: Partial<NewProjectRecord>;
  }): Promise<ProjectRecord>;
}

/** Drizzle/D1 implementation of the project persistence boundary. */
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Database = getDb()) {}

  listByOwner({ ownerId }: { ownerId: string }) {
    return this.db
      .select()
      .from(projectTable)
      .where(eq(projectTable.ownerUserId, ownerId))
      .orderBy(asc(projectTable.createdAt))
      .all();
  }

  findById({ projectId }: { projectId: string }) {
    return this.db.select().from(projectTable).where(eq(projectTable.id, projectId)).get();
  }

  create({ record }: { record: NewProjectRecord }) {
    return this.db.insert(projectTable).values(record).returning().get();
  }

  update({ projectId, values }: { projectId: string; values: Partial<NewProjectRecord> }) {
    return this.db
      .update(projectTable)
      .set(values)
      .where(eq(projectTable.id, projectId))
      .returning()
      .get();
  }
}
