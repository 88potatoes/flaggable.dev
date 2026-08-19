import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createConditionRequest } from "@/lib/api-schemas";
import { ConditionService, serializeCondition } from "@/slices/conditions/service";

export async function GET(_request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    const conditions = await new ConditionService().list({
      flagId,
      ownerId: await requireUserId(),
    });
    return Response.json(conditions.map(serializeCondition));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    const body = await parseJsonBody(request, createConditionRequest);
    const condition = await new ConditionService().create({
      flagId,
      ownerId: await requireUserId(),
      values: body,
    });
    return Response.json(serializeCondition(condition), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
