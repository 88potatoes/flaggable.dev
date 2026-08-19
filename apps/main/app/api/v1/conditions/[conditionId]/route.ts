import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateConditionRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { ConditionService, serializeCondition } from "@/slices/conditions/service";
import { DrizzleConditionRepository } from "@/slices/conditions/repo";
import { DrizzleFlagRepository } from "@/slices/flags/repo";
import { DrizzleProjectRepository } from "@/slices/projects/repo";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conditionId: string }> },
) {
  try {
    const { conditionId } = await params;
    return Response.json(
      serializeCondition(
        await new ConditionService(
          new DrizzleConditionRepository(getDb()),
          new DrizzleFlagRepository(getDb()),
          new DrizzleValueSchemaRepository(getDb()),
          new DrizzleProjectRepository(getDb()),
        ).get({ conditionId, ownerId: await requireUserId() }),
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conditionId: string }> },
) {
  try {
    const { conditionId } = await params;
    const body = await parseJsonBody(request, updateConditionRequest);
    const condition = await new ConditionService(
      new DrizzleConditionRepository(getDb()),
      new DrizzleFlagRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
    ).update({ conditionId, ownerId: await requireUserId(), values: body });
    return Response.json(serializeCondition(condition));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  return Response.json(
    { error: "Conditions cannot be deleted; disable them instead." },
    { status: 405 },
  );
}
