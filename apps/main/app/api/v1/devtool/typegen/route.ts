import { handleApiError } from "@/lib/api";
import { requireInternalKeyProject } from "@/lib/devtool-auth";
import { DrizzleFlagRepository } from "@/slices/flags/repo";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

export async function GET(request: Request) {
  try {
    const { project } = await requireInternalKeyProject(request);

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
