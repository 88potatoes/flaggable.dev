import { uuidv7 } from "uuidv7";

import { ApiError } from "@/lib/api";
import type { NewInternalKeyRecord, InternalKeyRecord } from "@/lib/db/schema";
import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";
import { DrizzleInternalKeyRepository, type InternalKeyRepository } from "./repo";

export type InternalKeyView = Pick<
  InternalKeyRecord,
  "id" | "projectId" | "name" | "createdAt" | "revokedAt"
> & { internalKey?: string };

/** Manages project-scoped internal API keys. Plaintext keys are returned only on creation. */
export class InternalKeyService {
  constructor(
    private readonly repository: InternalKeyRepository = new DrizzleInternalKeyRepository(),
    private readonly projects: ProjectRepository = new DrizzleProjectRepository(),
  ) {}

  list = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    await this.requireProject({ projectId, ownerId });
    return (await this.repository.listByProject({ projectId })).map(serializeInternalKey);
  };

  create = async ({
    projectId,
    ownerId,
    name = "Internal API Key",
  }: {
    projectId: string;
    ownerId: string;
    name?: string;
  }) => {
    await this.requireProject({ projectId, ownerId });
    const internalKey = `ik_${randomBytes(32)}`;
    const timestamp = new Date();
    const record: NewInternalKeyRecord = {
      id: uuidv7(),
      projectId,
      name,
      keyPlaintext: internalKey,
      createdAt: timestamp,
      revokedAt: null,
    };
    await this.repository.create({ record });
    return { ...serializeInternalKey(record as InternalKeyRecord), internalKey };
  };

  /** Resolves only active keys, so revoked keys cannot authorize devtool access. */
  resolve = async ({ internalKey }: { internalKey: string }) => {
    if (!/^ik_[A-Za-z0-9_-]{20,}$/.test(internalKey)) return undefined;
    return this.repository.findActiveByPlaintext({ keyPlaintext: internalKey });
  };

  revoke = async ({
    keyId,
    projectId,
    ownerId,
  }: {
    keyId: string;
    projectId: string;
    ownerId: string;
  }) => {
    await this.requireProject({ projectId, ownerId });
    const key = await this.repository.revoke({ keyId, projectId });
    if (!key) throw new ApiError(404, "Internal API key not found.");
    return serializeInternalKey(key);
  };

  private async requireProject({ projectId, ownerId }: { projectId: string; ownerId: string }) {
    const project = await this.projects.findById({ projectId });
    if (!project || project.ownerUserId !== ownerId) throw new ApiError(404, "Project not found.");
    if (project.archivedAt) throw new ApiError(409, "Project is archived.");
    return project;
  }
}

export const serializeInternalKey = (record: InternalKeyRecord): InternalKeyView => ({
  id: record.id,
  projectId: record.projectId,
  name: record.name,
  createdAt: record.createdAt,
  revokedAt: record.revokedAt,
  internalKey: record.keyPlaintext ?? undefined,
});

function randomBytes(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
