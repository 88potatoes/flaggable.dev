import { ApiError } from "./api";
import {
  createConditionRepository,
  createFlagRepository,
  createProjectRepository,
  createValueSchemaRepository,
  type Db,
} from "./repositories";
import type { ConditionOperator, JsonObject, JsonValue } from "./flags/types";
import {
  assertJsonSchemaValue,
  parseJson,
  validateJsonSchemaDocument,
} from "./flags/json-schema";

const operators = new Set<ConditionOperator>([
  "equals",
  "not_equals",
  "in",
  "not_in",
]);

function now() {
  return new Date();
}

function id() {
  return crypto.randomUUID();
}

function json(value: unknown, field: string): string {
  try {
    return JSON.stringify(value);
  } catch {
    throw new ApiError(400, `${field} must be JSON serializable.`);
  }
}

async function requireProject(db: Db, projectId: string, ownerUserId: string) {
  const project = await createProjectRepository(db).findById(projectId);
  if (!project || project.ownerUserId !== ownerUserId) {
    throw new ApiError(404, "Project not found.");
  }
  if (project.archivedAt) throw new ApiError(409, "Project is archived.");
  return project;
}

async function requireFlag(db: Db, flagId: string, ownerUserId: string) {
  const flag = await createFlagRepository(db).findById(flagId);
  if (!flag) throw new ApiError(404, "Flag not found.");
  await requireProject(db, flag.projectId, ownerUserId);
  if (flag.archivedAt) throw new ApiError(409, "Flag is archived.");
  return flag;
}

