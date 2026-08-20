import { foreignKey, index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

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

/** Users directly own projects. */
export const projectTable = sqliteTable(
  "project",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    name: text("name").notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("project_owner_user_id_idx").on(table.ownerUserId)],
);

/** A project-scoped JSON Schema used to validate flag values. */
export const valueSchemaTable = sqliteTable(
  "value_schema",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    schemaJson: text("schema_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("value_schema_project_id_idx").on(table.projectId),
    unique("value_schema_project_name_unique").on(table.projectId, table.name),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectTable.id],
      name: "value_schema_project_id_fk",
    }),
  ],
);

export const flagTable = sqliteTable(
  "flag",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    valueSchemaId: text("value_schema_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    enabled: integer("enabled", { mode: "boolean" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    unique("flag_project_name_unique").on(table.projectId, table.name),
    index("flag_project_id_idx").on(table.projectId),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectTable.id],
      name: "flag_project_id_fk",
    }),
    foreignKey({
      columns: [table.valueSchemaId],
      foreignColumns: [valueSchemaTable.id],
      name: "flag_value_schema_id_fk",
    }),
  ],
);

export const publicKeyTable = sqliteTable(
  "public_key",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    keyHash: text("key_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    unique("public_key_hash_unique").on(table.keyHash),
    index("public_key_project_id_idx").on(table.projectId),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectTable.id],
      name: "public_key_project_id_fk",
    }),
  ],
);

export const conditionTable = sqliteTable(
  "condition",
  {
    id: text("id").primaryKey(),
    flagId: text("flag_id").notNull(),
    position: integer("position").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull(),
    property: text("property").notNull(),
    operator: text("operator").notNull(),
    predicateValue: text("predicate_value").notNull(),
    resultValue: text("result_value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    unique("condition_flag_position_unique").on(table.flagId, table.position),
    index("condition_flag_id_idx").on(table.flagId),
    foreignKey({
      columns: [table.flagId],
      foreignColumns: [flagTable.id],
      name: "condition_flag_id_fk",
    }),
  ],
);

export const internalKeyTable = sqliteTable(
  "internal_key",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull().default("Internal API Key"),
    keyHash: text("key_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    unique("internal_key_hash_unique").on(table.keyHash),
    index("internal_key_project_id_idx").on(table.projectId),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectTable.id],
      name: "internal_key_project_id_fk",
    }),
  ],
);

export type ProjectRecord = typeof projectTable.$inferSelect;
export type NewProjectRecord = typeof projectTable.$inferInsert;
export type ValueSchemaRecord = typeof valueSchemaTable.$inferSelect;
export type NewValueSchemaRecord = typeof valueSchemaTable.$inferInsert;
export type FlagRecord = typeof flagTable.$inferSelect;
export type NewFlagRecord = typeof flagTable.$inferInsert;
export type PublicKeyRecord = typeof publicKeyTable.$inferSelect;
export type NewPublicKeyRecord = typeof publicKeyTable.$inferInsert;
export type InternalKeyRecord = typeof internalKeyTable.$inferSelect;
export type NewInternalKeyRecord = typeof internalKeyTable.$inferInsert;
export type ConditionRecord = typeof conditionTable.$inferSelect;
export type NewConditionRecord = typeof conditionTable.$inferInsert;
