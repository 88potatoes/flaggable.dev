import { uuidv7 } from "uuidv7";

import { ApiError } from "@/lib/api";
import type { NewPublicKeyRecord, PublicKeyRecord } from "@/lib/db/schema";
import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";
import { DrizzlePublicKeyRepository, type PublicKeyRepository } from "./repo";

export type PublicKeyView = Pick<PublicKeyRecord, "id" | "projectId" | "createdAt" | "revokedAt">;

/** Manages project-scoped public keys. Plaintext keys are returned only on creation. */
export class PublicKeyService {
  constructor(
    private readonly repository: PublicKeyRepository = new DrizzlePublicKeyRepository(),
    private readonly projects: ProjectRepository = new DrizzleProjectRepository(),
  ) {}

  list = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    await this.requireProject({ projectId, ownerId });
    return (await this.repository.listByProject({ projectId })).map(serializePublicKey);
  };

  create = async ({ projectId, ownerId }: { projectId: string; ownerId: string }) => {
    await this.requireProject({ projectId, ownerId });
    const publicKey = `pk_${randomBytes(32)}`;
    const timestamp = new Date();
    const record: NewPublicKeyRecord = {
      id: uuidv7(),
      projectId,
      keyHash: await hashPublicKey(publicKey),
      createdAt: timestamp,
      revokedAt: null,
    };
    await this.repository.create({ record });
    return { ...serializePublicKey(record as PublicKeyRecord), publicKey };
  };

  /** Resolves only active keys, so revoked keys cannot authorize evaluation. */
  resolve = async ({ publicKey }: { publicKey: string }) => {
    if (!/^pk_[A-Za-z0-9_-]{20,}$/.test(publicKey)) return undefined;
    return this.repository.findActiveByHash({ keyHash: await hashPublicKey(publicKey) });
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
    if (!key) throw new ApiError(404, "Public key not found.");
    return serializePublicKey(key);
  };

  private async requireProject({ projectId, ownerId }: { projectId: string; ownerId: string }) {
    const project = await this.projects.findById({ projectId });
    if (!project || project.ownerUserId !== ownerId) throw new ApiError(404, "Project not found.");
    if (project.archivedAt) throw new ApiError(409, "Project is archived.");
    return project;
  }
}

export const serializePublicKey = (record: PublicKeyRecord): PublicKeyView => ({
  id: record.id,
  projectId: record.projectId,
  createdAt: record.createdAt,
  revokedAt: record.revokedAt,
});

function randomBytes(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function hashPublicKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}
