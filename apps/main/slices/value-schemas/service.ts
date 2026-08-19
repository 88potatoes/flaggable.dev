import { uuidv7 } from "uuidv7";

import { ApiError } from "@/lib/api";
import type { NewValueSchemaRecord, ValueSchemaRecord } from "@/lib/db/schema";
import type { JsonObject } from "@/lib/flags/types";
import { parseJson, validateJsonSchemaDocument } from "@/lib/flags/json-schema";
import type { ProjectRepository } from "@/slices/projects/repo";
import type { ValueSchemaRepository } from "./repo";

function json(value: unknown, field: string): string {
  try {
    return JSON.stringify(value);
  } catch {
    throw new ApiError(400, `${field} must be JSON serializable.`);
  }
}

/** Application operations for value schemas with injected persistence dependencies. */
export class ValueSchemaService {
  constructor(
    private readonly repository: ValueSchemaRepository,
    private readonly projects: ProjectRepository,
  ) {}

  list = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    await this.requireProject({ projectId, ownerId });
    return this.repository.listByProject({ projectId });
  };

  get = async ({ schemaId, ownerId }: { schemaId: string; ownerId: string }) => {
    const schema = await this.repository.findById({ schemaId });
    if (!schema) throw new ApiError(404, "Value schema not found.");
    await this.requireProject({ projectId: schema.projectId, ownerId });
    return schema;
  };

  create = async ({
    projectId,
    ownerId,
    name,
    schemaJson,
  }: {
    projectId: string;
    ownerId: string;
    name: string;
    schemaJson: JsonObject;
  }) => {
    await this.requireProject({ projectId, ownerId });
    validateJsonSchemaDocument(schemaJson);
    const timestamp = new Date();
    const record: NewValueSchemaRecord = {
      id: uuidv7(),
      projectId,
      name,
      schemaJson: json(schemaJson, "schemaJson"),
      createdAt: timestamp,
    };
    return this.repository.create({ record });
  };

  update = async ({
    schemaId,
    ownerId,
    values,
  }: {
    schemaId: string;
    ownerId: string;
    values: { name?: string; schemaJson?: JsonObject };
  }) => {
    const schema = await this.repository.findById({ schemaId });
    if (!schema) throw new ApiError(404, "Value schema not found.");
    await this.requireProject({ projectId: schema.projectId, ownerId });
    if (values.schemaJson !== undefined) validateJsonSchemaDocument(values.schemaJson);
    return this.repository.update({
      schemaId: schema.id,
      values: {
        ...(values.name === undefined ? {} : { name: values.name }),
        ...(values.schemaJson === undefined
          ? {}
          : { schemaJson: json(values.schemaJson, "schemaJson") }),
      },
    });
  };

  private async requireProject({ projectId, ownerId }: { projectId: string; ownerId: string }) {
    const project = await this.projects.findById({ projectId });
    if (!project || project.ownerUserId !== ownerId) throw new ApiError(404, "Project not found.");
    if (project.archivedAt) throw new ApiError(409, "Project is archived.");
    return project;
  }
}

export const serializeSchema = (
  record: Pick<ValueSchemaRecord, "schemaJson"> & Record<string, unknown>,
) => ({
  ...record,
  schemaJson: parseJson<JsonObject>(record.schemaJson, "schemaJson"),
});
