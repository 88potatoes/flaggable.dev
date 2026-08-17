/** JSON values supported by flag values and evaluation properties. */
export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export type JsonObject = {
  [property: string]: JsonValue;
};

/** JSON Schema documents are JSON objects. */
export type JsonSchema = JsonObject;

export type ConditionOperator = "equals" | "not_equals" | "in" | "not_in";

export type ConditionPredicate = {
  /** A literal top-level property name. Nested paths are not supported yet. */
  property: string;
  operator: ConditionOperator;
  value: JsonValue;
};

export type EvaluationCondition = {
  id: string;
  position: number;
  enabled: boolean;
  predicate: ConditionPredicate;
  resultValue: JsonValue;
};

export type EvaluationResult = {
  value: JsonValue;
  matchedConditionId: string | null;
};
