import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateProjectRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { ProjectService } from "@/slices/projects/service";
import { DrizzleProjectRepository } from "@/slices/projects/repo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    return Response.json(
      await new ProjectService(new DrizzleProjectRepository(getDb())).get({
        projectId,
        ownerId: await requireUserId(),
      }),
    );
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
      await new ProjectService(new DrizzleProjectRepository(getDb())).update({
        projectId,
        ownerId: await requireUserId(),
        name: body.name,
      }),
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
      await new ProjectService(new DrizzleProjectRepository(getDb())).archive({
        projectId,
        ownerId: await requireUserId(),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
