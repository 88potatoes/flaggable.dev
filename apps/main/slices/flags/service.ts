import { uuidv7 } from "uuidv7";

import { ApiError } from "@/lib/api";
import type { FlagRecord, NewFlagRecord } from "@/lib/db/schema";
import { assertJsonSchemaValue, parseJson } from "@/lib/flags/json-schema";
import type { JsonObject, JsonValue } from "@/lib/flags/types";
import type { ProjectRepository } from "@/slices/projects/repo";
import type { ValueSchemaRepository } from "@/slices/value-schemas/repo";
import type { FlagRepository } from "./repo";

function json(value: unknown, field: string): string {
  try {
    return JSON.stringify(value);
  } catch {
    throw new ApiError(400, `${field} must be JSON serializable.`);
  }
}

/** Application operations for feature flags with injected persistence dependencies. */
export class FlagService {
  constructor(
    private readonly repository: FlagRepository,
    private readonly projects: ProjectRepository,
    private readonly schemas: ValueSchemaRepository,
  ) {}

  list = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    await this.requireProject({ projectId, ownerId });
    return this.repository.listByProject({ projectId });
  };

  get = async ({ flagId, ownerId }: { flagId: string; ownerId: string }) =>
    this.requireFlag({ flagId, ownerId });

  create = async ({
    projectId,
    ownerId,
    values,
  }: {
    projectId: string;
    ownerId: string;
    values: {
      valueSchemaId: string;
      key: string;
      name: string;
      description?: string;
      fallbackValue: JsonValue;
    };
  }) => {
    await this.requireProject({ projectId, ownerId });
    const schema = await this.schemas.findById({ schemaId: values.valueSchemaId });
    if (!schema || schema.projectId !== projectId) {
      throw new ApiError(400, "Value schema does not belong to this project.");
    }
    assertJsonSchemaValue({
      schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
      value: values.fallbackValue,
      field: "fallbackValue",
    });
    const timestamp = new Date();
    const record: NewFlagRecord = {
      id: uuidv7(),
      projectId,
      valueSchemaId: values.valueSchemaId,
      key: values.key,
      name: values.name,
      description: values.description,
      enabled: true,
      fallbackValue: json(values.fallbackValue, "fallbackValue"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.create({ record });
  };

  update = async ({
    flagId,
    ownerId,
    values,
  }: {
    flagId: string;
    ownerId: string;
    values: { name?: string; description?: string; enabled?: boolean; fallbackValue?: JsonValue };
  }) => {
    const flag = await this.requireFlag({ flagId, ownerId });
    if (values.fallbackValue !== undefined) {
      const schema = await this.schemas.findById({ schemaId: flag.valueSchemaId });
      if (!schema) throw new ApiError(500, "Flag value schema not found.");
      assertJsonSchemaValue({
        schema: parseJson<JsonObject>(schema.schemaJson, "schemaJson"),
        value: values.fallbackValue,
        field: "fallbackValue",
      });
    }
    return this.repository.update({
      flagId: flag.id,
      values: {
        ...(values.name === undefined ? {} : { name: values.name }),
        ...(values.description === undefined ? {} : { description: values.description }),
        ...(values.enabled === undefined ? {} : { enabled: values.enabled }),
        ...(values.fallbackValue === undefined
          ? {}
          : { fallbackValue: json(values.fallbackValue, "fallbackValue") }),
        updatedAt: new Date(),
      },
    });
  };

  archive = async ({ flagId, ownerId }: { flagId: string; ownerId: string }) => {
    await this.requireFlag({ flagId, ownerId });
    const timestamp = new Date();
    return this.repository.update({
      flagId,
      values: { archivedAt: timestamp, updatedAt: timestamp },
    });
  };

  private async requireProject({ projectId, ownerId }: { projectId: string; ownerId: string }) {
    const project = await this.projects.findById({ projectId });
    if (!project || project.ownerUserId !== ownerId) throw new ApiError(404, "Project not found.");
    if (project.archivedAt) throw new ApiError(409, "Project is archived.");
    return project;
  }

  private async requireFlag({ flagId, ownerId }: { flagId: string; ownerId: string }) {
    const flag = await this.repository.findById({ flagId });
    if (!flag) throw new ApiError(404, "Flag not found.");
    await this.requireProject({ projectId: flag.projectId, ownerId });
    if (flag.archivedAt) throw new ApiError(409, "Flag is archived.");
    return flag;
  }
}

export const serializeFlag = (
  record: Pick<FlagRecord, "fallbackValue"> & Record<string, unknown>,
) => ({ ...record, fallbackValue: parseJson<JsonValue>(record.fallbackValue, "fallbackValue") });
