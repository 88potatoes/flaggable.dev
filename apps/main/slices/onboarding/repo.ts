import { eq } from "drizzle-orm";

import { getDb, type Database } from "@/lib/db";
import {
  userOnboardingTable,
  type NewUserOnboardingRecord,
  type UserOnboardingRecord,
} from "@/lib/db/schema";

export interface UserOnboardingRepository {
  findByUserId({ userId }: { userId: string }): Promise<UserOnboardingRecord | undefined>;
  create({ record }: { record: NewUserOnboardingRecord }): Promise<UserOnboardingRecord>;
  update({
    userId,
    values,
  }: {
    userId: string;
    values: Partial<NewUserOnboardingRecord>;
  }): Promise<UserOnboardingRecord>;
}

export class DrizzleUserOnboardingRepository implements UserOnboardingRepository {
  constructor(private readonly db: Database = getDb()) {}

  findByUserId({ userId }: { userId: string }) {
    return this.db
      .select()
      .from(userOnboardingTable)
      .where(eq(userOnboardingTable.userId, userId))
      .get();
  }

  create({ record }: { record: NewUserOnboardingRecord }) {
    return this.db.insert(userOnboardingTable).values(record).returning().get();
  }

  update({ userId, values }: { userId: string; values: Partial<NewUserOnboardingRecord> }) {
    return this.db
      .update(userOnboardingTable)
      .set(values)
      .where(eq(userOnboardingTable.userId, userId))
      .returning()
      .get();
  }
}
