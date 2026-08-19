import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createConditionRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { ConditionService, serializeCondition } from "@/slices/conditions/service";
import { DrizzleConditionRepository } from "@/slices/conditions/repo";
import { DrizzleFlagRepository } from "@/slices/flags/repo";
import { DrizzleProjectRepository } from "@/slices/projects/repo";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

export async function GET(_request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    const conditions = await new ConditionService(
      new DrizzleConditionRepository(getDb()),
      new DrizzleFlagRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
    ).list({ flagId, ownerId: await requireUserId() });
    return Response.json(conditions.map(serializeCondition));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    const body = await parseJsonBody(request, createConditionRequest);
    const condition = await new ConditionService(
      new DrizzleConditionRepository(getDb()),
      new DrizzleFlagRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
    ).create({ flagId, ownerId: await requireUserId(), values: body });
    return Response.json(serializeCondition(condition), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
