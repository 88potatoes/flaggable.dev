import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateProjectRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createProjectService } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    return Response.json(await createProjectService(getDb()).get(projectId, await requireUserId()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const body = await parseJsonBody(request, updateProjectRequest);
    return Response.json(
      await createProjectService(getDb()).update(projectId, await requireUserId(), body.name),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    return Response.json(
      await createProjectService(getDb()).archive(projectId, await requireUserId()),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
