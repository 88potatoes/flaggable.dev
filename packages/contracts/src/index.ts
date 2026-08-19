/** JSON values accepted by flag values, predicates, and schema results. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [property: string]: JsonValue };
export type JsonSchema = JsonObject;

export type ConditionOperator = "equals" | "not_equals" | "in" | "not_in";

export type Project = {
  id: string;
  name: string;
  archivedAt: string | null;
};

export type ValueSchema = {
  id: string;
  projectId: string;
  name: string;
  schemaJson: Record<string, unknown>;
};

export type Flag = {
  id: string;
  projectId: string;
  valueSchemaId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  fallbackValue: unknown;
  archivedAt: string | null;
  updatedAt: string;
};

export type Condition = {
  id: string;
  flagId: string;
  position: number;
  enabled: boolean;
  property: string;
  operator: ConditionOperator;
  predicateValue: unknown;
  resultValue: unknown;
  updatedAt: string;
};
