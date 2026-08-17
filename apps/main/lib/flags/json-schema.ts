import { Validator } from "@cfworker/json-schema";

import { ApiError } from "../api";
import type { JsonObject, JsonSchema, JsonValue } from "./types";

const draft2020SchemaUrl = "https://json-schema.org/draft/2020-12/schema";

export function validateJsonSchemaDocument(schema: JsonSchema): void {
  if (schema.$schema !== undefined && schema.$schema !== draft2020SchemaUrl) {
    throw new ApiError(400, `Only JSON Schema Draft 2020-12 is supported (${draft2020SchemaUrl}).`);
  }

  try {
    // Validating a schema against the meta-schema is intentionally deferred to
    // the first value validation because the library validates instances.
    new Validator(schema, "2020-12");
  } catch {
    throw new ApiError(400, "schemaJson is not a valid JSON Schema document.");
  }
}

export function assertJsonSchemaValue({
  schema,
  value,
  field,
}: {
  schema: JsonSchema;
  value: JsonValue;
  field: string;
}): void {
  let result;

  try {
    result = new Validator(schema, "2020-12", false).validate(value);
  } catch {
    throw new ApiError(400, `${field} could not be validated by schemaJson.`);
  }

  if (!result.valid) {
    throw new ApiError(400, `${field} does not match schemaJson.`, result.errors);
  }
}

export function parseJson<T>(value: string, field: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new ApiError(500, `Stored ${field} is invalid JSON.`);
  }
}

export function toJsonObject(value: unknown, field: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(400, `${field} must be a JSON object.`);
  }
  return value as JsonObject;
}
