import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateFlagRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createFlagService, serializeFlag } from "@/lib/services";

export async function GET(_request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    return Response.json(
      serializeFlag(await createFlagService(getDb()).get(flagId, await requireUserId())),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ flagId: string }> }) {
  try {
    const { flagId } = await params;
    const body = await parseJsonBody(request, updateFlagRequest);
    const flag = await createFlagService(getDb()).update(flagId, await requireUserId(), body);
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
    const flag = await createFlagService(getDb()).archive(flagId, await requireUserId());
    return Response.json(serializeFlag(flag));
  } catch (error) {
    return handleApiError(error);
  }
}
