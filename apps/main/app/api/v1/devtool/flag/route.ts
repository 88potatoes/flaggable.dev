import { ApiError, handleApiError, parseJsonBody } from "@/lib/api";
import { createDevtoolFlagRequest } from "@/lib/api-schemas";
import { requireInternalKeyProject } from "@/lib/devtool-auth";
import { FlagService, serializeFlag } from "@/slices/flags/service";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

/** Create a flag in the project associated with an internal API key. */
export async function POST(request: Request) {
  try {
    const { project } = await requireInternalKeyProject(request);
    const body = await parseJsonBody(request, createDevtoolFlagRequest);
    const valueSchemaId =
      body.valueSchemaId ??
      (await new DrizzleValueSchemaRepository().listByProject({ projectId: project.id }))[0]?.id;

    if (!valueSchemaId) {
      throw new ApiError(400, "The project has no value schema. Provide valueSchemaId explicitly.");
    }

    const flag = await new FlagService().create({
      projectId: project.id,
      // The project was resolved from the internal key, so its owner is the service owner.
      ownerId: project.ownerUserId,
      values: { ...body, valueSchemaId },
    });
    return Response.json(serializeFlag(flag), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
