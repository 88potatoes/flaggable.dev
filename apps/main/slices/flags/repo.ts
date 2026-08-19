import { asc, eq } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { flagTable, type FlagRecord, type NewFlagRecord } from "@/lib/db/schema";

/** Persistence boundary for feature flags. */
export interface FlagRepository {
  listByProject({ projectId }: { projectId: string }): Promise<FlagRecord[]>;
  findById({ flagId }: { flagId: string }): Promise<FlagRecord | undefined>;
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
  constructor(private readonly db: Database) {}

  listByProject({ projectId }: { projectId: string }) {
    return this.db
      .select()
      .from(flagTable)
      .where(eq(flagTable.projectId, projectId))
      .orderBy(asc(flagTable.createdAt))
      .all();
  }

  findById({ flagId }: { flagId: string }) {
    return this.db.select().from(flagTable).where(eq(flagTable.id, flagId)).get();
  }

  create({ record }: { record: NewFlagRecord }) {
    return this.db.insert(flagTable).values(record).returning().get();
  }

  update({ flagId, values }: { flagId: string; values: Partial<NewFlagRecord> }) {
    return this.db.update(flagTable).set(values).where(eq(flagTable.id, flagId)).returning().get();
  }
}
