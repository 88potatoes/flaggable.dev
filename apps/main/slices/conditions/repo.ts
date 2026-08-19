import { asc, eq } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { conditionTable, type ConditionRecord, type NewConditionRecord } from "@/lib/db/schema";

/** Persistence boundary for targeting conditions. */
export interface ConditionRepository {
  listByFlag({ flagId }: { flagId: string }): Promise<ConditionRecord[]>;
  findById({ conditionId }: { conditionId: string }): Promise<ConditionRecord | undefined>;
  create({ record }: { record: NewConditionRecord }): Promise<ConditionRecord>;
  update({
    conditionId,
    values,
  }: {
    conditionId: string;
    values: Partial<NewConditionRecord>;
  }): Promise<ConditionRecord>;
}

/** Drizzle/D1 implementation of the condition persistence boundary. */
export class DrizzleConditionRepository implements ConditionRepository {
  constructor(private readonly db: Database) {}

  listByFlag({ flagId }: { flagId: string }) {
    return this.db
      .select()
      .from(conditionTable)
      .where(eq(conditionTable.flagId, flagId))
      .orderBy(asc(conditionTable.position))
      .all();
  }

  findById({ conditionId }: { conditionId: string }) {
    return this.db.select().from(conditionTable).where(eq(conditionTable.id, conditionId)).get();
  }

  create({ record }: { record: NewConditionRecord }) {
    return this.db.insert(conditionTable).values(record).returning().get();
  }

  update({ conditionId, values }: { conditionId: string; values: Partial<NewConditionRecord> }) {
    return this.db
      .update(conditionTable)
      .set(values)
      .where(eq(conditionTable.id, conditionId))
      .returning()
      .get();
  }
}
