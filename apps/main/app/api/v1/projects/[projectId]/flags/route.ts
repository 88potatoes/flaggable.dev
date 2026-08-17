import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createFlagRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createFlagService, serializeFlag } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const flags = await createFlagService(getDb()).list(
      projectId,
      await requireUserId(),
    );
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
    const flag = await createFlagService(getDb()).create(
      projectId,
      await requireUserId(),
      body,
    );
    return Response.json(serializeFlag(flag), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
