import { ApiError } from "@/lib/api";
import { InternalKeyService } from "@/slices/internal-keys/service";
import { DrizzleProjectRepository } from "@/slices/projects/repo";

/** Authenticates an internal API key and returns its active project context. */
export async function requireInternalKeyProject(request: Request) {
  const internalKeyHeader =
    request.headers.get("x-flaggable-internal-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!internalKeyHeader?.trim()) {
    throw new ApiError(
      401,
      "Missing internal API key. Provide header 'X-Flaggable-Internal-API-Key' or 'Authorization: Bearer <key>'.",
    );
  }

  const key = await new InternalKeyService().resolve({ internalKey: internalKeyHeader.trim() });
  if (!key) throw new ApiError(401, "Invalid or revoked internal API key.");

  const project = await new DrizzleProjectRepository().findById({ projectId: key.projectId });
  if (!project || project.archivedAt) {
    throw new ApiError(401, "Project is archived or not found.");
  }

  return { key, project };
}
