/** JSON values supported by flag values and evaluation properties. */
import type {
  ConditionOperator,
  JsonObject,
  JsonPrimitive,
  JsonSchema,
  JsonValue,
} from "@flaggable/contracts";

export type { ConditionOperator, JsonObject, JsonPrimitive, JsonSchema, JsonValue };

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
