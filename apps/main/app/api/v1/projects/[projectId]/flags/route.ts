import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createFlagRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { FlagService, serializeFlag } from "@/slices/flags/service";
import { DrizzleFlagRepository } from "@/slices/flags/repo";
import { DrizzleProjectRepository } from "@/slices/projects/repo";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const flags = await new FlagService(
      new DrizzleFlagRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
    ).list({ projectId, ownerId: await requireUserId() });
    return Response.json(flags.map(serializeFlag));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const body = await parseJsonBody(request, createFlagRequest);
    const flag = await new FlagService(
      new DrizzleFlagRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
      new DrizzleValueSchemaRepository(getDb()),
    ).create({ projectId, ownerId: await requireUserId(), values: body });
    return Response.json(serializeFlag(flag), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
