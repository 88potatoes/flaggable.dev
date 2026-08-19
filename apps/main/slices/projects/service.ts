import { ApiError } from "@/lib/api";
import { uuidv7 } from "uuidv7";

import type { NewProjectRecord, ProjectRecord } from "@/lib/db/schema";
import {
  DrizzleValueSchemaRepository,
  type ValueSchemaRepository,
} from "@/slices/value-schemas/repo";
import { PublicKeyService } from "@/slices/public-keys/service";
import { DrizzleProjectRepository, type ProjectRepository } from "./repo";

/** Application operations for projects. Persistence is injected for unit testing. */
const DEFAULT_BOOLEAN_SCHEMA = {
  type: "boolean",
  enum: [true, false],
} as const;

/** Creates the initial browser SDK credential for a new project. */
export interface ProjectPublicKeyService {
  create({ projectId, ownerId }: { projectId: string; ownerId: string }): Promise<{
    publicKey: string;
  }>;
}

export class ProjectService {
  constructor(
    private readonly repository: ProjectRepository = new DrizzleProjectRepository(),
    private readonly schemas: ValueSchemaRepository = new DrizzleValueSchemaRepository(),
    private readonly publicKeys?: ProjectPublicKeyService,
  ) {}

  list = ({ ownerId }: { ownerId: string }) => this.repository.listByOwner({ ownerId });

  get = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    const project = await this.repository.findById({ projectId });
    return this.assertOwnedActive(project, ownerId);
  };

  create = async ({ ownerId, name }: { ownerId: string; name: string }) => {
    const timestamp = new Date();
    const record: NewProjectRecord = {
      id: uuidv7(),
      ownerUserId: ownerId,
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const project = await this.repository.create({ record });

    await this.schemas.create({
      record: {
        id: uuidv7(),
        projectId: project.id,
        name: "Boolean",
        schemaJson: JSON.stringify(DEFAULT_BOOLEAN_SCHEMA),
        createdAt: timestamp,
      },
    });

    const { publicKey } = await (
      this.publicKeys ?? new PublicKeyService(undefined, this.repository)
    ).create({
      projectId: project.id,
      ownerId,
    });
    return { ...project, publicKey };
  };

  update = async ({
    projectId,
    ownerId,
    name,
  }: {
    projectId: string;
    ownerId: string;
    name: string;
  }) => {
    await this.get({ projectId, ownerId });
    return this.repository.update({ projectId, values: { name, updatedAt: new Date() } });
  };

  archive = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    await this.get({ projectId, ownerId });
    const timestamp = new Date();
    return this.repository.update({
      projectId,
      values: { archivedAt: timestamp, updatedAt: timestamp },
    });
  };

  private assertOwnedActive(project: ProjectRecord | undefined, ownerId: string) {
    if (!project || project.ownerUserId !== ownerId) {
      throw new ApiError(404, "Project not found.");
    }
    if (project.archivedAt) throw new ApiError(409, "Project is archived.");
    return project;
  }
}
