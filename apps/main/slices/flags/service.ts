import { uuidv7 } from "uuidv7";

import { ApiError } from "@/lib/api";
import type { FlagRecord, NewFlagRecord } from "@/lib/db/schema";
import { parseJson } from "@/lib/flags/json-schema";
import type { JsonObject, JsonValue } from "@/lib/flags/types";
import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";
import {
  DrizzleValueSchemaRepository,
  type ValueSchemaRepository,
} from "@/slices/value-schemas/repo";
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
    throw new ApiError(400, "Invalid flag pagination cursor.");
  }
}

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
    if (!schema || schema.projectId !== projectId) {
      throw new ApiError(400, "Value schema does not belong to this project.");
    }
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
    return this.repository.create({ record });
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
    return this.repository.update({
      flagId: flag.id,
      values: {
        ...(values.name === undefined ? {} : { name: values.name }),
        ...(values.description === undefined ? {} : { description: values.description }),
        ...(values.enabled === undefined ? {} : { enabled: values.enabled }),
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

export const serializeFlag = (record: FlagRecord) => record;
