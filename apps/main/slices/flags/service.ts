import { uuidv7 } from "uuidv7";

import type { FlagRecord, NewFlagRecord } from "@/lib/db/schema";

import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";
import {
  DrizzleValueSchemaRepository,
  type ValueSchemaRepository,
} from "@/slices/value-schemas/repo";
import { FlagError, FlagNameConflictError, flagNameConflict } from "./errors";
import { DrizzleFlagRepository, type FlagRepository } from "./repo";

function encodeCursor(record: Pick<FlagRecord, "createdAt" | "id">) {
  return Buffer.from(
    JSON.stringify({ createdAt: record.createdAt.toISOString(), id: record.id }),
  ).toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt?: string;
      id?: string;
    };
    const createdAt = value.createdAt ? new Date(value.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.valueOf()) || !value.id) throw new Error();
    return { createdAt, id: value.id };
  } catch {
    throw new FlagError("invalid_pagination_cursor", "Invalid flag pagination cursor.");
  }
}

/** Application operations for feature flags with injected persistence dependencies. */
export class FlagService {
  constructor(
    private readonly repository: FlagRepository = new DrizzleFlagRepository(),
    private readonly projects: ProjectRepository = new DrizzleProjectRepository(),
    private readonly schemas: ValueSchemaRepository = new DrizzleValueSchemaRepository(),
  ) {}

  list = async ({
    projectId,
    ownerId,
    search = "",
    limit = 25,
    cursor,
  }: {
    projectId: string;
    ownerId: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }) => {
    await this.requireProject({ projectId, ownerId });
    const after = cursor ? decodeCursor(cursor) : undefined;
    const page = await this.repository.listByProject({ projectId, search, limit, after });
    const last = page.items.at(-1);
    return {
      items: page.items,
      nextCursor: page.hasMore && last ? encodeCursor(last) : null,
    };
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
      name: string;
      description?: string;
    };
  }) => {
    await this.requireProject({ projectId, ownerId });
    const schema = await this.schemas.findById({ schemaId: values.valueSchemaId });
    if (!schema) {
      throw new FlagError("value_schema_not_found", "Value schema not found.", {
        field: "valueSchemaId",
      });
    }
    if (schema.projectId !== projectId) {
      throw new FlagError(
        "value_schema_project_mismatch",
        "Value schema does not belong to this project.",
        { field: "valueSchemaId" },
      );
    }
    const existingFlag = await this.repository.findByProjectAndName({
      projectId,
      name: values.name,
    });
    if (existingFlag) throw flagNameConflict(values.name);

    const timestamp = new Date();
    const record: NewFlagRecord = {
      id: uuidv7(),
      projectId,
      valueSchemaId: values.valueSchemaId,
      name: values.name,
      description: values.description,
      enabled: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    try {
      return await this.repository.create({ record });
    } catch (error) {
      if (error instanceof FlagNameConflictError) throw flagNameConflict(values.name, error);
      throw error;
    }
  };

  update = async ({
    flagId,
    ownerId,
    values,
  }: {
    flagId: string;
    ownerId: string;
    values: { name?: string; description?: string; enabled?: boolean };
  }) => {
    const flag = await this.requireFlag({ flagId, ownerId });
    if (values.name !== undefined) {
      const existingFlag = await this.repository.findByProjectAndName({
        projectId: flag.projectId,
        name: values.name,
      });
      if (existingFlag && existingFlag.id !== flag.id) throw flagNameConflict(values.name);
    }

    try {
      const updated = await this.repository.update({
        flagId: flag.id,
        values: {
          ...(values.name === undefined ? {} : { name: values.name }),
          ...(values.description === undefined ? {} : { description: values.description }),
          ...(values.enabled === undefined ? {} : { enabled: values.enabled }),
          updatedAt: new Date(),
        },
      });
      if (!updated) throw new FlagError("flag_not_found", "Flag not found.");
      return updated;
    } catch (error) {
      if (error instanceof FlagNameConflictError) {
        throw flagNameConflict(values.name ?? flag.name, error);
      }
      throw error;
    }
  };

  archive = async ({ flagId, ownerId }: { flagId: string; ownerId: string }) => {
    await this.requireFlag({ flagId, ownerId });
    const timestamp = new Date();
    const archived = await this.repository.update({
      flagId,
      values: { archivedAt: timestamp, updatedAt: timestamp },
    });
    if (!archived) throw new FlagError("flag_not_found", "Flag not found.");
    return archived;
  };

  private async requireProject({ projectId, ownerId }: { projectId: string; ownerId: string }) {
    const project = await this.projects.findById({ projectId });
    if (!project || project.ownerUserId !== ownerId) {
      throw new FlagError("project_not_found", "Project not found.");
    }
    if (project.archivedAt) throw new FlagError("project_archived", "Project is archived.");
    return project;
  }

  private async requireFlag({ flagId, ownerId }: { flagId: string; ownerId: string }) {
    const flag = await this.repository.findById({ flagId });
    if (!flag) throw new FlagError("flag_not_found", "Flag not found.");
    await this.requireProject({ projectId: flag.projectId, ownerId });
    if (flag.archivedAt) throw new FlagError("flag_archived", "Flag is archived.");
    return flag;
  }
}

export const serializeFlag = (record: FlagRecord) => record;
