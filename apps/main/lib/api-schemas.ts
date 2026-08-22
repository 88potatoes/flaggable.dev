import { z } from "zod";

import type { JsonObject, JsonValue } from "./flags/types";

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);

const jsonObject: z.ZodType<JsonObject> = z.record(z.string(), jsonValue);

export const createProjectRequest = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateProjectRequest = createProjectRequest;

export const createValueSchemaRequest = z.object({
  name: z.string().trim().min(1).max(100),
  schemaJson: jsonObject,
});

export const updateValueSchemaRequest = createValueSchemaRequest.partial();

export const createFlagRequest = z.object({
  valueSchemaId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

/** Internal-key clients may omit the schema to use the project's default Boolean schema. */
export const createDevtoolFlagRequest = createFlagRequest
  .omit({ valueSchemaId: true })
  .extend({ valueSchemaId: z.string().min(1).optional() });

export const updateFlagRequest = createFlagRequest
  .omit({ valueSchemaId: true })
  .partial()
  .extend({ enabled: z.boolean().optional() });

const conditionOperator = z.enum(["equals", "not_equals", "in", "not_in"]);

const conditionFields = z.object({
  position: z.number().int().min(1),
  enabled: z.boolean().optional(),
  property: z.string().trim().min(1).max(100),
  operator: conditionOperator,
  predicateValue: jsonValue,
  resultValue: jsonValue,
});

function validateConditionPredicate(
  value: {
    operator?: z.infer<typeof conditionOperator>;
    predicateValue?: JsonValue;
  },
  context: z.RefinementCtx,
) {
  if (
    (value.operator === "in" || value.operator === "not_in") &&
    (!Array.isArray(value.predicateValue) || value.predicateValue.length === 0)
  ) {
    context.addIssue({
      code: "custom",
      path: ["predicateValue"],
      message: `${value.operator} requires a non-empty array.`,
    });
  }
}

export const createConditionRequest = conditionFields.superRefine(validateConditionPredicate);

export const updateConditionRequest = conditionFields
  .partial()
  .superRefine(validateConditionPredicate);

export const evaluateRequest = z.object({
  publicKey: z.string().trim().min(1),
  context: jsonObject,
});

export function parseRequest<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.issues));
  }
  return result.data;
}
