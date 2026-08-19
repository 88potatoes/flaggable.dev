import { uuidv7 } from "uuidv7";

import { ApiError } from "@/lib/api";
import type { ConditionRecord, NewConditionRecord } from "@/lib/db/schema";
import { assertJsonSchemaValue, parseJson } from "@/lib/flags/json-schema";
import type { ConditionOperator, JsonObject, JsonValue } from "@/lib/flags/types";
import { DrizzleFlagRepository, type FlagRepository } from "@/slices/flags/repo";
import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";
import {
  DrizzleValueSchemaRepository,
  type ValueSchemaRepository,
} from "@/slices/value-schemas/repo";
import { DrizzleConditionRepository, type ConditionRepository } from "./repo";

const operators = new Set<ConditionOperator>(["equals", "not_equals", "in", "not_in"]);

function json(value: unknown, field: string): string {
  try {
    return JSON.stringify(value);
  } catch {
    throw new ApiError(400, `${field} must be JSON serializable.`);
  }
}

/** Application operations for targeting conditions with injected dependencies. */
export class ConditionService {
  constructor(
    private readonly repository: ConditionRepository = new DrizzleConditionRepository(),
    private readonly flags: FlagRepository = new DrizzleFlagRepository(),
    private readonly schemas: ValueSchemaRepository = new DrizzleValueSchemaRepository(),
    private readonly projects: ProjectRepository = new DrizzleProjectRepository(),
  ) {}

  list = async ({ flagId, ownerId }: { flagId: string; ownerId: string }) => {
    await this.requireFlag({ flagId, ownerId });
    return this.repository.listByFlag({ flagId });
  };

  get = async ({ conditionId, ownerId }: { conditionId: string; ownerId: string }) => {
    const condition = await this.repository.findById({ conditionId });
    if (!condition) throw new ApiError(404, "Condition not found.");
    await this.requireFlag({ flagId: condition.flagId, ownerId });
    return condition;
  };

  create = async ({
    flagId,
    ownerId,
    values,
  }: {
    flagId: string;
    ownerId: string;
    values: {
      position: number;
      enabled?: boolean;
      property: string;
      operator: ConditionOperator;
      predicateValue: JsonValue;
      resultValue: JsonValue;
    };
  }) => {
    const flag = await this.requireFlag({ flagId, ownerId });
    validateConditionInput(values.operator, values.predicateValue);
    const schema = await this.schemas.findById({ schemaId: flag.valueSchemaId });
    if (!schema) throw new ApiError(500, "Flag value schema not found.");
    assertJsonSchemaValue({
      schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
      value: values.resultValue,
      field: "resultValue",
    });
    const timestamp = new Date();
    const record: NewConditionRecord = {
      id: uuidv7(),
      flagId,
      position: values.position,
      enabled: values.enabled ?? true,
      property: values.property,
      operator: values.operator,
      predicateValue: json(values.predicateValue, "predicateValue"),
      resultValue: json(values.resultValue, "resultValue"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.create({ record });
  };

  update = async ({
    conditionId,
    ownerId,
    values,
  }: {
    conditionId: string;
    ownerId: string;
    values: Partial<{
      position: number;
      enabled: boolean;
      property: string;
      operator: ConditionOperator;
      predicateValue: JsonValue;
      resultValue: JsonValue;
    }>;
  }) => {
    const condition = await this.repository.findById({ conditionId });
    if (!condition) throw new ApiError(404, "Condition not found.");
    await this.requireFlag({ flagId: condition.flagId, ownerId });
    const operator = values.operator ?? (condition.operator as ConditionOperator);
    const predicateValue =
      values.predicateValue ?? parseJson<JsonValue>(condition.predicateValue, "predicateValue");
    validateConditionInput(operator, predicateValue);
    if (values.resultValue !== undefined) {
      const flag = await this.flags.findById({ flagId: condition.flagId });
      if (!flag) throw new ApiError(500, "Condition flag not found.");
      const schema = await this.schemas.findById({ schemaId: flag.valueSchemaId });
      if (!schema) throw new ApiError(500, "Flag value schema not found.");
      assertJsonSchemaValue({
        schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
        value: values.resultValue,
        field: "resultValue",
      });
    }
    return this.repository.update({
      conditionId: condition.id,
      values: {
        ...(values.position === undefined ? {} : { position: values.position }),
        ...(values.enabled === undefined ? {} : { enabled: values.enabled }),
        ...(values.property === undefined ? {} : { property: values.property }),
        ...(values.operator === undefined ? {} : { operator: values.operator }),
        ...(values.predicateValue === undefined
          ? {}
          : { predicateValue: json(values.predicateValue, "predicateValue") }),
        ...(values.resultValue === undefined
          ? {}
          : { resultValue: json(values.resultValue, "resultValue") }),
        updatedAt: new Date(),
      },
    });
  };

  private async requireProject({ projectId, ownerId }: { projectId: string; ownerId: string }) {
    const project = await this.projects.findById({ projectId });
    if (!project || project.ownerUserId !== ownerId) throw new ApiError(404, "Project not found.");
    if (project.archivedAt) throw new ApiError(409, "Project is archived.");
    return project;
  }

  private async requireFlag({ flagId, ownerId }: { flagId: string; ownerId: string }) {
    const flag = await this.flags.findById({ flagId });
    if (!flag) throw new ApiError(404, "Flag not found.");
    await this.requireProject({ projectId: flag.projectId, ownerId });
    if (flag.archivedAt) throw new ApiError(409, "Flag is archived.");
    return flag;
  }
}

function validateConditionInput(operator: ConditionOperator, value: JsonValue) {
  if (!operators.has(operator)) throw new ApiError(400, "Unsupported condition operator.");
  if (
    (operator === "in" || operator === "not_in") &&
    (!Array.isArray(value) || value.length === 0)
  ) {
    throw new ApiError(400, `${operator} requires a non-empty array.`);
  }
}

export const serializeCondition = (
  record: Pick<ConditionRecord, "predicateValue" | "resultValue"> & Record<string, unknown>,
) => ({
  ...record,
  predicateValue: parseJson<JsonValue>(record.predicateValue, "predicateValue"),
  resultValue: parseJson<JsonValue>(record.resultValue, "resultValue"),
});
