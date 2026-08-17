import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createConditionRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createConditionService, serializeCondition } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ flagId: string }> },
) {
  try {
    const { flagId } = await params;
    const conditions = await createConditionService(getDb()).list(
      flagId,
      await requireUserId(),
    );
    return Response.json(conditions.map(serializeCondition));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ flagId: string }> },
) {
  try {
    const { flagId } = await params;
    const body = await parseJsonBody(request, createConditionRequest);
    const condition = await createConditionService(getDb()).create(
      flagId,
      await requireUserId(),
      body,
    );
    return Response.json(serializeCondition(condition), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
