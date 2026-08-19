import { ApiError } from "@/lib/api";
import { uuidv7 } from "uuidv7";

import type { NewProjectRecord, ProjectRecord } from "@/lib/db/schema";
import type { ProjectRepository } from "./repo";

/** Application operations for projects. Persistence is injected for unit testing. */
export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  list = ({ ownerId }: { ownerId: string }) => this.repository.listByOwner({ ownerId });

  get = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    const project = await this.repository.findById({ projectId });
    return this.assertOwnedActive(project, ownerId);
  };

  create = ({ ownerId, name }: { ownerId: string; name: string }) => {
    const timestamp = new Date();
    const record: NewProjectRecord = {
      id: uuidv7(),
      ownerUserId: ownerId,
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.create({ record });
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
