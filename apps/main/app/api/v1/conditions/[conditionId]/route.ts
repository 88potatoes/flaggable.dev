import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateConditionRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createConditionService, serializeCondition } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conditionId: string }> },
) {
  try {
    const { conditionId } = await params;
    return Response.json(
      serializeCondition(
        await createConditionService(getDb()).get(conditionId, await requireUserId()),
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
    const condition = await createConditionService(getDb()).update(
      conditionId,
      await requireUserId(),
      body,
    );
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
