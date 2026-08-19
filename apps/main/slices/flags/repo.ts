import { and, asc, eq, gt, like, or } from "drizzle-orm";

import { getDb, type Database } from "@/lib/db";
import { flagTable, type FlagRecord, type NewFlagRecord } from "@/lib/db/schema";

/** Persistence boundary for feature flags. */
export interface FlagRepository {
  listByProject({
    projectId,
    search,
    limit,
    after,
  }: {
    projectId: string;
    search?: string;
    limit: number;
    after?: { createdAt: Date; id: string };
  }): Promise<{ items: FlagRecord[]; hasMore: boolean }>;
  findById({ flagId }: { flagId: string }): Promise<FlagRecord | undefined>;
  findByProjectAndName({
    projectId,
    name,
  }: {
    projectId: string;
    name: string;
  }): Promise<FlagRecord | undefined>;
  create({ record }: { record: NewFlagRecord }): Promise<FlagRecord>;
  update({
    flagId,
    values,
  }: {
    flagId: string;
    values: Partial<NewFlagRecord>;
  }): Promise<FlagRecord>;
}

/** Drizzle/D1 implementation of the flag persistence boundary. */
export class DrizzleFlagRepository implements FlagRepository {
  constructor(private readonly db: Database = getDb()) {}

  async listByProject({
    projectId,
    search,
    limit,
    after,
  }: Parameters<FlagRepository["listByProject"]>[0]) {
    const conditions = [eq(flagTable.projectId, projectId)];
    if (search) conditions.push(like(flagTable.name, `%${search}%`));
    if (after) {
      conditions.push(
        or(
          gt(flagTable.createdAt, after.createdAt),
          and(eq(flagTable.createdAt, after.createdAt), gt(flagTable.id, after.id)),
        )!,
      );
    }
    const rows = await this.db
      .select()
      .from(flagTable)
      .where(and(...conditions))
      .orderBy(asc(flagTable.createdAt), asc(flagTable.id))
      .limit(limit + 1)
      .all();
    return { items: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  findById({ flagId }: { flagId: string }) {
    return this.db.select().from(flagTable).where(eq(flagTable.id, flagId)).get();
  }

  findByProjectAndName({ projectId, name }: { projectId: string; name: string }) {
    return this.db
      .select()
      .from(flagTable)
      .where(and(eq(flagTable.projectId, projectId), eq(flagTable.name, name)))
      .get();
  }

  create({ record }: { record: NewFlagRecord }) {
    return this.db.insert(flagTable).values(record).returning().get();
  }

  update({ flagId, values }: { flagId: string; values: Partial<NewFlagRecord> }) {
    return this.db.update(flagTable).set(values).where(eq(flagTable.id, flagId)).returning().get();
  }
}
