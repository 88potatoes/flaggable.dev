import { asc, eq } from "drizzle-orm";

import type { Database } from "@/lib/db";
import {
  valueSchemaTable,
  type NewValueSchemaRecord,
  type ValueSchemaRecord,
} from "@/lib/db/schema";

/** Persistence boundary for value schemas. */
export interface ValueSchemaRepository {
  listByProject({ projectId }: { projectId: string }): Promise<ValueSchemaRecord[]>;
  findById({ schemaId }: { schemaId: string }): Promise<ValueSchemaRecord | undefined>;
  create({ record }: { record: NewValueSchemaRecord }): Promise<ValueSchemaRecord>;
  update({
    schemaId,
    values,
  }: {
    schemaId: string;
    values: Partial<NewValueSchemaRecord>;
  }): Promise<ValueSchemaRecord>;
}

/** Drizzle/D1 implementation of the value-schema persistence boundary. */
export class DrizzleValueSchemaRepository implements ValueSchemaRepository {
  constructor(private readonly db: Database) {}

  listByProject({ projectId }: { projectId: string }) {
    return this.db
      .select()
      .from(valueSchemaTable)
      .where(eq(valueSchemaTable.projectId, projectId))
      .orderBy(asc(valueSchemaTable.createdAt))
      .all();
  }

  findById({ schemaId }: { schemaId: string }) {
    return this.db.select().from(valueSchemaTable).where(eq(valueSchemaTable.id, schemaId)).get();
  }

  create({ record }: { record: NewValueSchemaRecord }) {
    return this.db.insert(valueSchemaTable).values(record).returning().get();
  }

  update({ schemaId, values }: { schemaId: string; values: Partial<NewValueSchemaRecord> }) {
    return this.db
      .update(valueSchemaTable)
      .set(values)
      .where(eq(valueSchemaTable.id, schemaId))
      .returning()
      .get();
  }
}
