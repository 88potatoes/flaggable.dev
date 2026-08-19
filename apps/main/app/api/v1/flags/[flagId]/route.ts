import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateFlagRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { FlagService, serializeFlag } from "@/slices/flags/service";
import { DrizzleFlagRepository } from "@/slices/flags/repo";
import { DrizzleProjectRepository } from "@/slices/projects/repo";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

export async function GET(_request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    return Response.json(
      serializeFlag(
        await new FlagService(
          new DrizzleFlagRepository(getDb()),
          new DrizzleProjectRepository(getDb()),
          new DrizzleValueSchemaRepository(getDb()),
        ).get({ flagId, ownerId: await requireUserId() }),
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    const body = await parseJsonBody(request, updateFlagRequest);
    const flag = await new FlagService(
      new DrizzleFlagRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
    ).update({ flagId, ownerId: await requireUserId(), values: body });
    return Response.json(serializeFlag(flag));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ flagId: string }> },
) {
  try {
    const { flagId } = await params;
    const flag = await new FlagService(
      new DrizzleFlagRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
    ).archive({ flagId, ownerId: await requireUserId() });
    return Response.json(serializeFlag(flag));
  } catch (error) {
    return handleApiError(error);
  }
}
