import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Database bootstrap table.
 *
 * Keep product tables out of this first migration until the domain model is
 * agreed on. This table gives us a safe way to verify the D1 binding and
 * migration pipeline end to end.
 */
export const systemTable = sqliteTable("system", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type SystemRecord = typeof systemTable.$inferSelect;
export type NewSystemRecord = typeof systemTable.$inferInsert;
