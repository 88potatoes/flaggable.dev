import type {
  ConditionPredicate,
  EvaluationCondition,
  EvaluationResult,
  JsonObject,
  JsonValue,
} from "./types";

export type EvaluationErrorCode = "INVALID_CONDITION" | "INVALID_PROPERTIES";

export class EvaluationError extends Error {
  readonly code: EvaluationErrorCode;

  constructor(code: EvaluationErrorCode, message: string) {
    super(message);
    this.name = "EvaluationError";
    this.code = code;
  }
}

/** Evaluate ordered conditions without depending on flags or schemas. */
export function evaluateConditions({
  conditions,
  properties,
  fallbackValue,
}: {
  conditions: EvaluationCondition[];
  properties: JsonObject;
  fallbackValue: JsonValue;
}): EvaluationResult {
  if (!isJsonObject(properties)) {
    throw new EvaluationError("INVALID_PROPERTIES", "Evaluation properties must be a JSON object.");
  }

  const orderedConditions = [...conditions].sort((left, right) => left.position - right.position);

  for (const condition of orderedConditions) {
    validateCondition(condition);

    if (condition.enabled && matchesPredicate({ predicate: condition.predicate, properties })) {
      return {
        value: condition.resultValue,
        matchedConditionId: condition.id,
      };
    }
  }

  return { value: fallbackValue, matchedConditionId: null };
}

function matchesPredicate({
  predicate,
  properties,
}: {
  predicate: ConditionPredicate;
  properties: JsonObject;
}): boolean {
  if (!Object.prototype.hasOwnProperty.call(properties, predicate.property)) {
    return false;
  }

  const propertyValue = properties[predicate.property];

  switch (predicate.operator) {
    case "equals":
      return deepEqual(propertyValue, predicate.value);
    case "not_equals":
      return !deepEqual(propertyValue, predicate.value);
    case "in":
      return (
        Array.isArray(predicate.value) &&
        predicate.value.some((candidate) => deepEqual(propertyValue, candidate))
      );
    case "not_in":
      return (
        Array.isArray(predicate.value) &&
        !predicate.value.some((candidate) => deepEqual(propertyValue, candidate))
      );
  }
}

function validateCondition(condition: EvaluationCondition): void {
  if (!condition.id || !Number.isInteger(condition.position)) {
    throw new EvaluationError(
      "INVALID_CONDITION",
      "A condition must have an id and integer position.",
    );
  }

  if (typeof condition.enabled !== "boolean") {
    throw new EvaluationError("INVALID_CONDITION", "A condition must define enabled as a boolean.");
  }

  if (!condition.predicate.property) {
    throw new EvaluationError("INVALID_CONDITION", "A condition property is required.");
  }

  if (
    (condition.predicate.operator === "in" || condition.predicate.operator === "not_in") &&
    (!Array.isArray(condition.predicate.value) || condition.predicate.value.length === 0)
  ) {
    throw new EvaluationError(
      "INVALID_CONDITION",
      `${condition.predicate.operator} requires a non-empty array value.`,
    );
  }
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepEqual(left: JsonValue, right: JsonValue): boolean {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((value, index) => deepEqual(value, right[index]))
    );
  }

  if (isJsonObject(left) && isJsonObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]),
      )
    );
  }

  return false;
}