export function createProjectService(db: Db) {
  const repository = createProjectRepository(db);

  return {
    list: (ownerUserId: string) => repository.listByOwner(ownerUserId),
    get: async (projectId: string, ownerUserId: string) => {
      const project = await repository.findById(projectId);
      if (!project || project.ownerUserId !== ownerUserId) {
        throw new ApiError(404, "Project not found.");
      }
      return project;
    },
    create: (ownerUserId: string, name: string) => {
      const timestamp = now();
      return repository.create({
        id: id(),
        ownerUserId,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },
    update: async (projectId: string, ownerUserId: string, name: string) => {
      await requireProject(db, projectId, ownerUserId);
      return repository.update(projectId, { name, updatedAt: now() });
    },
    archive: async (projectId: string, ownerUserId: string) => {
      await requireProject(db, projectId, ownerUserId);
      return repository.update(projectId, {
        archivedAt: now(),
        updatedAt: now(),
      });
    },
  };
}

export function createValueSchemaService(db: Db) {
  const repository = createValueSchemaRepository(db);

  return {
    list: async (projectId: string, ownerUserId: string) => {
      await requireProject(db, projectId, ownerUserId);
      return repository.listByProject(projectId);
    },
    get: async (schemaId: string, ownerUserId: string) => {
      const schema = await repository.findById(schemaId);
      if (!schema) throw new ApiError(404, "Value schema not found.");
      await requireProject(db, schema.projectId, ownerUserId);
      return schema;
    },
    create: async (
      projectId: string,
      ownerUserId: string,
      name: string,
      schemaJson: JsonObject,
    ) => {
      await requireProject(db, projectId, ownerUserId);
      validateJsonSchemaDocument(schemaJson);
      return repository.create({
        id: id(),
        projectId,
        name,
        schemaJson: json(schemaJson, "schemaJson"),
        createdAt: now(),
      });
    },
    update: async (
      schemaId: string,
      ownerUserId: string,
      values: { name?: string; schemaJson?: JsonObject },
    ) => {
      const schema = await repository.findById(schemaId);
      if (!schema) throw new ApiError(404, "Value schema not found.");
      await requireProject(db, schema.projectId, ownerUserId);
      if (values.schemaJson !== undefined) {
        validateJsonSchemaDocument(values.schemaJson);
      }
      return repository.update(schema.id, {
        ...(values.name === undefined ? {} : { name: values.name }),
        ...(values.schemaJson === undefined
          ? {}
          : { schemaJson: json(values.schemaJson, "schemaJson") }),
      });
    },
  };
}

export function createFlagService(db: Db) {
  const repository = createFlagRepository(db);
  const schemas = createValueSchemaRepository(db);

  return {
    list: async (projectId: string, ownerUserId: string) => {
      await requireProject(db, projectId, ownerUserId);
      return repository.listByProject(projectId);
    },
    get: async (flagId: string, ownerUserId: string) =>
      requireFlag(db, flagId, ownerUserId),
    create: async (
      projectId: string,
      ownerUserId: string,
      values: {
        valueSchemaId: string;
        key: string;
        name: string;
        description?: string;
        fallbackValue: JsonValue;
      },
    ) => {
      await requireProject(db, projectId, ownerUserId);
      const schema = await schemas.findById(values.valueSchemaId);
      if (!schema || schema.projectId !== projectId) {
        throw new ApiError(400, "Value schema does not belong to this project.");
      }
      const valueSchema = parseJson<JsonObject>(schema.schemaJson, "schemaJson");
      assertJsonSchemaValue({
        schema: valueSchema,
        value: values.fallbackValue,
        field: "fallbackValue",
      });
      const timestamp = now();
      return repository.create({
        id: id(),
        projectId,
        valueSchemaId: values.valueSchemaId,
        key: values.key,
        name: values.name,
        description: values.description,
        enabled: true,
        fallbackValue: json(values.fallbackValue, "fallbackValue"),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },
    update: async (
      flagId: string,
      ownerUserId: string,
      values: {
        name?: string;
        description?: string;
        enabled?: boolean;
        fallbackValue?: JsonValue;
      },
    ) => {
      const flag = await requireFlag(db, flagId, ownerUserId);
      if (values.fallbackValue !== undefined) {
        const schema = await schemas.findById(flag.valueSchemaId);
        if (!schema) throw new ApiError(500, "Flag value schema not found.");
        assertJsonSchemaValue({
          schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
          value: values.fallbackValue,
          field: "fallbackValue",
        });
      }
      return repository.update(flag.id, {
        ...(values.name === undefined ? {} : { name: values.name }),
        ...(values.description === undefined
          ? {}
          : { description: values.description }),
        ...(values.enabled === undefined ? {} : { enabled: values.enabled }),
        ...(values.fallbackValue === undefined
          ? {}
          : { fallbackValue: json(values.fallbackValue, "fallbackValue") }),
        updatedAt: now(),
      });
    },
    archive: async (flagId: string, ownerUserId: string) => {
      await requireFlag(db, flagId, ownerUserId);
      return repository.update(flagId, { archivedAt: now(), updatedAt: now() });
    },
  };
}

export function createConditionService(db: Db) {
  const repository = createConditionRepository(db);
  const flags = createFlagRepository(db);
  const schemas = createValueSchemaRepository(db);

  return {
    list: async (flagId: string, ownerUserId: string) => {
      await requireFlag(db, flagId, ownerUserId);
      return repository.listByFlag(flagId);
    },
    get: async (conditionId: string, ownerUserId: string) => {
      const condition = await repository.findById(conditionId);
      if (!condition) throw new ApiError(404, "Condition not found.");
      await requireFlag(db, condition.flagId, ownerUserId);
      return condition;
    },
    create: async (
      flagId: string,
      ownerUserId: string,
      values: {
        position: number;
        enabled?: boolean;
        property: string;
        operator: ConditionOperator;
        predicateValue: JsonValue;
        resultValue: JsonValue;
      },
    ) => {
      const flag = await requireFlag(db, flagId, ownerUserId);
      validateConditionInput(values.operator, values.predicateValue);
      const schema = await schemas.findById(flag.valueSchemaId);
      if (!schema) throw new ApiError(500, "Flag value schema not found.");
      assertJsonSchemaValue({
        schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
        value: values.resultValue,
        field: "resultValue",
      });
      const timestamp = now();
      return repository.create({
        id: id(),
        flagId,
        position: values.position,
        enabled: values.enabled ?? true,
        property: values.property,
        operator: values.operator,
        predicateValue: json(values.predicateValue, "predicateValue"),
        resultValue: json(values.resultValue, "resultValue"),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },
    update: async (
      conditionId: string,
      ownerUserId: string,
      values: Partial<{
        position: number;
        enabled: boolean;
        property: string;
        operator: ConditionOperator;
        predicateValue: JsonValue;
        resultValue: JsonValue;
      }>,
    ) => {
      const condition = await repository.findById(conditionId);
      if (!condition) throw new ApiError(404, "Condition not found.");
      await requireFlag(db, condition.flagId, ownerUserId);
      const operator = values.operator ?? (condition.operator as ConditionOperator);
      const predicateValue = values.predicateValue ?? parseJson<JsonValue>(condition.predicateValue, "predicateValue");
      validateConditionInput(operator, predicateValue);
      if (values.resultValue !== undefined) {
        const flag = await flags.findById(condition.flagId);
        if (!flag) throw new ApiError(500, "Condition flag not found.");
        const schema = await schemas.findById(flag.valueSchemaId);
        if (!schema) throw new ApiError(500, "Flag value schema not found.");
        assertJsonSchemaValue({
          schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
          value: values.resultValue,
          field: "resultValue",
        });
      }
      return repository.update(condition.id, {
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
        updatedAt: now(),
      });
    },
  };
}

function validateConditionInput(operator: ConditionOperator, value: JsonValue) {
  if (!operators.has(operator)) {
    throw new ApiError(400, "Unsupported condition operator.");
  }
  if (
    (operator === "in" || operator === "not_in") &&
    (!Array.isArray(value) || value.length === 0)
  ) {
    throw new ApiError(400, `${operator} requires a non-empty array.`);
  }
}

export const serializeSchema = (record: { schemaJson: string }) => ({
  ...record,
  schemaJson: parseJson<JsonObject>(record.schemaJson, "schemaJson"),
});

export const serializeFlag = (record: { fallbackValue: string }) => ({
  ...record,
  fallbackValue: parseJson<JsonValue>(record.fallbackValue, "fallbackValue"),
});

export const serializeCondition = (record: {
  predicateValue: string;
  resultValue: string;
}) => ({
  ...record,
  predicateValue: parseJson<JsonValue>(record.predicateValue, "predicateValue"),
  resultValue: parseJson<JsonValue>(record.resultValue, "resultValue"),
});
