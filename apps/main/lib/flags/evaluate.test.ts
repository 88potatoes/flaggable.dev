import { describe, expect, test } from "vitest";

import { EvaluationError, evaluateConditions } from "./evaluate";
import type { ConditionOperator, EvaluationCondition, JsonObject, JsonValue } from "./types";

const fallbackValue = "fallback";

function condition({
  id = "condition-1",
  position = 1,
  enabled = true,
  property = "country",
  operator,
  value,
  resultValue = "matched",
}: {
  id?: string;
  position?: number;
  enabled?: boolean;
  property?: string;
  operator: ConditionOperator;
  value: JsonValue;
  resultValue?: JsonValue;
}): EvaluationCondition {
  return {
    id,
    position,
    enabled,
    predicate: { property, operator, value },
    resultValue,
  };
}

describe("evaluateConditions", () => {
  test.each([
    {
      name: "equals",
      operator: "equals" as const,
      predicateValue: "US",
      properties: { country: "US" } as JsonObject,
      expectedMatch: true,
    },
    {
      name: "not_equals",
      operator: "not_equals" as const,
      predicateValue: "CA",
      properties: { country: "US" } as JsonObject,
      expectedMatch: true,
    },
    {
      name: "in",
      operator: "in" as const,
      predicateValue: ["CA", "US"],
      properties: { country: "US" } as JsonObject,
      expectedMatch: true,
    },
    {
      name: "not_in",
      operator: "not_in" as const,
      predicateValue: ["CA", "GB"],
      properties: { country: "US" } as JsonObject,
      expectedMatch: true,
    },
    {
      name: "deep JSON equality",
      operator: "equals" as const,
      predicateValue: { preferences: { darkMode: true } },
      properties: { settings: { preferences: { darkMode: true } } } as JsonObject,
      expectedMatch: true,
      property: "settings",
    },
  ])("supports $name", ({ operator, predicateValue, properties, expectedMatch, property }) => {
    const result = evaluateConditions({
      conditions: [
        condition({
          operator,
          value: predicateValue,
          property,
        }),
      ],
      properties,
      fallbackValue,
    });

    expect(result).toEqual({
      value: expectedMatch ? "matched" : fallbackValue,
      matchedConditionId: expectedMatch ? "condition-1" : null,
    });
  });

  test.each([
    {
      name: "the property is missing",
      properties: {} as JsonObject,
      operator: "not_equals" as const,
      value: "US",
    },
    {
      name: "equals uses strict types",
      properties: { age: 1 } as JsonObject,
      operator: "equals" as const,
      value: "1",
      property: "age",
    },
    {
      name: "in does not contain the property value",
      properties: { country: "US" } as JsonObject,
      operator: "in" as const,
      value: ["CA", "GB"],
    },
  ])("returns the fallback when $name", ({ properties, operator, value, property }) => {
    expect(
      evaluateConditions({
        conditions: [condition({ operator, value, property })],
        properties,
        fallbackValue,
      }),
    ).toEqual({ value: fallbackValue, matchedConditionId: null });
  });

  test.each([
    {
      name: "the first matching condition by position",
      conditions: [
        condition({
          id: "second",
          position: 2,
          operator: "equals",
          value: "US",
          resultValue: "second-result",
        }),
        condition({
          id: "first",
          position: 1,
          operator: "equals",
          value: "US",
          resultValue: "first-result",
        }),
      ],
      properties: { country: "US" } as JsonObject,
      expected: { value: "first-result", matchedConditionId: "first" },
    },
    {
      name: "the fallback when there are no conditions",
      conditions: [],
      properties: {} as JsonObject,
      expected: { value: fallbackValue, matchedConditionId: null },
    },
    {
      name: "the fallback when the matching condition is disabled",
      conditions: [
        condition({
          enabled: false,
          operator: "equals",
          value: "US",
        }),
      ],
      properties: { country: "US" } as JsonObject,
      expected: { value: fallbackValue, matchedConditionId: null },
    },
  ])("returns $name", ({ conditions, properties, expected }) => {
    expect(evaluateConditions({ conditions, properties, fallbackValue })).toEqual(expected);
  });

  test.each([
    {
      name: "properties are not a JSON object",
      code: "INVALID_PROPERTIES" as const,
      input: { conditions: [], properties: null },
    },
    {
      name: "in has a non-array value",
      code: "INVALID_CONDITION" as const,
      input: {
        conditions: [condition({ operator: "in", value: "US" })],
        properties: { country: "US" } as JsonObject,
      },
    },
    {
      name: "not_in has an empty array",
      code: "INVALID_CONDITION" as const,
      input: {
        conditions: [condition({ operator: "not_in", value: [] })],
        properties: { country: "US" } as JsonObject,
      },
    },
  ])("throws when $name", ({ input, code }) => {
    expect(() =>
      evaluateConditions({
        ...input,
        fallbackValue,
      } as Parameters<typeof evaluateConditions>[0]),
    ).toThrowError(EvaluationError);

    try {
      evaluateConditions({
        ...input,
        fallbackValue,
      } as Parameters<typeof evaluateConditions>[0]);
    } catch (error) {
      expect(error).toMatchObject({ code });
    }
  });
});
