import { handleApiError, ApiError } from "@/lib/api";
import { DrizzleFlagRepository } from "@/slices/flags/repo";
import { InternalKeyService } from "@/slices/internal-keys/service";
import { DrizzleProjectRepository } from "@/slices/projects/repo";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

export async function GET(request: Request) {
  try {
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
    if (!key) {
      throw new ApiError(401, "Invalid or revoked internal API key.");
    }

    const project = await new DrizzleProjectRepository().findById({ projectId: key.projectId });
    if (!project || project.archivedAt) {
      throw new ApiError(401, "Project is archived or not found.");
    }

    const flagsRepo = new DrizzleFlagRepository();
    const schemaRepo = new DrizzleValueSchemaRepository();

    const { items: flags } = await flagsRepo.listByProject({
      projectId: project.id,
      limit: 1000,
    });

    const activeFlags = flags.filter((flag) => !flag.archivedAt);

    const schemaMap = new Map<string, unknown>();
    for (const flag of activeFlags) {
      if (!schemaMap.has(flag.valueSchemaId)) {
        const schemaRecord = await schemaRepo.findById({ schemaId: flag.valueSchemaId });
        if (schemaRecord) {
          try {
            schemaMap.set(flag.valueSchemaId, JSON.parse(schemaRecord.schemaJson));
          } catch {
            schemaMap.set(flag.valueSchemaId, { type: "unknown" });
          }
        }
      }
    }

    const resultFlags = activeFlags.map((flag) => ({
      id: flag.id,
      name: flag.name,
      description: flag.description ?? null,
      enabled: flag.enabled,
      schema: schemaMap.get(flag.valueSchemaId) ?? { type: "unknown" },
    }));

    return Response.json({
      projectId: project.id,
      projectName: project.name,
      flags: resultFlags,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
