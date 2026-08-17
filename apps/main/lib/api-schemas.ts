import { z } from "zod";

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);

const jsonObject = z.record(z.string(), jsonValue);

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
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  fallbackValue: jsonValue,
});

export const updateFlagRequest = createFlagRequest
  .omit({ valueSchemaId: true, key: true })
  .partial()
  .extend({ enabled: z.boolean().optional() });

const conditionOperator = z.enum(["equals", "not_equals", "in", "not_in"]);

export const createConditionRequest = z
  .object({
    position: z.number().int().min(1),
    enabled: z.boolean().optional(),
    property: z.string().trim().min(1).max(100),
    operator: conditionOperator,
    predicateValue: jsonValue,
    resultValue: jsonValue,
  })
  .superRefine((value, context) => {
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
  });

export const updateConditionRequest = createConditionRequest.partial();

export function parseRequest<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.issues));
  }
  return result.data;
}
