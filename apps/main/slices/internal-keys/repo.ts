import { and, eq, isNull } from "drizzle-orm";

import { getDb, type Database } from "@/lib/db";
import {
  internalKeyTable,
  type NewInternalKeyRecord,
  type InternalKeyRecord,
} from "@/lib/db/schema";

export interface InternalKeyRepository {
  listByProject({ projectId }: { projectId: string }): Promise<InternalKeyRecord[]>;
  findActiveByHash({ keyHash }: { keyHash: string }): Promise<InternalKeyRecord | undefined>;
  create({ record }: { record: NewInternalKeyRecord }): Promise<InternalKeyRecord>;
  revoke({
    keyId,
    projectId,
  }: {
    keyId: string;
    projectId: string;
  }): Promise<InternalKeyRecord | undefined>;
}

export class DrizzleInternalKeyRepository implements InternalKeyRepository {
  constructor(private readonly db: Database = getDb()) {}

  listByProject({ projectId }: { projectId: string }) {
    return this.db
      .select()
      .from(internalKeyTable)
      .where(eq(internalKeyTable.projectId, projectId))
      .all();
  }

  findActiveByHash({ keyHash }: { keyHash: string }) {
    return this.db
      .select()
      .from(internalKeyTable)
      .where(and(eq(internalKeyTable.keyHash, keyHash), isNull(internalKeyTable.revokedAt)))
      .get();
  }

  create({ record }: { record: NewInternalKeyRecord }) {
    return this.db.insert(internalKeyTable).values(record).returning().get();
  }

  revoke({ keyId, projectId }: { keyId: string; projectId: string }) {
    return this.db
      .update(internalKeyTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(internalKeyTable.id, keyId), eq(internalKeyTable.projectId, projectId)))
      .returning()
      .get();
  }
}
