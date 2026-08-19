import { and, eq, isNull } from "drizzle-orm";

import { getDb, type Database } from "@/lib/db";
import { publicKeyTable, type NewPublicKeyRecord, type PublicKeyRecord } from "@/lib/db/schema";

export interface PublicKeyRepository {
  listByProject({ projectId }: { projectId: string }): Promise<PublicKeyRecord[]>;
  findActiveByHash({ keyHash }: { keyHash: string }): Promise<PublicKeyRecord | undefined>;
  create({ record }: { record: NewPublicKeyRecord }): Promise<PublicKeyRecord>;
  revoke({
    keyId,
    projectId,
  }: {
    keyId: string;
    projectId: string;
  }): Promise<PublicKeyRecord | undefined>;
}

export class DrizzlePublicKeyRepository implements PublicKeyRepository {
  constructor(private readonly db: Database = getDb()) {}

  listByProject({ projectId }: { projectId: string }) {
    return this.db
      .select()
      .from(publicKeyTable)
      .where(eq(publicKeyTable.projectId, projectId))
      .all();
  }

  findActiveByHash({ keyHash }: { keyHash: string }) {
    return this.db
      .select()
      .from(publicKeyTable)
      .where(and(eq(publicKeyTable.keyHash, keyHash), isNull(publicKeyTable.revokedAt)))
      .get();
  }

  create({ record }: { record: NewPublicKeyRecord }) {
    return this.db.insert(publicKeyTable).values(record).returning().get();
  }

  revoke({ keyId, projectId }: { keyId: string; projectId: string }) {
    return this.db
      .update(publicKeyTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(publicKeyTable.id, keyId), eq(publicKeyTable.projectId, projectId)))
      .returning()
      .get();
  }
}
